import { useState } from "react";
import { supabase } from "../lib/supabase";

// =============================================================
// COMPONENTE: SeguimientoTicket
// Permite a un colaborador consultar el estado de su ticket
// ingresando el número de ticket que recibió al crearlo.
// Muestra el estado actual, el problema reportado, la categoría,
// el seguimiento del equipo TI y la solución (si ya fue resuelta).
//
// Props:
//   onVolver → función para regresar a la pantalla anterior
// =============================================================
export default function SeguimientoTicket({ onVolver }) {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [ticketId, setTicketId] = useState("");   // Número de ticket ingresado por el usuario
  const [ticket, setTicket] = useState(null);     // Datos del ticket encontrado en Supabase
  const [loading, setLoading] = useState(false);  // Bloquea el botón mientras se consulta
  const [error, setError] = useState("");         // Mensaje de error si no se encuentra el ticket

  // ----------------------------------------------------------
  // BUSCAR TICKET
  // Consulta la tabla "tickets" en Supabase buscando por ID exacto.
  // Trae también el nombre de la categoría mediante join con "categorias".
  // Si no existe o hay error, muestra el mensaje de error.
  // ----------------------------------------------------------
  const buscarTicket = async () => {
    if (!ticketId.trim()) return;

    setLoading(true);
    setError("");
    setTicket(null);

    const { data, error } = await supabase
      .from("tickets")
      .select(`*, categorias(nombre)`)
      .eq("id", ticketId)
      .single();

    if (error || !data) {
      setError("No se encontró el ticket.");
    } else {
      setTicket(data);
    }

    setLoading(false);
  };

  // ----------------------------------------------------------
  // CONFIGURACIÓN DE ESTADOS
  // Define la etiqueta, color de texto y color de fondo
  // para cada posible estado del ticket.
  // Se usa para mostrar el badge de estado en la card.
  // ----------------------------------------------------------
  const estadoConfig = {
    abierto:    { label: "Abierto",     color: "#ef4444", bg: "#fee2e2" },
    en_proceso: { label: "En proceso",  color: "#f59e0b", bg: "#fef3c7" },
    resuelto:   { label: "Resuelto",    color: "#22c55e", bg: "#dcfce7" },
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#eff6ff" }}
    >
      <div className="w-full max-w-xl">

        {/* --------------------------------------------------------
            BOTÓN VOLVER — fuera de la card, encima de ella.
        -------------------------------------------------------- */}
        <button
          onClick={onVolver}
          className="mb-6 text-sm"
          style={{ color: "#345D9D" }}
        >
          ← Volver
        </button>

        {/* --------------------------------------------------------
            CARD PRINCIPAL
            Contiene el buscador, el mensaje de error (si aplica)
            y la ficha del ticket encontrado.
        -------------------------------------------------------- */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe",
            boxShadow: "0 10px 30px rgba(37,99,235,0.08)",
          }}
        >

          {/* Título y subtítulo de la sección */}
          <h1 className="text-3xl font-bold text-center" style={{ color: "#345D9D" }}>
            Seguimiento de Ticket
          </h1>
          <p className="text-center mt-2 mb-8" style={{ color: "#64748b" }}>
            Consulta el estado de tu solicitud
          </p>

          {/* -------------------------------------------------------
              BUSCADOR
              Input numérico donde el colaborador escribe el número
              de ticket. El botón lanza la consulta a Supabase.
              Se deshabilita mientras loading está activo.
          ------------------------------------------------------- */}
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Número de ticket"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl focus:outline-none"
              style={{ border: "1px solid #dbeafe", background: "#f8fafc" }}
            />
            <button
              onClick={buscarTicket}
              disabled={loading}
              className="px-5 rounded-xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #345D9D, #345D9D)" }}
            >
              {loading ? "..." : "Buscar"}
            </button>
          </div>

          {/* -------------------------------------------------------
              MENSAJE DE ERROR
              Aparece solo si el ticket no fue encontrado.
          ------------------------------------------------------- */}
          {error && (
            <div
              className="mt-6 p-4 rounded-xl text-sm"
              style={{ background: "#fee2e2", color: "#b91c1c" }}
            >
              {error}
            </div>
          )}

          {/* -------------------------------------------------------
              FICHA DEL TICKET
              Se muestra cuando Supabase devuelve un resultado válido.
              Incluye:
                - Número y título del ticket
                - Badge de estado (abierto / en proceso / resuelto)
                - Empresa del colaborador
                - Descripción del problema reportado
                - Categoría asignada
                - Seguimiento del equipo TI (comentario_proceso)
                - Solución (si ya fue resuelta)
          ------------------------------------------------------- */}
          {ticket && (
            <div
              className="mt-8 rounded-2xl p-6"
              style={{ background: "#f8fafc", border: "1px solid #dbeafe" }}
            >

             {/* Encabezado: número y badge de estado */}
<div className="flex justify-between items-start mb-6">
  <div>
    <p className="text-sm" style={{ color: "#64748b" }}>Ticket #{ticket.id}</p>
    <h2 className="text-xl font-bold text-slate-800">
      Detalle de la solicitud
    </h2>
  </div>
  
  {/* Badge de estado */}
  <span
    className="px-3 py-1 rounded-full text-sm font-semibold"
    style={{
      color:     estadoConfig[ticket.estado]?.color,
      background:  estadoConfig[ticket.estado]?.bg,
    }}
  >
    {estadoConfig[ticket.estado]?.label}
  </span>
</div>
              {/* Detalle del ticket en campos apilados */}
              <div className="space-y-4 text-sm">

                {/* Empresa del colaborador que abrió el ticket */}
                <div>
                  <p className="text-slate-500">Empresa</p>
                  <p className="font-medium text-slate-800">{ticket.empresa}</p>
                </div>

                {/* Descripción del problema tal como la escribió el colaborador */}
                <div>
                  <p className="text-slate-500">Problema reportado</p>
                  <p className="font-medium text-slate-800 whitespace-pre-wrap">{ticket.descripcion}</p>
                </div>

                {/* Categoría asignada al ticket */}
              
                {/* Comentario de seguimiento ingresado por el técnico TI */}
                <div>
                  <p className="text-slate-500">Seguimiento TI</p>
                  <p className="font-medium text-slate-800 whitespace-pre-wrap">
                    {ticket.comentario_proceso || "Aún no hay seguimiento"}
                  </p>
                </div>

                {/* Solución registrada por el técnico al cerrar el ticket */}
                <div>
                  <p className="text-slate-500">Solución</p>
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