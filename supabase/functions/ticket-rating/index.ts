import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  try {
    const { ticketId, valor, comentario } = await req.json();
    if (typeof ticketId !== "string" || !/^[0-9a-f-]{36}$/i.test(ticketId) || !Number.isInteger(valor) || valor < 1 || valor > 5) return json({ error: "La calificación no es válida." }, 400);
    const { data, error } = await supabase.from("tickets").update({ valoracion_usuario: valor, comentario_valoracion: String(comentario || "").slice(0, 2000), fecha_valoracion: new Date().toISOString() }).eq("id", ticketId).is("valoracion_usuario", null).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "El ticket no existe o ya fue calificado." }, 409);
    return json({ success: true });
  } catch (error) {
    console.error("Error guardando calificación:", error);
    return json({ error: "No se pudo guardar la calificación." }, 500);
  }
});