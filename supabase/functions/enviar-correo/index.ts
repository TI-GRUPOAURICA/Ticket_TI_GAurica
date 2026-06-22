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
    console.log("Destino Usuario:", email);
    console.log("==================================");

    // CORREO AL USUARIO (Plantilla #2)
    const responseUsuario = await fetch(
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
          templateId: 2,
          params: {
            ticket_id,
            colaborador,
            descripcion,
          },
        }),
      }
    );

    const resultUsuario = await responseUsuario.json();

    // CORREO A TI (Plantilla #3)
    const responseTI = await fetch(
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
              email: "soporte@auricasac.com",
              name: "Mesa de Ayuda TI",
            },
          ],
          templateId: 3,
          params: {
            ticket_id,
            fecha: new Date().toLocaleDateString("es-PE"),
            colaborador,
            empresa,
            host,
            categoria: "Soporte TI",
            titulo: descripcion,
            descripcion,
            anydesk,
          },
        }),
      }
    );

    const resultTI = await responseTI.json();

    console.log("USUARIO:", JSON.stringify(resultUsuario));
    console.log("TI:", JSON.stringify(resultTI));

    return new Response(
      JSON.stringify({
        success: true,
        usuario: resultUsuario,
        soporte: resultTI,
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