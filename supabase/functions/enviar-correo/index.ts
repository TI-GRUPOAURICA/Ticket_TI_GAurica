console.log("VERSION RESUELTO 23-06");

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
      tipo,
      ticket_id,
      colaborador,
      email,
      descripcion,
      empresa,
      host,
      anydesk,
      solucion,
    } = await req.json();

    console.log("TIPO:", tipo);

    // ==========================
    // TICKET RESUELTO
    // ==========================
    if (tipo === "resuelto") {
      console.log("ENTRO A RESUELTO");

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
            templateId: 4,
            params: {
              ticket_id,
              colaborador,
              solucion,
            },
          }),
        }
      );

      const result = await response.json();

      return new Response(
        JSON.stringify({
          success: true,
          result,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ==========================
    // TICKET NUEVO
    // ==========================

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