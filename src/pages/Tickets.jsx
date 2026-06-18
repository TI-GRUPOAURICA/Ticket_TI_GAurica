import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import emailjs from "@emailjs/browser";


function GestionTicket({
  ticketId,
  solucionInicial,
  comentarioInicial,
  adminNombre,
  correoColaborador,
  nombreColaborador,
  onActualizado,
}) {

  const [comentario, setComentario] = useState(comentarioInicial || "");
  const [solucion, setSolucion]     = useState(solucionInicial || "");
  const [guardando, setGuardando]   = useState(false);

  const tieneSeguimiento = comentario && comentario.trim().length > 0;

  const guardarProceso = async () => {
    if (!comentario.trim()) {
      alert("Escribe un comentario.");
      return;
    }
    setGuardando(true);
    alert(adminNombre);

    await supabase
      .from("tickets")
      .update({
        comentario_proceso: comentario,
        estado:             "en_proceso",
        updated_at:         new Date(),
      })
      .eq("id", ticketId);

    setGuardando(false);
    onActualizado();
  };

  const resolverTicket = async () => {
    if (!solucion.trim()) {
      alert("Debes escribir una solución.");
      return;
    }
    setGuardando(true);

    await supabase
      .from("tickets")
      .update({
        solucion,
        comentario_proceso: comentario,
        estado:             "resuelto",
        updated_at:         new Date(),
        resuelto_at:        new Date().toISOString(),
        resuelto_por:       adminNombre,
      })
      .eq("id", ticketId);

    const { data: colData } = await supabase
      .from("colaboradores")
      .select("correo")
      .eq("colaborador", nombreColaborador)
      .single();

    const correo = colData?.correo || correoColaborador;

    try {
      await emailjs.send(
        "service_wzdct0i",
        "template_nj9wy5n",
        {
          ticket_id:          ticketId,
          colaborador:        nombreColaborador,
          email:              correo,
          icono:              "✅",
          titulo_email:       "Ticket Resuelto",
          mensaje_intro:      "Tu solicitud de soporte ha sido atendida y resuelta.",
          label_detalle:      "Solución aplicada",
          detalle:            solucion,
          mensaje_footer:     "Esperamos haber resuelto tu inconveniente. Si el problema persiste, no dudes en abrir un nuevo ticket.",
          link_encuesta_html: `<div style="text-align:center;margin-top:30px;">
            <a href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=lqZMECkGrUuSEKcjOoWN773k1hrmUKRLk7bIBhlApuxUMlU4TlJROVhSQ1FUMVg3RjVDNVM2U1E2Wi4u"
              style="background:#2f64b3;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
              ⭐ Calificar atención
            </a>
          </div>`,
        },
        "ema3sApQIaIKPzpnq"
      );
    } catch (e) {
      console.error("Error enviando correo de cierre:", e);
    }

    setGuardando(false);
    onActualizado();
  };

  return (
    <div className="space-y-6">

      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "#F59E0B" }}>
          PASO 1 · Seguimiento interno
        </p>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Ejemplo: Se está validando conexión de red..."
          rows={4}
          className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none resize-none"
          style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
        />
        <button
          onClick={guardarProceso}
          disabled={guardando}
          className="mt-3 px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#ffffff" }}
        >
          🟡 Guardar seguimiento
        </button>
      </div>

      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "#305DA0" }}>
          PASO 2 · Resolver ticket
        </p>

        {!tieneSeguimiento && (
          <div
            className="mb-3 p-3 rounded-xl text-sm"
            style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}
          >
            ⚠ Debe registrar un seguimiento antes de resolver el ticket.
          </div>
        )}

        <textarea
          value={solucion}
          disabled={!tieneSeguimiento}
          onChange={(e) => setSolucion(e.target.value)}
          placeholder={
            tieneSeguimiento
              ? "Describe la solución aplicada..."
              : "Primero registra un seguimiento."
          }
          rows={4}
          className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none resize-none"
          style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
        />
        <button
          onClick={resolverTicket}
          disabled={guardando || !tieneSeguimiento}
          className="mt-3 px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#ffffff" }}
        >
          ✅ Resolver ticket
        </button>
      </div>

    </div>
  );
}

export default function Tickets({ adminNombre, adminCorreo }) {

  const [tickets, setTickets]                       = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [filtroEstado, setFiltroEstado]             = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad]       = useState("todos");
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select(`*, profiles:usuario_id(full_name, email), categorias(nombre)`)
      .in("estado", ["abierto", "en_proceso"])
      .order("created_at", { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const abrirTicket = (ticket) => {
    setTicketSeleccionado(ticket);
  };

  const cambiarEstado = async (ticketId, nuevoEstado) => {
    await supabase
      .from("tickets")
      .update({ estado: nuevoEstado, updated_at: new Date() })
      .eq("id", ticketId);

    fetchTickets();
    setTicketSeleccionado({ ...ticketSeleccionado, estado: nuevoEstado });
  };

  const estadoConfig = {
    abierto:    { label: "Abierto",    color: "#ef4444", bg: "#fee2e2" },
    en_proceso: { label: "En Proceso", color: "#f59e0b", bg: "#fef3c7" },
    resuelto:   { label: "Resuelto",   color: "#22c55e", bg: "#dcfce7" },
  };

  // 👇 todas las prioridades con #345d9d y fallback también azul
  const prioridadConfig = {
    bajo:       { dot: "#345d9d" },
    medio:      { dot: "#345d9d" },
    alto:       { dot: "#345d9d" },
    critico:    { dot: "#345d9d" },
    emergencia: { dot: "#345d9d" },
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const estadoOk    = filtroEstado    === "todos" || t.estado    === filtroEstado;
    const prioridadOk = filtroPrioridad === "todos" || t.prioridad === filtroPrioridad;
    return estadoOk && prioridadOk;
  });

  return (
    <div className="flex h-screen">

      <div className={`${ticketSeleccionado ? "w-1/2" : "w-full"} flex flex-col transition-all duration-300`}>

        <div className="p-6" style={{ borderBottom: "1px solid #dbeafe" }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#000000" }}>Tickets</h1>

          <div className="flex gap-3 flex-wrap items-center">

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl focus:outline-none"
              style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todos">Todos los estados</option>
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
            </select>

            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl focus:outline-none"
              style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todos">Todas las prioridades</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
              <option value="emergencia">Emergencia</option>
            </select>

            <span className="text-xs" style={{ color: "#64748b" }}>
              {ticketsFiltrados.length} tickets
            </span>

          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center mt-10 text-sm text-slate-500">Cargando...</p>
          ) : ticketsFiltrados.length === 0 ? (
            <p className="text-center mt-10 text-sm text-slate-500">No hay tickets.</p>
          ) : (
            ticketsFiltrados.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => abrirTicket(ticket)}
                className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
                style={{
                  background: "#ffffff",
                  border: ticketSeleccionado?.id === ticket.id
                    ? "1px solid #345D9D"
                    : "1px solid #dbeafe",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">

                    {/* 👇 fallback también azul */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: prioridadConfig[ticket.prioridad]?.dot || "#345d9d" }}
                    />

                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {ticket.titulo || "Incidencia"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                        #{ticket.id} · {ticket.nombre_colaborador || ticket.profiles?.full_name} · {ticket.empresa || ""} · {ticket.categorias?.nombre}
                      </p>
                    </div>

                  </div>

                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      color:      estadoConfig[ticket.estado]?.color,
                      background: estadoConfig[ticket.estado]?.bg,
                    }}
                  >
                    {estadoConfig[ticket.estado]?.label}
                  </span>

                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {ticketSeleccionado && (
<div className="w-1/2 flex flex-col" style={{ borderLeft: "1px solid #dbeafe", height: "100vh", overflow: "hidden" }}>

          <div className="p-6 flex justify-between items-start" style={{ borderBottom: "1px solid #dbeafe" }}>
            <div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Ticket #{ticketSeleccionado.id}</p>
              <h2 className="text-lg font-bold text-slate-800">
                {ticketSeleccionado.titulo || "Incidencia"}
              </h2>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {ticketSeleccionado.nombre_colaborador || ticketSeleccionado.profiles?.full_name}
                {" · "}
                {ticketSeleccionado.empresa}
              </p>
            </div>
            <button
              onClick={() => setTicketSeleccionado(null)}
              className="text-slate-400 hover:text-slate-700 text-xl"
            >
              ✕
            </button>
          </div>

<div className="flex-1 overflow-auto p-4 space-y-3" style={{ background: "#f0f3f8" }}>

            <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #dbeafe" }}>
              <p className="text-sm font-semibold text-slate-700 mb-2">Descripción</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "#334155" }}>
                {ticketSeleccionado.descripcion || "Sin descripción"}
              </p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #dbeafe" }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Hostname</p>
                  <p className="font-medium text-slate-800">{ticketSeleccionado.hostname || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">AnyDesk</p>
                  <p className="font-medium text-slate-800">{ticketSeleccionado.anydesk || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Categoría</p>
                  <p className="font-medium text-slate-800">{ticketSeleccionado.categorias?.nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Prioridad</p>
                  <p className="font-medium text-slate-800 capitalize">{ticketSeleccionado.prioridad}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #dbeafe" }}>
              <p className="text-sm font-semibold text-slate-700 mb-3">Estado del ticket</p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => cambiarEstado(ticketSeleccionado.id, "abierto")}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "#fee2e2", color: "#345d9d" }}
                >
                  Abierto
                </button>
                <button
                  onClick={() => cambiarEstado(ticketSeleccionado.id, "en_proceso")}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "#fef3c7", color: "#345d9d" }}
                >
                  En proceso
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #dbeafe" }}>
              <p className="text-sm font-semibold text-slate-700 mb-3">Resolver ticket</p>
              <GestionTicket
                ticketId={ticketSeleccionado.id}
                solucionInicial={ticketSeleccionado.solucion}
                comentarioInicial={ticketSeleccionado.comentario_proceso}
                adminNombre={adminNombre}
                correoColaborador={ticketSeleccionado.email}
                nombreColaborador={ticketSeleccionado.nombre_colaborador}
                onActualizado={() => {
                  setTicketSeleccionado(null);
                  fetchTickets();
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}