/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticket, colaborador, form, imagen_url } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Soporte TI <onboarding@resend.dev>",
        to: ["stanleycastillocanchari@gmail.com"],
        subject: `🎫 Nuevo Ticket #${ticket.id} — ${form.titulo}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a4f8a, #2B6CB0); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎫 Nuevo Ticket Registrado</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0;">Sistema de Soporte TI — Grupo Aurica</p>
            </div>
            <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Número de ticket</span><br/>
                    <strong style="color: #1a365d; font-size: 16px;">#${ticket.id}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Colaborador</span><br/>
                    <strong style="color: #2d3748;">${colaborador.colaborador}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Empresa</span><br/>
                    <strong style="color: #2d3748;">${colaborador.empresa}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Equipo</span><br/>
                    <strong style="color: #2d3748;">${colaborador.host}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Título del problema</span><br/>
                    <strong style="color: #2d3748;">${form.titulo}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">Descripción</span><br/>
                    <p style="color: #2d3748; margin: 4px 0 0 0;">${form.descripcion}</p>
                  </td>
                </tr>
                ${form.anydesk ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #718096; font-size: 13px;">ID AnyDesk</span><br/>
                    <strong style="color: #2d3748;">${form.anydesk}</strong>
                  </td>
                </tr>` : ""}
                ${imagen_url ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #718096; font-size: 13px;">Imagen adjunta</span><br/>
                    <a href="${imagen_url}" style="color: #2B6CB0;">Ver imagen</a>
                  </td>
                </tr>` : ""}
              </table>
            </div>
            <div style="background: #edf2f7; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                Grupo Aurica · Sistema de Soporte TI
              </p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } 
  catch (error) {

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}
});