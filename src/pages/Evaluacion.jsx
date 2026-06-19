import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Evaluacion() {
  const [comentario, setComentario] = useState("");
  const [guardado, setGuardado] = useState(false);

  const params = new URLSearchParams(window.location.search);

  const ticketId = params.get("ticket");
  const valor = params.get("valor");

  useEffect(() => {
    const guardarFeliz = async () => {
      if (valor === "feliz") {
        await supabase
          .from("tickets")
          .update({
            valoracion_usuario: "feliz",
            fecha_valoracion: new Date().toISOString(),
          })
          .eq("id", ticketId);

        setGuardado(true);
      }
    };

    guardarFeliz();
  }, [ticketId, valor]);

  const enviarComentario = async () => {
    await supabase
      .from("tickets")
      .update({
        valoracion_usuario: valor,
        comentario_valoracion: comentario,
        fecha_valoracion: new Date().toISOString(),
      })
      .eq("id", ticketId);

    setGuardado(true);
  };

  if (guardado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md">
          <h1 className="text-3xl mb-3">✅</h1>
          <h2 className="text-xl font-bold mb-2">
            Gracias por tu evaluación
          </h2>
          <p className="text-slate-500">
            Tu opinión nos ayuda a mejorar nuestro servicio.
          </p>
        </div>
      </div>
    );
  }

  if (valor === "feliz") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-lg">

        <h2 className="text-xl font-bold mb-3">
          {valor === "triste"
            ? "☹️ Lamentamos tu experiencia"
            : "😐 ¿Qué podríamos mejorar?"}
        </h2>

        <p className="text-slate-500 mb-4">
          Tu comentario nos ayudará a mejorar nuestro servicio.
        </p>

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={5}
          className="w-full border rounded-xl p-3"
          placeholder="Escribe tu comentario..."
        />

        <button
          onClick={enviarComentario}
          className="mt-4 w-full py-3 rounded-xl text-white font-semibold"
          style={{ background: "#345D9D" }}
        >
          Enviar comentario
        </button>

      </div>
    </div>
  );
}