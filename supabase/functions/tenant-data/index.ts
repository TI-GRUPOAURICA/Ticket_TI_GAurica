import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, accept, accept-profile, content-profile, range, range-unit, x-upsert",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "content-range, preference-applied, location",
};

const TABLAS_EMPRESA = new Set([
  "tickets", "colaboradores", "impresoras", "radios",
  "equipos_celulares", "cuentas_correo", "m365_usuarios",
]);
const TABLAS_HOST = new Set([
  "equipos", "equipos_estado", "software_instalado", "analisis_ia",
]);
const TABLAS_SOLO_ADMIN = new Set(["accesos_empresa", "m365_licencias"]);
const DOMINIOS_EMPRESA: Record<string, string[]> = {
  AURICA: ["auricasac.com", "auricape.onmicrosoft.com", "aurica.com"],
  ALENCORSRL: ["alencorsrl.com"],
  GIANLU: ["gianlusac.com"],
  MAPAJOYA: ["mapajoya.com"],
  METALAB: ["metalabsac.com"],
  MINERALAB: ["mineralabsac.com"],
  TERRIMETAL: ["terrimetalsac.com"],
};

type Acceso = {
  correo: string;
  rol: "admin_global" | "ti_empresa" | "colaborador" | "solicitante";
  empresa: string | null;
  host?: string | null;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

async function obtenerIdentidad(req: Request): Promise<Acceso | null> {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const meResponse = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName",
    { headers: { Authorization: authorization } },
  );
  if (!meResponse.ok) return null;
  const me = await meResponse.json();
  const correos = [me.mail, me.userPrincipalName].filter(Boolean).map((c: string) => c.trim().toLowerCase());
  if (!correos.length) return null;
  const correo = correos[0];
  const { data: permiso, error: errorPermiso } = await supabase
    .from("accesos_empresa")
    .select("correo, rol, empresa, activo")
    .in("correo", correos)
    .maybeSingle();
  if (errorPermiso) throw errorPermiso;
  if (permiso?.activo) return permiso;

  const dominiosUsuario = correos.map((c) => c.split("@")[1]);
  const empresaPorCorreo = Object.entries(DOMINIOS_EMPRESA)
    .find(([, dominios]) => dominiosUsuario.some((dominio) => dominios.includes(dominio)))?.[0] || null;
  const { data: colaborador, error: errorColaborador } = await supabase
    .from("colaboradores")
    .select("empresa, host, correo")
    .in("correo", correos)
    .maybeSingle();
  if (errorColaborador) throw errorColaborador;
  if (colaborador) {
    return {
      correo: colaborador.correo || correo,
      rol: "colaborador",
      empresa: colaborador.empresa || empresaPorCorreo,
      host: colaborador.host || null,
    };
  }

  const empresa = Object.entries(DOMINIOS_EMPRESA)
    .find(([, dominios]) => dominiosUsuario.some((dominio) => dominios.includes(dominio)))?.[0] || null;
  if (!empresa) return null;
  return { correo, rol: "solicitante", empresa };
}

async function obtenerHosts(empresa: string) {
  const hosts: string[] = [];
  let desde = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("host")
      .eq("empresa", empresa)
      .range(desde, desde + 999);
    if (error) throw error;
    hosts.push(...(data || []).map((fila: any) => String(fila.host || "").trim()).filter(Boolean));
    if (!data || data.length < 1000) break;
    desde += 1000;
  }
  return hosts;
}

async function obtenerCuentas(empresa: string) {
  const { data, error } = await supabase
    .from("cuentas_correo")
    .select("id")
    .eq("empresa", empresa);
  if (error) throw error;
  return (data || []).map((fila: any) => String(fila.id));
}

function agregarFiltroLista(url: URL, columna: string, valores: string[]) {
  const filtro = valores.length
    ? `in.(${valores.map((valor) => `"${valor.replaceAll('"', '\\"')}"`).join(",")})`
    : "eq.__sin_acceso__";
  url.searchParams.set(columna, filtro);
}

async function autorizarSolicitud(
  identidad: Acceso,
  tabla: string,
  method: string,
  url: URL,
  bodyText: string,
) {
  if (identidad.rol === "admin_global") return { permitido: true, bodyText };
  if (!identidad.empresa) return { permitido: false, status: 403 };
  if (TABLAS_SOLO_ADMIN.has(tabla)) return { permitido: false, status: 403 };

  if (identidad.rol === "colaborador") {
    if (tabla === "categorias" && method === "GET") return { permitido: true, bodyText };
    if (tabla === "colaboradores" && method === "GET") {
      url.searchParams.set("correo", `eq.${identidad.correo}`);
      if (url.searchParams.get("select") === "*") {
        url.searchParams.set("select", "id,empresa,host,colaborador,correo,anydesk,tipo");
      }
      return { permitido: true, bodyText };
    }
    if (tabla === "tickets" && method === "GET") {
      if (!identidad.host) return { permitido: false, status: 403 };
      url.searchParams.set("hostname", `eq.${identidad.host}`);
      return { permitido: true, bodyText };
    }
    if (tabla === "tickets" && method === "POST") {
      if (!identidad.host) return { permitido: false, status: 403 };
      try {
        const original = JSON.parse(bodyText || "{}");
        const filas = Array.isArray(original) ? original : [original];
        if (filas.some((fila: any) => fila.hostname && fila.hostname !== identidad.host)) {
          return { permitido: false, status: 403 };
        }
        const corregidas = filas.map((fila: any) => ({
          ...fila,
          empresa: identidad.empresa,
          hostname: identidad.host,
        }));
        return { permitido: true, bodyText: JSON.stringify(Array.isArray(original) ? corregidas : corregidas[0]) };
      } catch {
        return { permitido: false, status: 400 };
      }
    }
    return { permitido: false, status: 403 };
  }

  if (identidad.rol === "solicitante") {
    if (tabla === "categorias" && method === "GET") return { permitido: true, bodyText };
    if (tabla === "colaboradores" && method === "GET") {
      url.searchParams.set("empresa", `eq.${identidad.empresa}`);
      if (url.searchParams.get("select") === "*") {
        url.searchParams.set("select", "id,empresa,host,colaborador,correo,tipo");
      }
      return { permitido: true, bodyText };
    }
    if (tabla === "tickets" && method === "GET") {
      url.searchParams.set("empresa", `eq.${identidad.empresa}`);
      return { permitido: true, bodyText };
    }
    if (tabla === "tickets" && method === "POST") {
      try {
        const original = JSON.parse(bodyText || "{}");
        const filas = Array.isArray(original) ? original : [original];
        for (const fila of filas) {
          if (!fila.hostname) return { permitido: false, status: 400 };
          const { data: equipo, error } = await supabase
            .from("colaboradores")
            .select("host, empresa, colaborador")
            .eq("empresa", identidad.empresa)
            .eq("host", String(fila.hostname))
            .maybeSingle();
          if (error) throw error;
          if (!equipo || (fila.nombre_colaborador && fila.nombre_colaborador !== equipo.colaborador)) {
            return { permitido: false, status: 403 };
          }
          fila.empresa = identidad.empresa;
        }
        return { permitido: true, bodyText: JSON.stringify(Array.isArray(original) ? filas : filas[0]) };
      } catch {
        return { permitido: false, status: 400 };
      }
    }
    return { permitido: false, status: 403 };
  }
  if (TABLAS_EMPRESA.has(tabla)) {
    url.searchParams.set("empresa", `eq.${identidad.empresa}`);
    if (["POST", "PATCH", "PUT"].includes(method) && bodyText) {
      try {
        const original = JSON.parse(bodyText);
        const filas = Array.isArray(original) ? original : [original];
        const corregidas = filas.map((fila: any) => ({ ...fila, empresa: identidad.empresa }));
        bodyText = JSON.stringify(Array.isArray(original) ? corregidas : corregidas[0]);
      } catch {
        return { permitido: false, status: 400 };
      }
    }
    if (tabla === "m365_usuarios" && method !== "GET") return { permitido: false, status: 403 };
    return { permitido: true, bodyText };
  }

  if (TABLAS_HOST.has(tabla)) {
    const hosts = identidad.host
      ? identidad.rol === "colaborador" ? [identidad.host] : await obtenerHosts(identidad.empresa)
      : await obtenerHosts(identidad.empresa);
    agregarFiltroLista(url, "hostname", hosts);
    if (["POST", "PATCH", "PUT"].includes(method) && bodyText) {
      try {
        const original = JSON.parse(bodyText);
        const filas = Array.isArray(original) ? original : [original];
        if (filas.some((fila: any) => (method === "POST" || method === "PUT") ? (!fila.hostname || !hosts.includes(String(fila.hostname))) : (fila.hostname && !hosts.includes(String(fila.hostname))))) {
          return { permitido: false, status: 403 };
        }
      } catch {
        return { permitido: false, status: 400 };
      }
    }
    return { permitido: true, bodyText };
  }

  if (tabla === "licencias_correo") {
    const ids = await obtenerCuentas(identidad.empresa);
    agregarFiltroLista(url, "cuenta_id", ids);
    if (["POST", "PATCH", "PUT"].includes(method) && bodyText) {
      try {
        const original = JSON.parse(bodyText);
        const filas = Array.isArray(original) ? original : [original];
        if (filas.some((fila: any) => (method === "POST" && (!fila.cuenta_id || !ids.includes(String(fila.cuenta_id)))) || (fila.cuenta_id && !ids.includes(String(fila.cuenta_id))))) {
          return { permitido: false, status: 403 };
        }
      } catch {
        return { permitido: false, status: 400 };
      }
    }
    return { permitido: true, bodyText };
  }

  if (tabla === "profiles" && method === "GET") {
    const dominios = DOMINIOS_EMPRESA[identidad.empresa] || [];
    if (!dominios.length) return { permitido: false, status: 403 };
    url.searchParams.set("or", `(${dominios.map((dominio) => `email.ilike.*@${dominio}`).join(",")})`);
    return { permitido: true, bodyText };
  }

  if (tabla === "categorias" && method === "GET") return { permitido: true, bodyText };
  return { permitido: false, status: 403 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Método no permitido." }, 405);

  try {
    const identidad = await obtenerIdentidad(req);
    if (!identidad) return json({ message: "No tienes acceso a los datos del portal." }, 403);
    const original = await req.json();
    const method = String(original.method || "GET").toUpperCase();
    const path = String(original.path || "");
    if (!/^\/rest\/v1\/[a-zA-Z0-9_]+$/.test(path)) return json({ message: "Ruta de datos no permitida." }, 400);

    const tabla = path.split("/").at(-1)!;
    const url = new URL(`${supabaseUrl}${path}${String(original.search || "")}`);
    const requestBody = typeof original.body === "string" ? original.body : "";
    const autorizacion = await autorizarSolicitud(identidad, tabla, method, url, requestBody);
    if (!autorizacion.permitido) return json({ message: "No tienes permiso para esta operación." }, autorizacion.status || 403);

    const headers = new Headers({
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    });
    const forwardHeaders = original.headers || {};
    for (const name of ["accept", "accept-profile", "content-profile", "content-type", "prefer", "range", "range-unit", "if-match", "if-none-match"]) {
      if (forwardHeaders[name]) headers.set(name, String(forwardHeaders[name]));
    }

    const upstream = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : autorizacion.bodyText,
    });
    const responseHeaders = new Headers(corsHeaders);
    for (const name of ["content-type", "content-range", "preference-applied", "location", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error("Error en tenant-data:", error);
    return json({ message: error instanceof Error ? error.message : "Error interno." }, 500);
  }
});
