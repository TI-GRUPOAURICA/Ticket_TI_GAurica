import { createClient } from "npm:@supabase/supabase-js@2";
import { autenticarTI } from "../_shared/tenant-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const GEMINI_MODEL = "gemini-3.5-flash";

async function interpretarPregunta(pregunta: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Falta configurar GEMINI_API_KEY en Supabase.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `Clasifica preguntas en español para un asistente de inventario TI. No respondas la pregunta. Extrae solo el término exacto de búsqueda. Usa intent="equipo" para buscar quién usa un hostname, IP, hostname, datos de red o sincronización; usa intent="tickets" si pregunta por historial/incidencias; usa intent="equipos_sin_asignar" cuando pida equipos que no están vinculados a un colaborador; usa intent="no_soportado" si solicita acciones, cambios, datos que no sean de equipos/personas/tickets o no hay término claro. buscar_por debe ser "persona" cuando el término sea un nombre de persona, "ip" cuando sea una dirección IP y "hostname" cuando sea un identificador de equipo. Devuelve solo JSON con el esquema dado.` }],
        },
        contents: [{ role: "user", parts: [{ text: pregunta }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              intent: { type: "string", enum: ["equipo", "tickets", "equipos_sin_asignar", "no_soportado"] },
              buscar_por: { type: "string", enum: ["hostname", "persona", "ip"] },
              termino: { type: "string" },
            },
            required: ["intent", "buscar_por", "termino"],
          },
        },
      }),
    },
  );
  if (!response.ok) {
    const detalle = await response.text();
    console.error("Gemini intent error:", response.status, detalle);
    throw new Error("No se pudo interpretar la consulta. Inténtalo nuevamente.");
  }
  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("El asistente no pudo interpretar la consulta.");
  return JSON.parse(text) as { intent: string; buscar_por: string; termino: string };
}

function fechaLocal(valor: string | null) {
  if (!valor) return "sin dato";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "sin dato";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
  }).format(fecha);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const acceso = await autenticarTI(req);
    if (!acceso) return json({ error: "Solo el equipo de TI autorizado puede usar este asistente." }, 403);

    const body = await req.json().catch(() => ({}));
    const pregunta = String(body.pregunta || "").trim().slice(0, 300);
    if (!pregunta) return json({ error: "Escribe una pregunta." }, 400);

    const consulta = await interpretarPregunta(pregunta);
    if (consulta.intent === "equipos_sin_asignar") {
      if (acceso.rol !== "admin_global") {
        return json({ success: true, respuesta: "La empresa del equipo no se puede determinar cuando todavía no tiene colaborador asignado. Pide a un administrador global que revise esos equipos." });
      }
      const [{ data: equiposSinAsignar, error: errorEquipos }, { data: asignaciones, error: errorAsignaciones }] = await Promise.all([
        supabase.from("equipos").select("hostname, ip").limit(1000),
        supabase.from("colaboradores").select("host"),
      ]);
      if (errorEquipos) throw errorEquipos;
      if (errorAsignaciones) throw errorAsignaciones;
      const hostsAsignados = new Set((asignaciones || []).map((fila: any) => String(fila.host || "").trim().toUpperCase()).filter(Boolean));
      const pendientes = (equiposSinAsignar || []).filter((equipo: any) => {
        const host = String(equipo.hostname || "").trim();
        return host && !hostsAsignados.has(host.toUpperCase());
      });
      if (!pendientes.length) return json({ success: true, respuesta: "Todos los equipos registrados tienen un colaborador vinculado." });
      const lista = pendientes.slice(0, 20).map((equipo: any) => `• ${equipo.hostname} · IP local: ${equipo.ip || "No registrada"}`).join("\n");
      const restante = pendientes.length > 20 ? `\n…y ${pendientes.length - 20} equipos más.` : "";
      return json({ success: true, respuesta: `Encontré ${pendientes.length} equipos sin colaborador vinculado:\n${lista}${restante}` });
    }

    if (consulta.intent === "no_soportado" || !consulta.termino?.trim()) {
      return json({
        success: true,
        respuesta: "Puedo consultar quién usa un equipo, su IP, última sincronización, tickets recientes y equipos sin colaborador vinculado (solo administrador global). Prueba: ¿Quién usa la LAP0002?",
      });
    }

    const termino = consulta.termino.trim().replace(/[%_*]/g, "").slice(0, 100);
    if (!termino) return json({ success: true, respuesta: "Indícame un hostname o nombre de colaborador para buscar." });

    let colaboradoresQuery = supabase
      .from("colaboradores")
      .select("empresa, host, colaborador")
      .limit(8);
    if (acceso.rol === "ti_empresa") colaboradoresQuery = colaboradoresQuery.eq("empresa", acceso.empresa);
    if (consulta.buscar_por === "ip") {
      const { data: equiposPorIp, error: errorIp } = await supabase
        .from("equipos")
        .select("hostname")
        .ilike("ip", `%${termino}%`)
        .limit(8);
      if (errorIp) throw errorIp;
      const hostsPorIp = [...new Set((equiposPorIp || []).map((equipo: any) => String(equipo.hostname || "").trim()).filter(Boolean))];
      if (!hostsPorIp.length) {
        return json({ success: true, respuesta: `No encontré coincidencias para “${termino}” dentro del alcance de tu permiso.` });
      }
      colaboradoresQuery = colaboradoresQuery.in("host", hostsPorIp);
    } else if (consulta.buscar_por === "persona") {
      colaboradoresQuery = colaboradoresQuery.ilike("colaborador", `%${termino}%`);
    } else {
      colaboradoresQuery = colaboradoresQuery.ilike("host", `%${termino}%`);
    }

    const { data: colaboradores, error: errorColaboradores } = await colaboradoresQuery;
    if (errorColaboradores) throw errorColaboradores;
    if (!colaboradores?.length) {
      return json({ success: true, respuesta: `No encontré coincidencias para “${termino}” dentro del alcance de tu permiso.` });
    }

    const hosts = [...new Set(colaboradores.map((fila: any) => String(fila.host || "").trim()).filter(Boolean))];
    if (!hosts.length) {
      const nombres = colaboradores.map((fila: any) => `${fila.colaborador} (${fila.empresa})`).join(", ");
      return json({ success: true, respuesta: `Encontré ${nombres}, pero todavía no tiene un hostname vinculado en el inventario.` });
    }

    const [equiposRes, estadosRes] = await Promise.all([
      supabase.from("equipos").select("hostname, ip").in("hostname", hosts),
      supabase.from("equipos_estado").select("hostname, ultima_sincronizacion").in("hostname", hosts),
    ]);
    if (equiposRes.error) throw equiposRes.error;
    if (estadosRes.error) throw estadosRes.error;

    const equipoPorHost = new Map((equiposRes.data || []).map((fila: any) => [String(fila.hostname).toUpperCase(), fila]));
    const estadoPorHost = new Map((estadosRes.data || []).map((fila: any) => [String(fila.hostname).toUpperCase(), fila]));
    const filas = colaboradores.map((fila: any) => {
      const host = String(fila.host || "");
      const hardware: any = equipoPorHost.get(host.toUpperCase());
      const estado: any = estadoPorHost.get(host.toUpperCase());
      return {
        empresa: fila.empresa,
        persona: fila.colaborador,
        hostname: host || "Sin hostname",
        ip_local: hardware?.ip || "No registrada",
        ultima_sincronizacion: fechaLocal(estado?.ultima_sincronizacion || null),
      };
    });

    if (consulta.intent === "tickets") {
      let ticketsQuery = supabase
        .from("tickets")
        .select("id, hostname, titulo, estado, prioridad, created_at")
        .in("hostname", hosts)
        .order("created_at", { ascending: false })
        .limit(8);
      if (acceso.rol === "ti_empresa") ticketsQuery = ticketsQuery.eq("empresa", acceso.empresa);
      const { data: tickets, error: errorTickets } = await ticketsQuery;
      if (errorTickets) throw errorTickets;
      if (!tickets?.length) {
        return json({ success: true, respuesta: `Encontré el equipo ${filas.map((f: any) => f.hostname).join(", ")}, pero no tiene tickets registrados.` });
      }
      const listado = tickets.map((ticket: any) => `• #${ticket.id || ""} ${ticket.titulo} — ${ticket.estado}, prioridad ${ticket.prioridad}, ${fechaLocal(ticket.created_at)} (${ticket.hostname})`).join("\n");
      return json({ success: true, respuesta: `Tickets recientes:\n${listado}` });
    }

    const detalle = filas.map((fila: any) =>
      `• ${fila.hostname} — asignado a ${fila.persona} · ${fila.empresa} · IP local: ${fila.ip_local} · última sincronización: ${fila.ultima_sincronizacion}`
    ).join("\n");
    return json({ success: true, respuesta: detalle });
  } catch (error) {
    console.error("Error en asistente-ti:", error);
    return json({ error: error instanceof Error ? error.message : "Error interno del asistente." }, 500);
  }
});