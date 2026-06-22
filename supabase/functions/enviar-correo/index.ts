/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      ticket_id,
      colaborador,
      email,
      descripcion,
      empresa,
      host,
      anydesk
    } = await req.json();

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": Deno.env.get("BREVO_API_KEY") || "",
        },
        body: JSON.stringify({
          sender: {
            name: "Grupo Aurica",
            email: "soporte@auricasac.com",
          },
          to: [
            {
              email: email,
              name: colaborador,
            },
          ],
          subject: `Ticket #${ticket_id} registrado`,
          htmlContent: `
            <h2>Solicitud registrada</h2>
            <p>Hola ${colaborador},</p>

            <p>Tu ticket ha sido registrado correctamente.</p>

            <p><strong>Número:</strong> #${ticket_id}</p>
            <p><strong>Empresa:</strong> ${empresa}</p>
            <p><strong>Equipo:</strong> ${host}</p>
            <p><strong>AnyDesk:</strong> ${anydesk}</p>
            <p><strong>Detalle:</strong> ${descripcion}</p>
          `,
        }),
      }
    );

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});