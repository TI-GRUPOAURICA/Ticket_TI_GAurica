import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Evaluacion() {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get("ticket");
  const valorURL = params.get("valor");

  // Este useEffect hace que el componente reaccione al valor de la URL al cargar
  useEffect(() => {
    if (valorURL) {
      const valor = parseInt(valorURL);
      manejarClickEstrella(valor);
    }
  }, []); 

  const manejarClickEstrella = async (valor) => {
    setCalificacion(valor);

    // Si es 4 o 5, guardamos directo y mostramos mensaje de gracias
    if (valor >= 4) {
      await guardarEnSupabase(valor, "Excelente atención");
      setEnviado(true);
    }
    // Si es 1, 2 o 3, el estado de 'calificacion' se actualiza 
    // y el renderizado abajo mostrará el campo de comentario automáticamente
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
        <h2 className="text-xl font-bold mb-4">¿Cómo calificarías nuestra atención?</h2>
        
        {/* Renderizado de 5 estrellas */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => manejarClickEstrella(star)}
              className={`text-4xl transition ${calificacion >= star ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Campo de comentario solo si la calificación es baja (1-3) */}
        {calificacion > 0 && calificacion <= 3 && (
          <div className="mt-4 animate-fadeIn">
            <p className="mb-2 text-sm text-slate-600">Lamentamos que tu experiencia no fuera ideal. ¿Qué podemos mejorar?</p>
            <textarea
              className="w-full border rounded-xl p-3 mb-3"
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos más..."
            />
            <button
              onClick={async () => {
                await guardarEnSupabase(calificacion, comentario);
                setEnviado(true);
              }}
              className="w-full py-2 bg-blue-600 text-white rounded-xl"
            >
              Enviar comentario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}