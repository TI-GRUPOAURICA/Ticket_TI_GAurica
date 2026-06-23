import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Evaluacion() {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false); // Nuevo estado
  
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("ticket");
  const valorURL = params.get("valor");

  useEffect(() => {
    if (valorURL) {
      manejarClickEstrella(parseInt(valorURL));
    }
  }, []); 

  const manejarClickEstrella = async (valor) => {
    if (bloqueado) return; // Evita que vuelvan a hacer clic
    
    setCalificacion(valor);
    setBloqueado(true); // Bloquea futuros clics

    if (valor >= 4) {
      await guardarEnSupabase(valor, "Excelente atención");
      setEnviado(true);
    }
  };

  const guardarEnSupabase = async (valor, texto) => {
    await supabase
      .from("tickets")
      .update({
        valoracion_usuario: valor,
        comentario_valoracion: texto,
        fecha_valoracion: new Date().toISOString(),
      })
      .eq("id", ticketId);
  };

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h2 className="text-2xl font-bold">¡Gracias por tu valoración! 🎉</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        
        {/* Solo muestra las estrellas si NO se ha seleccionado ninguna */}
        {calificacion === 0 && (
          <>
            <h2 className="text-xl font-bold mb-4">¿Cómo calificarías nuestra atención?</h2>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => manejarClickEstrella(star)} className="text-4xl text-yellow-400">★</button>
              ))}
            </div>
          </>
        )}

        {/* Formulario de mejora (solo si la nota es 1-3) */}
        {calificacion > 0 && calificacion <= 3 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">¿Qué podríamos mejorar?</h2>
            <p className="mb-4 text-sm text-slate-600">Tu comentario nos ayudará a mejorar nuestro servicio.</p>
            <textarea
              className="w-full border rounded-xl p-3 mb-3"
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe tu comentario..."
            />
            <button
              onClick={async () => {
                await guardarEnSupabase(calificacion, comentario);
                setEnviado(true);
              }}
              style={{ backgroundColor: "#345d9d" }} // Tu color azul
              className="w-full py-2 text-white rounded-xl"
            >
              Enviar comentario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}