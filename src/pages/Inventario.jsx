import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Pencil, Trash2, Save, X, Monitor, Cpu, HardDrive,
  Package, User, CircleCheck, CircleX,
  Wifi, Server, Bot, Clock,
  Info, Ticket, Mail, MapPin, RefreshCw, AlertTriangle
} from "lucide-react";

// =============================================================
// COMPONENTE: Inventario
// Tabla de gestión de equipos registrados en el sistema.
// Permite al equipo de TI visualizar, buscar, filtrar y editar
// los datos de cada equipo (host, colaborador, empresa y tipo).
// =============================================================

// Lista fija de empresas disponibles para el filtro
const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU"];

// Lista fija de tipos de equipo disponibles
const TIPOS = ["Laptop", "PC"];

// Lista fija de sedes disponibles (columna "sede" en colaboradores)
const SEDES = ["LIMA", "AREQUIPA", "CHALA"];

// Opciones para calificación manual de Renovación
const OPCIONES_CALIFICACION = ["BUENO", "REGULAR", "MALO"];

// Última versión publicada del Aurica Inventory Agent.
const ULTIMA_VERSION_AGENTE = "1.0.14";

// Nombre con el que el agente aparece en "Programas instalados"
const NOMBRE_PROGRAMA_AGENTE = "aurica inventory agent";

// Estilos de la pestaña "Tickets"
const ESTADOS_TICKET = {
  abierto:  { label: "Abierto",   bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  proceso:  { label: "En proceso", bg: "#dbeafe", color: "#345D9D", border: "#bfdbfe" },
  resuelto: { label: "Resuelto", bg: "#dcfce7", color: "#16a34a", border: "#86efac" },
  _default: { label: "Sin estado", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
};

const PRIORIDADES_TICKET = {
  bajo:       { label: "Bajo",       bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  medio:      { label: "Medio",      bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  alto:       { label: "Alto",       bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  critico:    { label: "Crítico",    bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  emergencia: { label: "Emergencia", bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
  _default:   { label: "—", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
};

// Pestañas del panel de detalle.
const TABS_DETALLE = [
  { id: "general",    label: "General",    icon: Info },
  { id: "renovacion", label: "Renovación", icon: RefreshCw },
  { id: "hardware",   label: "Hardware",   icon: Cpu },
  { id: "sistema",    label: "Sistema",    icon: Monitor },
  { id: "red",        label: "Red",        icon: Wifi },
  { id: "agente",     label: "Agente",     icon: Bot },
  { id: "programas",  label: "Programas",  icon: Package },
  { id: "tickets",    label: "Tickets",    icon: Ticket },
];

// Helper: Título de sección dentro del panel
function SeccionTitulo({ icon: Icon, texto }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-1" style={{ borderBottom: "1px solid #e2e8f0" }}>
      <Icon size={16} style={{ color: "#345D9D" }} />
      <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: "#1e293b" }}>
        {texto}
      </h3>
    </div>
  );
}

// Helper: Cálculo de antigüedad en años desde una fecha dada
function calcularAnosAntiguedad(fechaStr) {
  if (!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 0;
  const diffMs = Date.now() - fecha.getTime();
  const anos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, parseFloat(anos.toFixed(1)));
}

// Helper: Obtener puntaje de criticidad según el cargo
function obtenerPuntosCargo(cargoStr) {
  if (!cargoStr) return 5;
  const c = cargoStr.toLowerCase();
  if (c.includes("gerente") || c.includes("director") || c.includes("ceo")) return 10;
  if (c.includes("jefe") || c.includes("coordinador") || c.includes("supervisor")) return 8;
  if (c.includes("analista") || c.includes("especialista") || c.includes("ingeniero")) return 6;
  if (c.includes("asistente") || c.includes("auxiliar") || c.includes("practicante")) return 4;
  return 5;
}

// Helper: Cálculo global de matriz de renovación
function calcularPuntajeRenovacion({ fechaCompra, fechaInstalacionWin, estadoFisico, rendimiento, cargo, numTickets }) {
  const fechaReferencia = fechaCompra || fechaInstalacionWin;
  const anos = calcularAnosAntiguedad(fechaReferencia);

  // 1. Antigüedad (30 pts max)
  let ptsAntiguedad = 0;
  if (anos >= 5) ptsAntiguedad = 30;
  else if (anos >= 4) ptsAntiguedad = 24;
  else if (anos >= 3) ptsAntiguedad = 18;
  else if (anos >= 2) ptsAntiguedad = 10;
  else ptsAntiguedad = 4;

  // 2. Estado Físico (20 pts max)
  let ptsFisico = 5;
  if (estadoFisico === "MALO") ptsFisico = 20;
  else if (estadoFisico === "REGULAR") ptsFisico = 12;

  // 3. Rendimiento Actual (20 pts max)
  let ptsRendimiento = 5;
  if (rendimiento === "MALO") ptsRendimiento = 20;
  else if (rendimiento === "REGULAR") ptsRendimiento = 12;

  // 4. Criticidad del Cargo (15 pts max)
  const ptsCargoRaw = obtenerPuntosCargo(cargo);
  const ptsCargo = Math.round((ptsCargoRaw / 10) * 15);

  // 5. Frecuencia de Fallas / Tickets (15 pts max)
  let ptsFallas = 0;
  if (numTickets >= 5) ptsFallas = 15;
  else if (numTickets >= 3) ptsFallas = 10;
  else if (numTickets >= 1) ptsFallas = 5;

  const totalScore = ptsAntiguedad + ptsFisico + ptsRendimiento + ptsCargo + ptsFallas;

  // Recomendación
  let accion = "Sin intervención necesaria";
  let colorBadge = { bg: "#dcfce7", color: "#16a34a", border: "#86efac" };

  if (totalScore >= 65 || ptsFisico === 20 || anos >= 5) {
    accion = "Requiere Cambio Total de Equipo";
    colorBadge = { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  } else if (totalScore >= 40 || ptsRendimiento >= 12) {
    accion = "Recomendada Mejora de Hardware (RAM / SSD)";
    colorBadge = { bg: "#fefce8", color: "#a16207", border: "#fde68a" };
  }

  return {
    anos,
    ptsAntiguedad,
    ptsFisico,
    ptsRendimiento,
    ptsCargo,
    ptsFallas,
    totalScore,
    accion,
    colorBadge,
    esFechaAproximada: !fechaCompra && Boolean(fechaInstalacionWin)
  };
}

export default function Inventario() {
  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [editData, setEditData] = useState({
    host: "",
    colaborador: "",
    empresa: "",
    tipo: "",
    correo: "",
    anydesk: "",
    sede: "",
    cargo: "",
    fecha_compra: "",
    estado_fisico: "BUENO",
    rendimiento_actual: "BUENO",
  });

  // ---- Estados para la card de detalle del equipo ----
  const [hostSeleccionado, setHostSeleccionado] = useState(null);
  const [detalleEquipo, setDetalleEquipo] = useState(null);
  const [detalleSoftware, setDetalleSoftware] = useState([]);
  const [detalleTickets, setDetalleTickets] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [tabDetalle, setTabDetalle] = useState("general");

  useEffect(() => {
    obtenerEquipos();
  }, []);

  async function obtenerEquipos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("host");

    if (error) {
      console.error("Error cargando inventario:", error);
    } else {
      setEquipos(data || []);
    }
    setLoading(false);
  }

  async function guardarCambios() {
    const hostAnterior = equipos.find((e) => e.id === editandoId)?.host;

    const { error } = await supabase
      .from("colaboradores")
      .update({
        host: editData.host,
        colaborador: editData.colaborador,
        empresa: editData.empresa,
        tipo: editData.tipo,
        correo: editData.correo,
        anydesk: editData.anydesk,
        sede: editData.sede || null,
        cargo: editData.cargo,
        fecha_compra: editData.fecha_compra || null,
        estado_fisico: editData.estado_fisico,
        rendimiento_actual: editData.rendimiento_actual,
      })
      .eq("id", editandoId);

    if (error) {
      console.error(error);
      alert("Error actualizando el equipo");
      return;
    }

    setEditandoId(null);
    obtenerEquipos();

    if (hostSeleccionado && hostAnterior === hostSeleccionado) {
      abrirDetalle(editData.host);
    }
  }

  async function eliminarEquipo(id) {
    const confirmar = window.confirm("¿Está seguro de eliminar este equipo?");
    if (!confirmar) return;

    const hostEliminado = equipos.find((e) => e.id === id)?.host;

    const { error } = await supabase
      .from("colaboradores")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error eliminando equipo");
      return;
    }

    obtenerEquipos();

    if (hostSeleccionado && hostEliminado === hostSeleccionado) {
      cerrarDetalle();
    }
  }

  async function abrirDetalle(hostname) {
    setHostSeleccionado(hostname);
    setLoadingDetalle(true);
    setDetalleEquipo(null);
    setDetalleSoftware([]);
    setDetalleTickets([]);
    setTabDetalle("general");

    const [estadoRes, equipoRes, softwareRes, ticketsRes] = await Promise.all([
      supabase.from("equipos_estado").select("*").eq("hostname", hostname).maybeSingle(),
      supabase.from("equipos").select("*").eq("hostname", hostname).maybeSingle(),
      supabase.from("software_instalado").select("*").eq("hostname", hostname).order("nombre"),
      supabase.from("tickets").select("*").eq("hostname", hostname).order("created_at", { ascending: false }),
    ]);

    if (estadoRes.error) console.error("Error estado:", estadoRes.error);
    if (equipoRes.error) console.error("Error specs:", equipoRes.error);

    if (!estadoRes.error && !equipoRes.error && !estadoRes.data && !equipoRes.data) {
      setDetalleEquipo(null);
    } else {
      setDetalleEquipo({
        ...(equipoRes.data || {}),
        ...(estadoRes.data || {}),
      });
    }

    if (softwareRes.error) console.error("Error software:", softwareRes.error);
    else setDetalleSoftware(softwareRes.data || []);

    if (ticketsRes.error) console.error("Error tickets:", ticketsRes.error);
    else setDetalleTickets(ticketsRes.data || []);

    setLoadingDetalle(false);
  }

  function cerrarDetalle() {
    setHostSeleccionado(null);
    setDetalleEquipo(null);
    setDetalleSoftware([]);
    setDetalleTickets([]);
  }

  const filtrados = equipos.filter((item) => {
    const coincideBusqueda =
      item.host?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.colaborador?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.empresa?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEmpresa = filtroEmpresa === "" || item.empresa === filtroEmpresa;
    const coincideTipo = filtroTipo === "" || item.tipo === filtroTipo;

    return coincideBusqueda && coincideEmpresa && coincideTipo;
  });

  const colaboradorActual = equipos.find((e) => e.host === hostSeleccionado);

  const programaAgente = detalleSoftware.find((sw) =>
    sw.nombre?.toLowerCase().includes(NOMBRE_PROGRAMA_AGENTE)
  );
  const versionAgenteInstalada = programaAgente?.version || detalleEquipo?.version_agente || null;
  const agenteActualizado = versionAgenteInstalada ? versionAgenteInstalada === ULTIMA_VERSION_AGENTE : null;

  // Datos para la matriz de renovación
  const datosRenovacion = calcularPuntajeRenovacion({
    fechaCompra: colaboradorActual?.fecha_compra,
    fechaInstalacionWin: detalleEquipo?.fecha_instalacion,
    estadoFisico: colaboradorActual?.estado_fisico || "BUENO",
    rendimiento: colaboradorActual?.rendimiento_actual || "BUENO",
    cargo: colaboradorActual?.cargo,
    numTickets: detalleTickets.length,
  });

  return (
    <div className="p-6 flex gap-5" style={{ background: "#f0f3f8", minHeight: "100vh" }}>
      <style>{`
        * { scrollbar-width: auto; scrollbar-color: #93b4de #eff6ff; }
        *::-webkit-scrollbar { width: 14px; height: 14px; }
        *::-webkit-scrollbar-track { background: #eff6ff; border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background-color: #93b4de; border-radius: 10px; border: 3px solid #eff6ff; }
        *::-webkit-scrollbar-thumb:hover { background-color: #345D9D; }
      `}</style>

      {/* COLUMNA IZQUIERDA: Listado de inventario */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>Inventario de Equipos</h1>
            <p className="text-sm mt-1" style={{ color: "#000000" }}>Lista general de equipos registrados</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#dbeafe", color: "#345D9D", border: "1px solid #bfdbfe" }}>
            Total: {filtrados.length}
          </div>
        </div>

        {/* Buscador + Filtros */}
        <div className="mb-5 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar host, colaborador o empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl outline-none transition"
            style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
          />

          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-4 py-3 rounded-xl outline-none transition"
            style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
          >
            <option value="">Todas las empresas</option>
            {EMPRESAS.map((emp) => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-3 rounded-xl outline-none transition"
            style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#ffffff", border: "1px solid #dbeafe", maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          <table className="w-full">
            <thead style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe", position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                {["Host", "Colaborador", "Empresa", "Tipo"].map((col) => (
                  <th key={col} className="p-4 text-left text-sm font-semibold" style={{ color: "#345D9D" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-500">Cargando inventario...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-500">No se encontraron registros</td></tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item.id} className="transition border-t border-blue-50 hover:bg-slate-50">
                    <td className="p-4">
                      <span
                        onClick={() => abrirDetalle(item.host)}
                        className="font-semibold cursor-pointer hover:underline"
                        style={{ color: "#345D9D" }}
                      >
                        {item.host}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{item.colaborador}</td>
                    <td className="p-4 text-slate-600">{item.empresa}</td>
                    <td className="p-4">
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: item.tipo === "Laptop" ? "#eff6ff" : "#f3e8ff",
                          color: item.tipo === "Laptop" ? "#345D9D" : "#7e22ce",
                          border: `1px solid ${item.tipo === "Laptop" ? "#bfdbfe" : "#e9d5ff"}`,
                        }}
                      >
                        {item.tipo || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLUMNA DERECHA: Panel de detalle */}
      {hostSeleccionado && (
        <div
          className="rounded-2xl shadow-sm overflow-hidden flex flex-col"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe",
            width: "clamp(620px, 52vw, 1040px)",
            flexShrink: 0,
            maxHeight: "calc(100vh - 48px)",
            position: "sticky",
            top: "24px",
          }}
        >
          {/* Header Card */}
          <div className="flex justify-between items-center p-5" style={{ background: "#345D9D" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15">
                <Monitor size={22} color="#ffffff" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{hostSeleccionado}</h2>
                <p className="text-sm text-blue-100">Detalle del equipo</p>
              </div>
            </div>
            <button onClick={cerrarDetalle} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 text-white hover:opacity-80">
              <X size={18} />
            </button>
          </div>

          {/* Body Card */}
          <div className="p-5 overflow-y-auto flex-1">
            {loadingDetalle ? (
              <p className="text-center py-10 text-slate-500">Cargando detalle...</p>
            ) : !detalleEquipo && !colaboradorActual ? (
              <p className="text-center py-10 text-slate-500">No se encontraron datos para este equipo.</p>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {TABS_DETALLE.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setTabDetalle(id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
                      style={
                        tabDetalle === id
                          ? { background: "#345D9D", color: "#ffffff" }
                          : { background: "#ffffff", color: "#345D9D", border: "1px solid #bfdbfe" }
                      }
                    >
                      <Icon size={14} />
                      {label}
                      {id === "programas" && ` (${detalleSoftware.length})`}
                      {id === "tickets" && ` (${detalleTickets.length})`}
                    </button>
                  ))}
                </div>

                {/* TAB: GENERAL */}
                {tabDetalle === "general" && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <SeccionTitulo icon={User} texto="Colaborador asignado" />
                      {colaboradorActual && (
                        editandoId === colaboradorActual.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={guardarCambios}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-green-100 text-green-700 border border-green-300"
                            >
                              <Save size={14} /> Guardar
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-300"
                            >
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditandoId(colaboradorActual.id);
                                setEditData({
                                  host: colaboradorActual.host || "",
                                  colaborador: colaboradorActual.colaborador || "",
                                  empresa: colaboradorActual.empresa || "",
                                  tipo: colaboradorActual.tipo || "",
                                  correo: colaboradorActual.correo || "",
                                  anydesk: colaboradorActual.anydesk || "",
                                  sede: colaboradorActual.sede || "",
                                  cargo: colaboradorActual.cargo || "",
                                  fecha_compra: colaboradorActual.fecha_compra || "",
                                  estado_fisico: colaboradorActual.estado_fisico || "BUENO",
                                  rendimiento_actual: colaboradorActual.rendimiento_actual || "BUENO",
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              onClick={() => eliminarEquipo(colaboradorActual.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200"
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {editandoId === colaboradorActual?.id ? (
                      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Host</label>
                          <input
                            type="text"
                            value={editData.host}
                            onChange={(e) => setEditData({ ...editData, host: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Colaborador</label>
                          <input
                            type="text"
                            value={editData.colaborador}
                            onChange={(e) => setEditData({ ...editData, colaborador: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Empresa</label>
                          <select
                            value={editData.empresa}
                            onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          >
                            {EMPRESAS.map((emp) => (
                              <option key={emp} value={emp}>{emp}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                          <select
                            value={editData.tipo}
                            onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          >
                            {TIPOS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Sede</label>
                          <select
                            value={editData.sede}
                            onChange={(e) => setEditData({ ...editData, sede: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          >
                            <option value="">Seleccionar Sede</option>
                            {SEDES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Cargo / Puesto</label>
                          <input
                            type="text"
                            value={editData.cargo}
                            onChange={(e) => setEditData({ ...editData, cargo: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            value={editData.correo}
                            onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">AnyDesk ID</label>
                          <input
                            type="text"
                            value={editData.anydesk}
                            onChange={(e) => setEditData({ ...editData, anydesk: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de Compra</label>
                          <input
                            type="date"
                            value={editData.fecha_compra}
                            onChange={(e) => setEditData({ ...editData, fecha_compra: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Estado Físico</label>
                          <select
                            value={editData.estado_fisico}
                            onChange={(e) => setEditData({ ...editData, estado_fisico: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          >
                            {OPCIONES_CALIFICACION.map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Rendimiento Actual</label>
                          <select
                            value={editData.rendimiento_actual}
                            onChange={(e) => setEditData({ ...editData, rendimiento_actual: e.target.value })}
                            className="w-full p-2 rounded border bg-white"
                          >
                            {OPCIONES_CALIFICACION.map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-xs text-slate-500 block">Colaborador</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.colaborador || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Cargo / Puesto</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.cargo || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Empresa</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.empresa || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Sede</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.sede || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Correo</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.correo || "—"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">AnyDesk ID</span>
                          <span className="font-semibold text-slate-800">{colaboradorActual?.anydesk || "—"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: MATRIZ DE RENOVACIÓN */}
                {tabDetalle === "renovacion" && (
                  <div className="space-y-5">
                    <SeccionTitulo icon={RefreshCw} texto="Evaluación de Renovación de Equipo" />

                    {/* Banner Resumen / Recomendación */}
                    <div
                      className="p-4 rounded-2xl border flex items-center justify-between"
                      style={{
                        background: datosRenovacion.colorBadge.bg,
                        color: datosRenovacion.colorBadge.color,
                        borderColor: datosRenovacion.colorBadge.border,
                      }}
                    >
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                          Dictamen Sugerido
                        </div>
                        <div className="text-lg font-extrabold">{datosRenovacion.accion}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                          Puntaje Global
                        </div>
                        <div className="text-2xl font-black">{datosRenovacion.totalScore} / 100 pts</div>
                      </div>
                    </div>

                    {/* Tabla Desglose de Puntaje */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                          <tr>
                            <th className="p-3">Criterio</th>
                            <th className="p-3">Dato Actual</th>
                            <th className="p-3 text-right">Puntaje</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-3 font-medium text-slate-700">
                              Antigüedad
                              {datosRenovacion.esFechaAproximada && (
                                <span className="block text-[11px] text-amber-600 font-normal">
                                  * Estimado por instalación de Win
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">{datosRenovacion.anos} años</td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {datosRenovacion.ptsAntiguedad} / 30 pts
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-700">Estado Físico (Manual)</td>
                            <td className="p-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100">
                                {colaboradorActual?.estado_fisico || "BUENO"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {datosRenovacion.ptsFisico} / 20 pts
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-700">Rendimiento (Manual)</td>
                            <td className="p-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100">
                                {colaboradorActual?.rendimiento_actual || "BUENO"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {datosRenovacion.ptsRendimiento} / 20 pts
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-700">Criticidad del Cargo</td>
                            <td className="p-3 text-slate-600">{colaboradorActual?.cargo || "No especificado"}</td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {datosRenovacion.ptsCargo} / 15 pts
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium text-slate-700">Frecuencia de Tickets/Fallas</td>
                            <td className="p-3 text-slate-600">{detalleTickets.length} tickets reportados</td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {datosRenovacion.ptsFallas} / 15 pts
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Nota aclaratoria */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        Para modificar el <b>Estado Físico</b>, el <b>Rendimiento</b> o la <b>Fecha de Compra</b>, ve a la pestaña <b>General</b> y haz clic en el botón <b>Editar</b>.
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB: HARDWARE */}
                {tabDetalle === "hardware" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Cpu} texto="Componentes Físicos" />
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-500 block">Procesador</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.procesador || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Memoria RAM</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.ram || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Almacenamiento</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.disco || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Placa Base</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.motherboard || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SISTEMA */}
                {tabDetalle === "sistema" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Monitor} texto="Sistema Operativo y BIOS" />
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-500 block">Sistema Operativo</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.so || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Arquitectura</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.arquitectura || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Fecha Instalación Windows</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.fecha_instalacion || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Versión de BIOS</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.bios_version || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: RED */}
                {tabDetalle === "red" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Wifi} texto="Direccionamiento y Red" />
                    <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs text-slate-500 block">Dirección IP Local</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.ip_local || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Dirección MAC</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.mac || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-500 block">Adaptador de Red</span>
                        <span className="font-semibold text-slate-800">{detalleEquipo?.adaptador_red || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: AGENTE */}
                {tabDetalle === "agente" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Bot} texto="Estado del Agente Aurica" />
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Versión Instalada:</span>
                        <span className="font-bold text-slate-800">{versionAgenteInstalada || "No detectada"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Última Versión Requerida:</span>
                        <span className="font-bold text-slate-800">{ULTIMA_VERSION_AGENTE}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-slate-600">Estado de Actualización:</span>
                        {agenteActualizado === true && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg border border-green-200">
                            <CircleCheck size={14} /> Actualizado
                          </span>
                        )}
                        {agenteActualizado === false && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg border border-red-200">
                            <CircleX size={14} /> Desactualizado
                          </span>
                        )}
                        {agenteActualizado === null && (
                          <span className="text-xs text-slate-400">Sin datos</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: PROGRAMAS */}
                {tabDetalle === "programas" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Package} texto="Programas Instalados" />
                    {detalleSoftware.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No hay registro de software para este equipo.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase sticky top-0">
                            <tr>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Versión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detalleSoftware.map((sw, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 text-slate-700 font-medium">{sw.nombre}</td>
                                <td className="p-3 text-slate-500">{sw.version || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: TICKETS */}
                {tabDetalle === "tickets" && (
                  <div className="space-y-4">
                    <SeccionTitulo icon={Ticket} texto="Historial de Tickets" />
                    {detalleTickets.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No hay tickets registrados para este equipo.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {detalleTickets.map((t) => {
                          const est = ESTADOS_TICKET[t.estado?.toLowerCase()] || ESTADOS_TICKET._default;
                          const prio = PRIORIDADES_TICKET[t.prioridad?.toLowerCase()] || PRIORIDADES_TICKET._default;
                          return (
                            <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">#{t.id} - {t.titulo || "Ticket de soporte"}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: est.bg, color: est.color, border: `1px solid ${est.border}` }}>
                                  {est.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">{t.descripcion || "Sin descripción"}</p>
                              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                                <span>Prioridad: <b style={{ color: prio.color }}>{prio.label}</b></span>
                                <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}