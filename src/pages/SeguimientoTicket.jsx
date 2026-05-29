import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SeguimientoTicket({ onVolver }) {

  const [ticketId, setTicketId] = useState("");

  const [ticket, setTicket] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const buscarTicket = async () => {

    if (!ticketId.trim()) return;

    setLoading(true);
    setError("");
    setTicket(null);

    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        categorias(nombre)
      `)
      .eq("id", ticketId)
      .single();

    if (error || !data) {

      setError("No se encontró el ticket.");

    } else {

      setTicket(data);

    }

    setLoading(false);
  };

  const estadoConfig = {

    abierto: {
      label: "Abierto",
      color: "#ef4444",
      bg: "#fee2e2",
    },

    en_proceso: {
      label: "En proceso",
      color: "#f59e0b",
      bg: "#fef3c7",
    },

    resuelto: {
      label: "Resuelto",
      color: "#22c55e",
      bg: "#dcfce7",
    },

  };

  return (

    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "#eff6ff"
      }}
    >

      <div className="w-full max-w-xl">

        {/* VOLVER */}
        <button
          onClick={onVolver}
          className="mb-6 text-sm"
          style={{ color: "#305da0" }}
        >
          ← Volver
        </button>

        {/* CARD */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe",
            boxShadow: "0 10px 30px rgba(37,99,235,0.08)"
          }}
        >

          {/* TITULO */}
          <h1 className="text-3xl font-bold text-center text-slate-800">

            Seguimiento de Ticket

          </h1>

          <p
            className="text-center mt-2 mb-8"
            style={{ color: "#64748b" }}
          >
            Consulta el estado de tu solicitud
          </p>

          {/* BUSQUEDA */}
          <div className="flex gap-3">

            <input
              type="number"
              placeholder="Número de ticket"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none"
              style={{
                border: "1px solid #dbeafe",
                background: "#f8fafc"
              }}
            />

            <button
              onClick={buscarTicket}
              disabled={loading}
              className="px-5 rounded-xl font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #305da0, #305da0)"
              }}
            >

              {loading ? "..." : "Buscar"}

            </button>

          </div>

          {/* ERROR */}
          {error && (

            <div
              className="mt-6 p-4 rounded-xl text-sm"
              style={{
                background: "#fee2e2",
                color: "#b91c1c"
              }}
            >

              {error}

            </div>

          )}

          {/* RESULTADO */}
          {ticket && (

            <div
              className="mt-8 rounded-2xl p-6"
              style={{
                background: "#f8fafc",
                border: "1px solid #dbeafe"
              }}
            >

              {/* HEADER */}
              <div className="flex justify-between items-start mb-6">

                <div>

                  <p
                    className="text-sm"
                    style={{ color: "#64748b" }}
                  >
                    Ticket #{ticket.id}
                  </p>

                  <h2 className="text-xl font-bold text-slate-800">
                    {ticket.titulo || "Incidencia"}
                  </h2>

                </div>

                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    color:
                      estadoConfig[ticket.estado]?.color,

                    background:
                      estadoConfig[ticket.estado]?.bg,
                  }}
                >

                  {estadoConfig[ticket.estado]?.label}

                </span>

              </div>

              {/* INFO */}
              <div className="space-y-4 text-sm">

                <div>

                  <p className="text-slate-500">
                    Empresa
                  </p>

                  <p className="font-medium text-slate-800">
                    {ticket.empresa}
                  </p>

                </div>

                <div>

                  <p className="text-slate-500">
                    Problema reportado
                  </p>

                  <p className="font-medium text-slate-800 whitespace-pre-wrap">
                    {ticket.descripcion}
                  </p>

                </div>

                <div>

                  <p className="text-slate-500">
                    Categoría
                  </p>

                  <p className="font-medium text-slate-800">
                    {ticket.categorias?.nombre || "—"}
                  </p>

                </div>

                <div>

                    <p className="text-slate-500">
                        Seguimiento TI
                        </p>

                        <p className="font-medium text-slate-800 whitespace-pre-wrap">

                         { ticket.comentario_proceso ||
                             "Aún no hay seguimiento"}

                            </p>

                    </div>
                 <div>

                  <p className="text-slate-500">
                    Solución
                  </p>

                  <p className="font-medium text-slate-800 whitespace-pre-wrap">
                    {ticket.solucion || "Aún no resuelto"}
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}