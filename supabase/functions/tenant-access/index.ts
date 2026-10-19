import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const EMPRESAS = new Set([
  "AURICA",
  "METALAB",
  "MINERALAB",
  "GIANLU",
  "TERRIMETAL",
  "ALENCORSRL",
  "MAPAJOYA",
]);

const DOMINIOS_EMPRESA: Record<string, string[]> = {
  AURICA: ["auricasac.com", "auricape.onmicrosoft.com", "aurica.com"],
  ALENCORSRL: ["alencorsrl.com"],
  GIANLU: ["gianlusac.com"],
  MAPAJOYA: ["mapajoya.com"],
  METALAB: ["metalabsac.com"],
  MINERALAB: ["mineralabsac.com"],
  TERRIMETAL: ["terrimetalsac.com"],
};

function empresaPorDominio(correos: string[]) {
  for (const correo of correos) {
    const dominio = correo.split("@")[1];
    const empresa = Object.entries(DOMINIOS_EMPRESA).find(([, dominios]) => dominios.includes(dominio))?.[0];
    if (empresa) return empresa;
  }
  return null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function autenticar(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName",
    { headers: { Authorization: authorization } },
  );
  if (!response.ok) return null;

  const me = await response.json();
  const correos = [me.mail, me.userPrincipalName].filter(Boolean).map((c: string) => c.trim().toLowerCase());
  return correos.length ? { correo: correos[0], correos } : null;
}

async function accesoDe(correos: string[]) {
  for (const correo of correos) {
    const { data, error } = await supabase.from("accesos_empresa")
      .select("correo, rol, empresa, activo").eq("correo", correo).maybeSingle();
    if (error) throw error;
    if (data?.activo) return data;
  }
  return null;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const usuario = await autenticar(req);
    if (!usuario) return json({ error: "La sesión de Microsoft no es válida o expiró." }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "me");
    const acceso = await accesoDe(usuario.correos);

    if (action === "me") {
      if (acceso) return json({ success: true, usuario: acceso });

      // El acceso básico de colaborador conserva el portal de tickets,
      // pero no concede acceso al panel administrativo.
      const { data: colaborador, error } = await supabase
        .from("colaboradores")
        .select("id, empresa, host, colaborador, correo, anydesk, tipo")
        .in("correo", usuario.correos)
        .maybeSingle();
      if (error) throw error;

      const empresa = colaborador?.empresa || empresaPorDominio(usuario.correos);
      return json({
        success: true,
        usuario: {
          correo: colaborador?.correo || usuario.correo,
          rol: colaborador ? "colaborador" : "solicitante",
          empresa,
          colaborador: colaborador || null,
          activo: Boolean(empresa),
        },
      });
    }

    if (acceso?.rol !== "admin_global") {
      return json({ error: "Solo un administrador global puede gestionar permisos." }, 403);
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("accesos_empresa")
        .select("correo, rol, empresa, activo, creado_en, actualizado_en")
        .order("empresa", { ascending: true })
        .order("correo", { ascending: true });
      if (error) throw error;
      return json({ success: true, accesos: data || [] });
    }

    if (action === "save") {
      const correo = String(body.correo || "").trim().toLowerCase();
      const empresaSeleccionada = String(body.empresa || "").trim();
      const esAdminGlobal = empresaSeleccionada === "__admin_global__";
      const empresa = esAdminGlobal ? null : empresaSeleccionada.toUpperCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return json({ error: "Ingresa un correo válido." }, 400);
      }
      if (!esAdminGlobal && !EMPRESAS.has(empresa)) return json({ error: "La empresa seleccionada no es válida." }, 400);
      const registro = {
        correo,
        rol: esAdminGlobal ? "admin_global" : "ti_empresa",
        empresa,
        activo: body.activo !== false,
        actualizado_en: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("accesos_empresa")
        .upsert(registro, { onConflict: "correo" })
        .select("correo, rol, empresa, activo, creado_en, actualizado_en")
        .single();
      if (error) throw error;
      return json({ success: true, acceso: data });
    }

    if (action === "delete") {
      const correo = String(body.correo || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return json({ error: "Ingresa un correo válido." }, 400);
      }
      const { data, error } = await supabase
        .from("accesos_empresa")
        .delete()
        .eq("correo", correo)
        .eq("rol", "ti_empresa")
        .select("correo")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "No se encontró un acceso de TI de empresa." }, 404);
      return json({ success: true, correo: data.correo });
    }
    if (action === "set-active") {
      const correo = String(body.correo || "").trim().toLowerCase();
      if (!correo) return json({ error: "Falta el correo." }, 400);
      const { data, error } = await supabase
        .from("accesos_empresa")
        .update({ activo: Boolean(body.activo), actualizado_en: new Date().toISOString() })
        .eq("correo", correo)
        .eq("rol", "ti_empresa")
        .select("correo, rol, empresa, activo, creado_en, actualizado_en")
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "No se encontró un acceso de TI de empresa." }, 404);
      return json({ success: true, acceso: data });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("Error en tenant-access:", error);
    return json({ error: error instanceof Error ? error.message : "Error interno." }, 500);
  }
});
