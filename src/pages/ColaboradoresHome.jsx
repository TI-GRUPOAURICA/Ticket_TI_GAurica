import { useState } from "react";
import { Ticket, ClipboardList, FileSignature, CalendarDays, X, Laptop, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const EMPRESA_LOGOS = {
  AURICA: "/grupoaurica-letrasazules.png",
  METALAB: "/icono metalab.svg",
  MINERALAB: "/icono mineralab.svg",
  GIANLU: "/Gianlu_imagotipo_principal.png",
  TERRIMETAL: "/Terrimetal_imagotipo_principal.png",
};

const EMPRESA_TEMAS = {
  AURICA: { primary: "#345D9D", light: "#EBF4FF", border: "#DBEAFE" },
  METALAB: { primary: "#B78C30", light: "#FFFBEB", border: "#FDE68A" },
  MINERALAB: { primary: "#5F504D", light: "#FDF6E3", border: "#E9D8A6" },
  GIANLU: { primary: "#C05621", light: "#FFF7ED", border: "#FED7AA" },
  TERRIMETAL: { primary: "#809971", light: "#F3F6F0", border: "#D5E0CE" },
};

export default function ColaboradorHome({
  user,
  onRegistrarTicket,
  onSeguimiento,
  onActas,
  mostrarActas = false,
  onLogout,
}) {
  const empresa = user?.company?.toUpperCase() || "AURICA";
  const logo = EMPRESA_LOGOS[empresa] || EMPRESA_LOGOS.AURICA;
  const nombreEmpresa = empresa === "TERRIMETAL" ? "Terrimetal" : empresa;
  const tema = EMPRESA_TEMAS[empresa] || EMPRESA_TEMAS.AURICA;
  const [mostrarAgendaLaptop, setMostrarAgendaLaptop] = useState(false);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [laptopSeleccionada, setLaptopSeleccionada] = useState("LAP-01");
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState("");

  const inicioSemana = new Date();
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7) + semanaOffset * 7);
  const diasAgenda = Array.from({ length: 5 }, (_, indice) => {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + indice);
    return {
      fecha,
      dia: fecha.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", ""),
      numero: fecha.getDate(),
    };
  });
  const bloquesHorario = ["09:00 - 11:00", "11:00 - 13:00", "14:00 - 16:00"];
  const ocupacionesDemo = {
    "LAP-01": { 1: "09:00 - 11:00", 3: "14:00 - 16:00" },
    "LAP-02": { 0: "11:00 - 13:00", 2: "09:00 - 11:00" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f0f4f8" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt={nombreEmpresa} className="w-64 h-20 mx-auto object-contain mb-6" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: tema.primary }}>Hola {user?.name || "Colaborador"}</h1>
          <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>Gestiona tus solicitudes de soporte de forma rápida y sencilla.</p>
        </div>
        <div className="space-y-4">
          <button onClick={onRegistrarTicket} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: `1px solid ${tema.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><Ticket size={28} color={tema.primary} strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Registrar ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Reporta un problema o incidencia</p></div>
            </div>
          </button>
          <button onClick={onSeguimiento} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: `1px solid ${tema.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><ClipboardList size={28} color={tema.primary} strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Seguimiento ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Consulta el estado de tu solicitud</p></div>
            </div>
          </button>
          <button onClick={() => { setMostrarAgendaLaptop(true); setBloqueSeleccionado(""); }} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: `1px solid ${tema.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><CalendarDays size={28} color={tema.primary} strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Agendar laptop</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Consulta disponibilidad y solicita un préstamo</p></div>
            </div>
          </button>
          {mostrarActas && (
            <button onClick={onActas} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: "1px solid " + tema.border, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><FileSignature size={28} color={tema.primary} strokeWidth={2} /></div>
                <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Actas de entrega</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Sube y consulta actas firmadas</p></div>
              </div>
            </button>
          )}
        </div>
        <div className="text-center mt-6">
          <button onClick={onLogout} className="px-8 py-3 rounded-xl text-sm font-medium transition text-white" style={{ background: tema.primary, border: "none" }}>Cerrar sesión</button>
        </div>
        {mostrarAgendaLaptop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 sm:px-7" style={{ background: tema.primary }}>
                <div className="flex items-center gap-3 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><CalendarDays size={23} /></div>
                  <div><h2 className="text-lg font-bold sm:text-xl">Agenda de laptops</h2><p className="text-sm text-white/80">Reserva para reuniones, viajes y actividades</p></div>
                </div>
                <button onClick={() => setMostrarAgendaLaptop(false)} aria-label="Cerrar agenda" className="rounded-xl p-2 text-white/90 transition hover:bg-white/15"><X size={21} /></button>
              </div>

              <div className="max-h-[78vh] overflow-y-auto p-4 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Disponibilidad de préstamo</p>
                    <p className="mt-1 text-xs text-slate-500">Selecciona un día, una laptop y un horario libre.</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Maqueta de vista previa</span>
                </div>

                <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 p-3 sm:px-4">
                  <button onClick={() => { setSemanaOffset((valor) => valor - 1); setDiaSeleccionado(0); setBloqueSeleccionado(""); }} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Semana anterior"><ChevronLeft size={19} /></button>
                  <div className="text-center"><p className="text-sm font-bold capitalize text-slate-800">{diasAgenda[0].fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}</p><p className="text-xs text-slate-500">Semana laboral · lunes a viernes</p></div>
                  <button onClick={() => { setSemanaOffset((valor) => valor + 1); setDiaSeleccionado(0); setBloqueSeleccionado(""); }} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Semana siguiente"><ChevronRight size={19} /></button>
                </div>

                <div className="mb-6 grid grid-cols-5 gap-2">
                  {diasAgenda.map((dia, indice) => (
                    <button key={dia.fecha.toISOString()} onClick={() => { setDiaSeleccionado(indice); setBloqueSeleccionado(""); }} className="rounded-2xl border px-2 py-3 text-center transition" style={diaSeleccionado === indice ? { background: tema.light, borderColor: tema.primary, color: tema.primary } : { background: "#fff", borderColor: "#e2e8f0", color: "#64748b" }}>
                      <span className="block text-[11px] font-semibold uppercase">{dia.dia}</span><span className="mt-1 block text-lg font-bold">{dia.numero}</span>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[{ id: "LAP-01", nombre: "Laptop 01", detalle: "Equipo disponible para préstamo" }, { id: "LAP-02", nombre: "Laptop 02", detalle: "Equipo disponible para préstamo" }].map((laptop) => (
                    <section key={laptop.id} className="rounded-2xl border p-4 transition" style={laptopSeleccionada === laptop.id ? { borderColor: tema.primary, boxShadow: `0 0 0 2px ${tema.light}` } : { borderColor: "#e2e8f0" }}>
                      <button onClick={() => { setLaptopSeleccionada(laptop.id); setBloqueSeleccionado(""); }} className="mb-4 flex w-full items-center gap-3 text-left">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: tema.light, color: tema.primary }}><Laptop size={22} /></span>
                        <span className="flex-1"><span className="block font-bold text-slate-800">{laptop.nombre}</span><span className="text-xs text-slate-500">{laptop.detalle}</span></span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Disponible</span>
                      </button>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Clock size={14} /> Horarios</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {bloquesHorario.map((bloque) => {
                          const ocupado = ocupacionesDemo[laptop.id]?.[diaSeleccionado] === bloque;
                          const seleccionado = laptopSeleccionada === laptop.id && bloqueSeleccionado === bloque;
                          return <button key={bloque} disabled={ocupado} onClick={() => { setLaptopSeleccionada(laptop.id); setBloqueSeleccionado(bloque); }} className="rounded-xl border px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed" style={ocupado ? { background: "#f1f5f9", borderColor: "#e2e8f0", color: "#94a3b8" } : seleccionado ? { background: tema.primary, borderColor: tema.primary, color: "#fff" } : { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" }}>{bloque}{ocupado ? " · Reservado" : " · Libre"}</button>;
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-600">Las reservas requerirán confirmación de TI. Esta maqueta usa horarios de ejemplo y todavía no guarda solicitudes.</p>
                  <button disabled={!bloqueSeleccionado} className="shrink-0 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: tema.primary }}>Solicitar reserva</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}