/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { RESPONSE_SCHEMA } from "./schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Modelo de Gemini a usar. "gemini-2.5-flash" está dentro del free tier.
   const GEMINI_MODEL = "gemini-3.5-flash";



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
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Analiza el siguiente equipo:\n\n${JSON.stringify(hardware, null, 2)}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error Gemini (${response.status}): ${error}`);
    }

    const aiResult = await response.json();

    console.log("===== RESPUESTA GEMINI =====");
    console.log(JSON.stringify(aiResult, null, 2));

    const contenido = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!contenido) {
      throw new Error("Gemini no devolvió contenido.");
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