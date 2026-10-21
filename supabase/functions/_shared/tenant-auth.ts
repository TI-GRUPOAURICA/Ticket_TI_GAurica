import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export type AccesoTI = {
  correo: string;
  rol: "admin_global" | "ti_empresa";
  empresa: string | null;
};

export async function autenticarTI(req: Request): Promise<AccesoTI | null> {
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

  for (const correo of correos) {
    const { data, error } = await supabase
      .from("accesos_empresa")
      .select("correo, rol, empresa, activo")
      .eq("correo", correo)
      .maybeSingle();
    if (error) throw error;
    if (!data?.activo) continue;
    if (data.rol === "admin_global") {
      return { correo: data.correo, rol: "admin_global", empresa: null };
    }
    if (data.rol === "ti_empresa" && data.empresa) {
      return { correo: data.correo, rol: "ti_empresa", empresa: data.empresa };
    }
  }
  return null;
}