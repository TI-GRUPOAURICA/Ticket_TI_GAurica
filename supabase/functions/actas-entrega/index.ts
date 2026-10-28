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
const EMPRESAS = new Set(["AURICA", "METALAB", "MINERALAB", "GIANLU", "TERRIMETAL", "ALENCORSRL", "MAPAJOYA"]);
const TIPOS_ACTA = new Set(["Entrega inicial", "Entrega adicional"]);

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

async function analizarActaPdf(archivo: Blob, nombreArchivo: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Falta configurar OPENAI_API_KEY como secreto de Supabase.");
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const partes: string[] = [];
  for (let i = 0; i < bytes.length; i += 0x8000) partes.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
  const pdfBase64 = btoa(partes.join(""));
  const empresas = ["AURICA", "METALAB", "MINERALAB", "GIANLU", "TERRIMETAL", "ALENCORSRL", "MAPAJOYA"];
  const confianza = { type: "string", enum: ["alta", "media", "baja"] };
  const textoNullable = { type: ["string", "null"] };
  const schema = {
    type: "object", additionalProperties: false,
    required: ["esActa", "nombreColaborador", "confianzaNombre", "dni", "confianzaDni", "empresa", "confianzaEmpresa", "fechaEntrega", "confianzaFecha", "equipos"],
    properties: {
      esActa: { type: "boolean" }, nombreColaborador: textoNullable, confianzaNombre: confianza,
      dni: textoNullable, confianzaDni: confianza,
      empresa: { type: ["string", "null"], enum: [...empresas, null] }, confianzaEmpresa: confianza,
      fechaEntrega: textoNullable, confianzaFecha: confianza,
      equipos: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["tipo", "descripcion", "identificador", "confianzaIdentificador"],
        properties: { tipo: { type: "string" }, descripcion: { type: "string" }, identificador: textoNullable, confianzaIdentificador: confianza },
      } },
    },
  };
  const respuesta = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_ACTAS_MODEL") || "gpt-4.1-mini", store: false, max_output_tokens: 2500,
      input: [{ role: "user", content: [
        { type: "input_file", filename: nombreArchivo, file_data: `data:application/pdf;base64,${pdfBase64}`, detail: "high" },
        { type: "input_text", text: "Lee esta guía de entrega de equipos. Extrae solo datos presentes en el documento; nunca inventes. Devuelve una fila por cada equipo o accesorio. Copia serie, IMEI o código exactamente; usa null si no hay o no se lee. No deduzcas empresa si no aparece claramente. Pon confianza baja si hay duda. Si no es un acta/guía de entrega, marca esActa=false y deja los datos nulos o la lista de equipos vacía." },
      ] }],
      text: { format: { type: "json_schema", name: "acta_entrega", strict: true, schema } },
    }),
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    console.error("Error del servicio de lectura de actas:", respuesta.status);
    throw new Error(respuesta.status === 401 ? "La clave de lectura no es válida." : "No se pudo leer el PDF automáticamente. Puedes completar los campos manualmente.");
  }
  const texto = (cuerpo.output || []).flatMap((item: any) => item.content || []).find((item: any) => item.type === "output_text")?.text;
  if (!texto) throw new Error("No se reconocieron datos. Puedes completar los campos manualmente.");
  return JSON.parse(texto);
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
        .select("id, nombre_colaborador, dni, empresa, tipo_acta, fecha_entrega, nombre_archivo, tamano_bytes, cargado_por, creado_en, equipos:actas_entrega_equipos(tipo, descripcion, identificador)")
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

    if (action === "analizar") {
      if (!usuario.esNadia && !usuario.esAdminGlobal) return json({ error: "Solo Nadia o un administrador global puede analizar actas." }, 403);
      const rutaArchivo = String(body.rutaArchivo || "").trim();
      if (!rutaArchivo.startsWith("nadia/")) return json({ error: "La ruta del PDF no es válida." }, 400);
      const { data: archivo, error } = await supabase.storage.from(BUCKET).download(rutaArchivo);
      if (error || !archivo) return json({ error: "No se encontró el PDF. Vuelve a seleccionarlo." }, 404);
      if (archivo.size > MAX_BYTES) return json({ error: "El PDF supera el máximo de 10 MB." }, 400);
      const bytes = new Uint8Array(await archivo.slice(0, 5).arrayBuffer());
      if (new TextDecoder().decode(bytes) !== "%PDF-") return json({ error: "El archivo seleccionado no es un PDF válido." }, 400);
      try {
        const datos = await analizarActaPdf(archivo, String(body.nombreArchivo || "acta.pdf").slice(0, 150));
        return json({ datos });
      } catch (errorAnalisis) {
        const mensaje = errorAnalisis instanceof Error ? errorAnalisis.message : "No se pudo analizar el PDF.";
        return json({ error: mensaje }, mensaje.includes("Falta configurar") ? 503 : 502);
      }
    }

    if (action === "registrar") {
      if (!usuario.esNadia && !usuario.esAdminGlobal) return json({ error: "Solo Nadia o un administrador global puede registrar actas." }, 403);
      const nombreColaborador = String(body.nombreColaborador || "").trim();
      const dni = String(body.dni || "").trim();
      const empresa = String(body.empresa || "").trim().toUpperCase();
      const tipoActa = String(body.tipoActa || "").trim();
      const equipos = Array.isArray(body.equipos) ? body.equipos : [];
      const nombreArchivo = String(body.nombreArchivo || "").trim();
      const rutaArchivo = String(body.rutaArchivo || "").trim();
      const tamanoBytes = Number(body.tamanoBytes || 0);
      if (!nombreColaborador || !dni || !EMPRESAS.has(empresa) || !TIPOS_ACTA.has(tipoActa) || equipos.length < 1 || equipos.length > 50 || equipos.some((equipo: any) => !String(equipo.tipo || "").trim() || !String(equipo.descripcion || "").trim() || String(equipo.tipo).length > 100 || String(equipo.descripcion).length > 300 || String(equipo.identificador).length > 150) || !nombreArchivo ||
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
          tipo_acta: tipoActa,
          fecha_entrega: body.fechaEntrega,
          nombre_archivo: nombreArchivo,
          ruta_archivo: rutaArchivo,
          tamano_bytes: contenido.length,
          cargado_por: usuario.correo,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: errorEquipos } = await supabase.from("actas_entrega_equipos").insert(equipos.map((equipo: any) => ({ acta_id: data.id, tipo: String(equipo.tipo).trim(), descripcion: String(equipo.descripcion).trim(), identificador: String(equipo.identificador || "").trim() })));
      if (errorEquipos) { await supabase.from("actas_entrega").delete().eq("id", data.id); throw errorEquipos; }
      return json({ success: true, id: data.id });
    }

    if (action === "ver" || action === "descargar") {
      const id = String(body.id || "");
      const { data: acta, error: errorActa } = await supabase
        .from("actas_entrega")
        .select("ruta_archivo")
        .eq("id", id)
        .maybeSingle();
      if (errorActa) throw errorActa;
      if (!acta) return json({ error: "No se encontró el acta." }, 404);
      const opciones = action === "descargar" ? { download: true } : {};
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(acta.ruta_archivo, 60, opciones);
      if (error) throw error;
      return json({ url: data.signedUrl });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("Error en actas-entrega:", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo procesar la solicitud." }, 500);
  }
});