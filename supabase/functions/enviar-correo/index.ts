/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const {
      ticket_id,
      colaborador,
      email,
      descripcion,
      empresa,
      host,
      anydesk,
    } = await req.json();

    console.log("==================================");
    console.log("NUEVO ENVIO BREVO");
    console.log("Ticket:", ticket_id);
    console.log("Colaborador:", colaborador);
    console.log("Destino:", email);
    console.log("==================================");

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
                {
                  email: "soporte@auricasac.com",
                  name: "Mesa de Ayuda TI",
                },
              ],

          subject: `Ticket #${ticket_id} registrado`,

          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto;">
              
              <h2 style="color:#345d9d;">
                Solicitud registrada
              </h2>

              <p>Hola <strong>${colaborador}</strong>,</p>

              <p>
                Tu ticket ha sido registrado correctamente.
              </p>

              <hr>

              <p><strong>Número:</strong> #${ticket_id}</p>
              <p><strong>Empresa:</strong> ${empresa}</p>
              <p><strong>Equipo:</strong> ${host}</p>
              <p><strong>AnyDesk:</strong> ${anydesk}</p>

              <p>
                <strong>Detalle:</strong><br>
                ${descripcion}
              </p>

              <hr>

              <p>
                Revisaremos tu solicitud y comenzaremos la atención lo antes posible.
              </p>

              <p>
                Grupo Aurica · Sistema de Soporte TI
              </p>

            </div>
          `,
        }),
      }
    );

    const result = await response.json();

    console.log("STATUS BREVO:", response.status);
    console.log("RESPUESTA BREVO:", JSON.stringify(result));

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        result,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("ERROR BREVO:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
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