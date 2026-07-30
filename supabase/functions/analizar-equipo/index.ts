/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { RESPONSE_SCHEMA } from "./schema.ts";

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
      procesador,
      nucleos,
      hilos,
      ram,
      tipo_ram,
      slots_ram,
      almacenamiento,
      capacidad,
      espacio_libre,
      gpu,
    } = await req.json();

    const hardware = {
      procesador,
      nucleos,
      hilos,
      ram,
      tipo_ram,
      slots_ram,
      almacenamiento,
      capacidad,
      espacio_libre,
      gpu,
    };

    console.log("=== ANALISIS IA ===");
    console.log(JSON.stringify(hardware, null, 2));

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "gpt-5",
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: SYSTEM_PROMPT,
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `
Analiza el siguiente equipo:

${JSON.stringify(hardware, null, 2)}

Devuelve únicamente un JSON siguiendo este esquema:

${JSON.stringify(RESPONSE_SCHEMA, null, 2)}
                  `,
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_object",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error OpenAI (${response.status}): ${error}`);
    }

    const aiResult = await response.json();

    console.log("===== RESPUESTA OPENAI =====");
    console.log(JSON.stringify(aiResult, null, 2));

    const contenido = aiResult.output?.[0]?.content?.[0]?.text;

    if (!contenido) {
      throw new Error("OpenAI no devolvió contenido.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        resultado: JSON.parse(contenido),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
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