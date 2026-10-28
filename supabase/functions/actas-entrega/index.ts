import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "actas-entrega";
const NADIA = "asistenterrhh@auricasac.com";
const MAX_BYTES = 10 * 1024 * 1024;

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
  const correos = [me.mail, me.userPrincipalName]
    .filter(Boolean)
    .map((correo: string) => correo.trim().toLowerCase());
  if (!correos.length) return null;

  const { data: permiso, error } = await supabase
    .from("accesos_empresa")
    .select("rol, activo")
    .in("correo", correos)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw error;

  return {
    correo: correos[0],
    esNadia: correos.includes(NADIA),
    esAdminGlobal: permiso?.rol === "admin_global",
  };
}

function validarFecha(fecha: unknown) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(fecha + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === fecha;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const usuario = await autenticar(req);
    if (!usuario) return json({ error: "La sesión de Microsoft no es válida." }, 401);
    if (!usuario.esNadia && !usuario.esAdminGlobal) {
      return json({ error: "No tienes permiso para consultar actas." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "listar") {
      const { data, error } = await supabase
        .from("actas_entrega")
        .select("id, nombre_colaborador, dni, empresa, fecha_entrega, nombre_archivo, tamano_bytes, cargado_por, creado_en")
        .order("fecha_entrega", { ascending: false })
        .order("creado_en", { ascending: false })
        .limit(500);
      if (error) throw error;
      return json({ actas: data || [] });
    }

    if (action === "preparar-carga") {
      if (!usuario.esNadia && !usuario.esAdminGlobal) return json({ error: "Solo Nadia o un administrador global puede subir actas." }, 403);
      const nombreArchivo = String(body.nombreArchivo || "").trim();
      const tamanoBytes = Number(body.tamanoBytes || 0);
      if (!nombreArchivo.toLowerCase().endsWith(".pdf") ||
          body.tipoArchivo !== "application/pdf" ||
          tamanoBytes <= 0 || tamanoBytes > MAX_BYTES) {
        return json({ error: "Selecciona un PDF de hasta 10 MB." }, 400);
      }
      const nombreSeguro = nombreArchivo
        .replace(/[^\w.-]+/g, "_")
        .replace(/_+/g, "_")
        .slice(-100);
      const rutaArchivo = "nadia/" + crypto.randomUUID() + "-" + nombreSeguro;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(rutaArchivo);
      if (error) throw error;
      return json({ rutaArchivo, token: data.token });
    }

    if (action === "registrar") {
      if (!usuario.esNadia && !usuario.esAdminGlobal) return json({ error: "Solo Nadia o un administrador global puede registrar actas." }, 403);
      const nombreColaborador = String(body.nombreColaborador || "").trim();
      const dni = String(body.dni || "").trim();
      const empresa = String(body.empresa || "").trim();
      const nombreArchivo = String(body.nombreArchivo || "").trim();
      const rutaArchivo = String(body.rutaArchivo || "").trim();
      const tamanoBytes = Number(body.tamanoBytes || 0);
      if (!nombreColaborador || !dni || !empresa || !nombreArchivo ||
          !validarFecha(body.fechaEntrega) ||
          !rutaArchivo.startsWith("nadia/") ||
          !nombreArchivo.toLowerCase().endsWith(".pdf") ||
          tamanoBytes <= 0 || tamanoBytes > MAX_BYTES) {
        return json({ error: "Revisa los datos del acta y vuelve a intentarlo." }, 400);
      }
      const { data: archivo, error: errorArchivo } = await supabase.storage
        .from(BUCKET)
        .download(rutaArchivo);
      if (errorArchivo || !archivo) {
        return json({ error: "No se encontró el PDF cargado. Intenta subirlo nuevamente." }, 400);
      }
      const contenido = new Uint8Array(await archivo.arrayBuffer());
      const firmaPdf = new TextDecoder().decode(contenido.slice(0, 5));
      if (contenido.length > MAX_BYTES || firmaPdf !== "%PDF-") {
        await supabase.storage.from(BUCKET).remove([rutaArchivo]);
        return json({ error: "El archivo no es un PDF válido o supera 10 MB." }, 400);
      }
      const { data, error } = await supabase
        .from("actas_entrega")
        .insert({
          nombre_colaborador: nombreColaborador,
          dni,
          empresa,
          fecha_entrega: body.fechaEntrega,
          nombre_archivo: nombreArchivo,
          ruta_archivo: rutaArchivo,
          tamano_bytes: contenido.length,
          cargado_por: usuario.correo,
        })
        .select("id")
        .single();
      if (error) throw error;
      return json({ success: true, id: data.id });
    }

    if (action === "descargar") {
      const id = String(body.id || "");
      const { data: acta, error: errorActa } = await supabase
        .from("actas_entrega")
        .select("ruta_archivo")
        .eq("id", id)
        .maybeSingle();
      if (errorActa) throw errorActa;
      if (!acta) return json({ error: "No se encontró el acta." }, 404);
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(acta.ruta_archivo, 60);
      if (error) throw error;
      return json({ url: data.signedUrl });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("Error en actas-entrega:", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo procesar la solicitud." }, 500);
  }
});