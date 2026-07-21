import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Pencil, Trash2, Save, X, Monitor, Cpu, HardDrive,
  Package, User, CircleCheck, CircleX,
  Wifi, Server, Bot, Clock,
  Info, Ticket, Mail, MapPin,
} from "lucide-react";

// =============================================================
// COMPONENTE: Inventario
// Tabla de gestión de equipos registrados en el sistema.
// Permite al equipo de TI visualizar, buscar, filtrar y editar
// los datos de cada equipo (host, colaborador, empresa y tipo).
//
// No recibe props — consume Supabase directamente.
// =============================================================

// Lista fija de empresas disponibles para el filtro
const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU"];

// Lista fija de tipos de equipo disponibles
const TIPOS = ["Laptop", "PC"];

// Lista fija de sedes disponibles (columna "sede" en colaboradores)
const SEDES = ["LIMA", "AREQUIPA", "CHALA"];

// Última versión publicada del Aurica Inventory Agent. Cuando saques
// una versión nueva, solo actualiza este valor — la pestaña "Agente"
// compara automáticamente contra esto en cada equipo, sin tocar
// Supabase ni el resto del código.
const ULTIMA_VERSION_AGENTE = "1.0.14";

// Nombre (o parte del nombre) con el que el agente aparece en la
// lista de "Programas instalados" de Windows. Se usa para detectar
// automáticamente la versión realmente instalada en cada equipo.
const NOMBRE_PROGRAMA_AGENTE = "aurica inventory agent";

// Estilos de la pestaña "Tickets": colores según el estado y la
// prioridad del ticket, tomados de los valores reales de la tabla
// "tickets" (abierto / resuelto, y bajo / medio / alto / critico / emergencia).
const ESTADOS_TICKET = {
  abierto:  { label: "Abierto",  bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
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

// Pestañas del panel de detalle. Se definen como lista para poder
// pintarlas dinámicamente y para que agregar una nueva pestaña en
// el futuro sea solo cuestión de sumar un elemento aquí.
const TABS_DETALLE = [
  { id: "general",  label: "General",   icon: Info },
  { id: "hardware", label: "Hardware",  icon: Cpu },
  { id: "sistema",  label: "Sistema",   icon: Monitor },
  { id: "red",      label: "Red",       icon: Wifi },
  { id: "agente",   label: "Agente",    icon: Bot },
  { id: "programas",label: "Programas", icon: Package },
  { id: "tickets",  label: "Tickets",   icon: Ticket },
];

export default function Inventario() {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [equipos, setEquipos] = useState([]);       // Lista completa de equipos desde Supabase
  const [busqueda, setBusqueda] = useState("");      // Texto del input de búsqueda en tiempo real
  const [filtroEmpresa, setFiltroEmpresa] = useState(""); // Filtro seleccionado de empresa ("" = todas)
  const [filtroTipo, setFiltroTipo] = useState("");       // Filtro seleccionado de tipo ("" = todos)
  const [loading, setLoading] = useState(true);     // Controla el estado de carga inicial

  const [editandoId, setEditandoId] = useState(null); // ID del equipo actualmente en modo edición
  const [editData, setEditData] = useState({           // Datos temporales del equipo que se está editando
    host: "",
    colaborador: "",
    empresa: "",
    tipo: "",
    correo: "",
    anydesk: "",
    sede: "",
  });

  // ---- Estados para la card de detalle del equipo ----
  const [hostSeleccionado, setHostSeleccionado] = useState(null); // hostname del equipo abierto en la card, null = cerrada
  const [detalleEquipo, setDetalleEquipo] = useState(null);       // fila de la tabla "equipos" para ese hostname
  const [detalleSoftware, setDetalleSoftware] = useState([]);     // filas de "software_instalado" para ese hostname
  const [detalleTickets, setDetalleTickets] = useState([]);       // filas de "tickets" para ese hostname
  const [loadingDetalle, setLoadingDetalle] = useState(false);    // controla el spinner dentro de la card
  const [tabDetalle, setTabDetalle] = useState("general");        // pestaña activa dentro del panel de detalle

  // ----------------------------------------------------------
  // EFECTO INICIAL
  // Carga los equipos desde Supabase al montar el componente.
  // ----------------------------------------------------------
  useEffect(() => {
    obtenerEquipos();
  }, []);

  // ----------------------------------------------------------
  // OBTENER EQUIPOS
  // Consulta la tabla "colaboradores" ordenada por nombre de host.
  // En caso de error lo registra en consola.
  // ----------------------------------------------------------
  async function obtenerEquipos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("host");

    if (error) {
      console.error("Error cargando inventario:", error);
    } else {
      setEquipos(data);
    }

    setLoading(false);
  }

  // ----------------------------------------------------------
  // GUARDAR CAMBIOS
  // Actualiza en Supabase el registro cuyo id coincide con
  // editandoId usando los datos temporales de editData.
  // Al terminar, cierra el modo edición y recarga la tabla.
  // Si el host editado es el que está abierto en la card de
  // detalle, actualiza la card para que siga apuntando al
  // hostname correcto (por si se le cambió el nombre).
  // ----------------------------------------------------------
  async function guardarCambios() {
    const hostAnterior = equipos.find((e) => e.id === editandoId)?.host;

    const { error } = await supabase
      .from("colaboradores")
      .update({
        host:         editData.host,
        colaborador:  editData.colaborador,
        empresa:      editData.empresa,
        tipo:         editData.tipo,
        correo:       editData.correo,
        anydesk:      editData.anydesk,
        sede:         editData.sede,
      })
      .eq("id", editandoId);

    if (error) {
      console.error(error);
      alert("Error actualizando");
      return;
    }

    setEditandoId(null);
    obtenerEquipos();

    if (hostSeleccionado && hostAnterior === hostSeleccionado && editData.host !== hostAnterior) {
      abrirDetalle(editData.host);
    }
  }

  async function eliminarEquipo(id) {
  const confirmar = window.confirm(
    "¿Está seguro de eliminar este equipo?"
  );

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

  // ----------------------------------------------------------
  // ABRIR DETALLE DE EQUIPO
  // Consulta la tabla "equipos" (specs) y "software_instalado"
  // (lista de programas) filtrando ambas por el mismo hostname.
  // Se dispara al hacer clic sobre el nombre de host en la tabla.
  // ----------------------------------------------------------
  async function abrirDetalle(hostname) {
    setHostSeleccionado(hostname);
    setLoadingDetalle(true);
    setDetalleEquipo(null);
    setDetalleSoftware([]);
    setTabDetalle("general");

    const [estadoRes, equipoRes, softwareRes, ticketsRes] = await Promise.all([
      supabase
        .from("equipos_estado")
        .select("*")
        .eq("hostname", hostname)
        .maybeSingle(),
      supabase
        .from("equipos")
        .select("*")
        .eq("hostname", hostname)
        .maybeSingle(),
      supabase
        .from("software_instalado")
        .select("*")
        .eq("hostname", hostname)
        .order("nombre"),
      supabase
        .from("tickets")
        .select("*")
        .eq("hostname", hostname)
        .order("created_at", { ascending: false }),
    ]);

    if (estadoRes.error) {
      console.error("Error cargando estado en vivo del equipo:", estadoRes.error);
    }

    if (equipoRes.error) {
      console.error("Error cargando specs del equipo:", equipoRes.error);
    }

    if (!estadoRes.error && !equipoRes.error && !estadoRes.data && !equipoRes.data) {
      setDetalleEquipo(null);
    } else if (estadoRes.error && equipoRes.error) {
      setDetalleEquipo(null);
    } else {
      // "equipos" trae las specs completas (hardware, red, bios, agente);
      // "equipos_estado" trae el estado en vivo (online/offline, activo)
      // y pisa esos campos si hay coincidencia entre ambas tablas.
      setDetalleEquipo({
        ...(equipoRes.data || {}),
        ...(estadoRes.data || {}),
      });
    }

    if (softwareRes.error) {
      console.error("Error cargando software instalado:", softwareRes.error);
    } else {
      setDetalleSoftware(softwareRes.data || []);
    }

    if (ticketsRes.error) {
      console.error("Error cargando tickets del equipo:", ticketsRes.error);
    } else {
      setDetalleTickets(ticketsRes.data || []);
    }

    setLoadingDetalle(false);
  }

  function cerrarDetalle() {
    setHostSeleccionado(null);
    setDetalleEquipo(null);
    setDetalleSoftware([]);
    setDetalleTickets([]);
  }

  // ----------------------------------------------------------
  // FILTRADO EN TIEMPO REAL
  // Filtra los equipos localmente según:
  //   - texto de búsqueda (host, colaborador, empresa)
  //   - empresa seleccionada en el dropdown (si hay una)
  //   - tipo seleccionado en el dropdown (si hay uno)
  // ----------------------------------------------------------
  const filtrados = equipos.filter((item) => {
    const coincideBusqueda =
      item.host?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.colaborador?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.empresa?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEmpresa =
      filtroEmpresa === "" || item.empresa === filtroEmpresa;

    const coincideTipo =
      filtroTipo === "" || item.tipo === filtroTipo;

    return coincideBusqueda && coincideEmpresa && coincideTipo;
  });

  // ----------------------------------------------------------
  // COLABORADOR ACTUAL DE LA CARD ABIERTA
  // Busca en "equipos" (tabla colaboradores) la fila que
  // corresponde al hostname abierto en el panel de detalle.
  // Se usa para editar/eliminar desde ahí en vez de la tabla.
  // ----------------------------------------------------------
  const colaboradorActual = equipos.find((e) => e.host === hostSeleccionado);

  // ----------------------------------------------------------
  // VERSIÓN DEL AGENTE DETECTADA AUTOMÁTICAMENTE
  // Busca en la lista de software instalado (detalleSoftware) el
  // programa del Aurica Inventory Agent y toma su versión de ahí.
  // Esto refleja lo que realmente está instalado en el equipo,
  // sin depender de una columna aparte que el agente reporte y
  // que se pueda quedar desactualizada.
  // ----------------------------------------------------------
  const programaAgente = detalleSoftware.find((sw) =>
    sw.nombre?.toLowerCase().includes(NOMBRE_PROGRAMA_AGENTE)
  );
  const versionAgenteInstalada = programaAgente?.version || detalleEquipo?.version_agente || null;
  const agenteActualizado = versionAgenteInstalada
    ? versionAgenteInstalada === ULTIMA_VERSION_AGENTE
    : null;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="p-6 flex gap-5" style={{ background: "#f0f3f8", minHeight: "100vh" }}>

      {/* --------------------------------------------------------
          SCROLLBAR PERSONALIZADO
          Hace el scroll más grueso y visible (tanto en la página
          general como dentro del panel de detalle), usando los
          colores de la paleta de la app.
      -------------------------------------------------------- */}
      <style>{`
        * {
          scrollbar-width: auto;
          scrollbar-color: #93b4de #eff6ff;
        }
        *::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        *::-webkit-scrollbar-track {
          background: #eff6ff;
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background-color: #93b4de;
          border-radius: 10px;
          border: 3px solid #eff6ff;
        }
        *::-webkit-scrollbar-thumb:hover {
          background-color: #345D9D;
        }
      `}</style>

      {/* ============================================================
          COLUMNA IZQUIERDA: listado de inventario
          Ocupa todo el espacio disponible (flex-1). Cuando el panel
          de detalle está abierto, esta columna se comprime en vez
          de quedar tapada por un overlay.
      ============================================================ */}
      <div className="flex-1 min-w-0">

      {/* --------------------------------------------------------
          ENCABEZADO
          Título, descripción y contador de equipos visibles.
          El contador se actualiza según los filtros activos.
      -------------------------------------------------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ color: "#000000" }}>Inventario de Equipos</h1>
          <p className="text-sm mt-1 text-slate-500" style={{ color: "#000000" }}>Lista general de equipos registrados</p>
        </div>
        <div
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#dbeafe", color: "#345D9D", border: "1px solid #bfdbfe" }}
        >
          Total: {filtrados.length}
        </div>
      </div>

      {/* --------------------------------------------------------
          BUSCADOR + FILTROS
          Input de texto que filtra la tabla en tiempo real
          por host, nombre del colaborador o empresa.
          Dos selects adicionales: empresa y tipo de equipo.
      -------------------------------------------------------- */}
      <div className="mb-5 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar host, colaborador o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl outline-none transition"
          style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
          onFocus={(e) => (e.target.style.border = "1px solid #345D9D")}
          onBlur={(e) => (e.target.style.border = "1px solid #dbeafe")}
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

      {/* --------------------------------------------------------
          TABLA DE EQUIPOS
          Muestra los equipos filtrados con 5 columnas:
          Host · Colaborador · Empresa · Tipo · Acción (Editar/Guardar)

          Cada fila muestra los datos en solo lectura; para editar o
          eliminar un equipo, se abre su card de detalle (clic en el host).
      -------------------------------------------------------- */}
      <div
        className="rounded-2xl shadow-sm"
        style={{
          background: "#ffffff",
          border: "1px solid #dbeafe",
          maxHeight: "calc(100vh - 260px)",
          overflowY: "auto",
        }}
      >
        <table className="w-full">

          {/* Cabecera de la tabla — sticky para que quede visible
              mientras se hace scroll dentro de este contenedor */}
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

            {/* Estado: cargando datos */}
            {loading ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-slate-500">
                  Cargando inventario...
                </td>
              </tr>

            /* Estado: sin resultados para el filtro actual */
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-slate-500">
                  No se encontraron registros
                </td>
              </tr>

            /* Estado: lista de equipos */
            ) : (
              filtrados.map((item) => (
                <tr
                  key={item.id}
                  className="transition"
                  style={{ borderTop: "1px solid #eff6ff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fbff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >

                  {/* CELDA: Host — al hacer clic abre la card de detalle,
                      donde ahora vive toda la edición del equipo. */}
                  <td className="p-4">
                    <span
                      onClick={() => abrirDetalle(item.host)}
                      className="font-semibold cursor-pointer hover:underline"
                      style={{ color: "#345D9D" }}
                      title="Ver detalle del equipo"
                    >
                      {item.host}
                    </span>
                  </td>

                  {/* CELDA: Colaborador */}
                  <td className="p-4">
                    <span style={{ color: "#475569" }}>{item.colaborador}</span>
                  </td>

                  {/* CELDA: Empresa */}
                  <td className="p-4">
                    <span style={{ color: "#475569" }}>{item.empresa}</span>
                  </td>

                  {/* CELDA: Tipo */}
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
      {/* fin columna izquierda */}

      {/* ============================================================
          COLUMNA DERECHA: panel de detalle del equipo
          Solo se renderiza cuando hay un host seleccionado. Es parte
          del layout normal (no overlay), igual que el panel de un
          ticket: la lista queda a la izquierda y el detalle a la
          derecha, ambos visibles al mismo tiempo.

          Ancho ampliado: ahora usa clamp() para escalar entre 620px
          y 1040px según el ancho de la ventana, dejando bastante más
          espacio para las secciones (Hardware, Sistema, Red, Agente).
      ============================================================ */}
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
            {/* Encabezado del panel */}
            <div
              className="flex justify-between items-center p-5"
              style={{ background: "#345D9D" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Monitor size={22} color="#ffffff" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{hostSeleccionado}</h2>
                  <p className="text-sm" style={{ color: "#dbeafe" }}>Detalle del equipo</p>
                </div>
              </div>
              <button
                onClick={cerrarDetalle}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo del panel (scrollable) */}
            <div className="p-5 overflow-y-auto flex-1">

              {loadingDetalle ? (
                <p className="text-center py-10" style={{ color: "#64748b" }}>Cargando detalle...</p>

              ) : !detalleEquipo ? (
                <p className="text-center py-10" style={{ color: "#64748b" }}>
                  No se encontraron especificaciones para este equipo en la tabla "equipos".
                </p>

              ) : (
                <>
                  {/* ---- PESTAÑAS (tipo pill, igual estilo que Prioridad/Categoría) ---- */}
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

                  {/* ---- PESTAÑA: GENERAL ---- */}
                  {tabDetalle === "general" && (
                    <>
                      {/* ---- Colaborador asignado (tabla "colaboradores") ----
                          Editable desde aquí: nombre, correo, empresa, tipo
                          y anydesk. Reutiliza los mismos estados y funciones
                          (editandoId, editData, guardarCambios, eliminarEquipo)
                          que antes vivían en la tabla principal. */}
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                          <SeccionTitulo icon={User} texto="Colaborador asignado" />

                          {colaboradorActual && (
                            editandoId === colaboradorActual.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={guardarCambios}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                  style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" }}
                                >
                                  <Save size={14} /> Guardar
                                </button>
                                <button
                                  onClick={() => setEditandoId(null)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                  style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
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
                                    });
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                  style={{ background: "#eff6ff", color: "#345D9D", border: "1px solid #bfdbfe" }}
                                >
                                  <Pencil size={14} /> Editar
                                </button>
                                <button
                                  onClick={() => eliminarEquipo(colaboradorActual.id)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                                >
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </div>
                            )
                          )}
                        </div>

                        {colaboradorActual && editandoId === colaboradorActual.id ? (
                          /* ---- Modo edición ---- */
                          <div className="grid grid-cols-3 gap-4">
                            <CampoEditable label="Nombre">
                              <input
                                value={editData.colaborador}
                                onChange={(e) => setEditData({ ...editData, colaborador: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              />
                            </CampoEditable>

                            <CampoEditable label="Correo">
                              <input
                                type="email"
                                value={editData.correo}
                                onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              />
                            </CampoEditable>

                            <CampoEditable label="Empresa">
                              <select
                                value={editData.empresa}
                                onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              >
                                <option value="">Seleccionar...</option>
                                {EMPRESAS.map((emp) => (
                                  <option key={emp} value={emp}>{emp}</option>
                                ))}
                              </select>
                            </CampoEditable>

                            <CampoEditable label="Tipo de equipo">
                              <select
                                value={editData.tipo}
                                onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              >
                                <option value="">Seleccionar...</option>
                                {TIPOS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </CampoEditable>

                            <CampoEditable label="AnyDesk">
                              <input
                                value={editData.anydesk}
                                onChange={(e) => setEditData({ ...editData, anydesk: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              />
                            </CampoEditable>

                            <CampoEditable label="Sede / Ubicación">
                              <select
                                value={editData.sede}
                                onChange={(e) => setEditData({ ...editData, sede: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              >
                                <option value="">Seleccionar...</option>
                                {SEDES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </CampoEditable>

                            <CampoEditable label="Host">
                              <input
                                value={editData.host}
                                onChange={(e) => setEditData({ ...editData, host: e.target.value })}
                                className="w-full outline-none text-base font-semibold bg-transparent"
                                style={{ color: "#1e293b" }}
                              />
                            </CampoEditable>
                          </div>
                        ) : (
                          /* ---- Modo lectura ---- */
                          <div className="grid grid-cols-3 gap-4">
                            <DetalleItem label="Nombre" valor={colaboradorActual?.colaborador} />
                            <DetalleItem
                              label="Correo"
                              valorNodo={
                                colaboradorActual?.correo ? (
                                  <span className="flex items-center gap-1.5" style={{ color: "#1e293b" }}>
                                    <Mail size={13} style={{ color: "#94a3b8" }} /> {colaboradorActual.correo}
                                  </span>
                                ) : undefined
                              }
                            />
                            <DetalleItem label="Empresa" valor={colaboradorActual?.empresa} />
                            <DetalleItem label="Tipo de equipo" valor={colaboradorActual?.tipo} />
                            <DetalleItem label="AnyDesk" valor={colaboradorActual?.anydesk} />
                            <DetalleItem
                              label="Sede / Ubicación"
                              valorNodo={
                                colaboradorActual?.sede ? (
                                  <span className="flex items-center gap-1.5" style={{ color: "#1e293b" }}>
                                    <MapPin size={13} style={{ color: "#94a3b8" }} /> {colaboradorActual.sede}
                                  </span>
                                ) : undefined
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* ---- Datos del equipo (tabla "equipos_estado") ---- */}
                      <div className="mb-5">
                        <SeccionTitulo icon={Monitor} texto="Datos básicos del equipo" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Usuario" valor={detalleEquipo.usuario?.replace(/\$$/, "")} />
                          <DetalleItem label="Serial" valor={detalleEquipo.serial} />
                          <DetalleItem
                            label={colaboradorActual?.tipo === "PC" ? "Marca de placa madre" : "Marca"}
                            valor={detalleEquipo.marca}
                          />
                          <DetalleItem label="Modelo" valor={detalleEquipo.modelo} />
                          <DetalleItem label="Estado" valor={detalleEquipo.estado} />
                          <DetalleItem
                            label="Activo"
                            valorNodo={
                              detalleEquipo.activo ? (
                                <span className="flex items-center gap-1" style={{ color: "#16a34a" }}>
                                  <CircleCheck size={14} /> Sí
                                </span>
                              ) : (
                                <span className="flex items-center gap-1" style={{ color: "#dc2626" }}>
                                  <CircleX size={14} /> No
                                </span>
                              )
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- PESTAÑA: HARDWARE ---- */}
                  {tabDetalle === "hardware" && (
                    <>
                      <div className="mb-5">
                        <SeccionTitulo icon={Cpu} texto="Procesador y memoria" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="CPU" valor={detalleEquipo.cpu} />
                          <DetalleItem label="RAM total" valor={detalleEquipo.ram_gb ? `${detalleEquipo.ram_gb} GB` : null} />
                          <DetalleItem label="Tipo de RAM" valor={detalleEquipo.ram_tipo} />
                          <DetalleItem
                            label="Velocidad RAM"
                            valor={detalleEquipo.ram_velocidad_mhz ? `${detalleEquipo.ram_velocidad_mhz} MHz` : null}
                          />
                          <DetalleItem
                            label="Slots RAM"
                            valor={
                              detalleEquipo.ram_slots
                                ? `${detalleEquipo.ram_slots_ocupados ?? "?"} / ${detalleEquipo.ram_slots} ocupados`
                                : null
                            }
                          />
                        </div>
                      </div>

                      <div className="mb-5">
                        <SeccionTitulo icon={HardDrive} texto="Almacenamiento" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem
                            label="Disco total"
                            valor={detalleEquipo.disco_total_gb ? `${detalleEquipo.disco_total_gb} GB` : null}
                          />
                          <DetalleItem
                            label="Disco libre"
                            valor={
                              detalleEquipo.disco_libre_gb
                                ? `${detalleEquipo.disco_libre_gb} GB (${detalleEquipo.disco_libre_porcentaje ?? "?"}%)`
                                : null
                            }
                          />
                          <DetalleItem label="Tipo de disco" valor={detalleEquipo.disco_tipo} />
                          <DetalleItem label="Modelo de disco" valor={detalleEquipo.disco_modelo} />
                          <DetalleItem label="Fabricante de disco" valor={detalleEquipo.disco_fabricante} />
                          <DetalleItem label="Serial de disco" valor={detalleEquipo.disco_serial} />
                        </div>
                      </div>

                      <div>
                        <SeccionTitulo icon={Server} texto="Placa base y BIOS" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Fabricante de placa" valor={detalleEquipo.placa_fabricante} />
                          <DetalleItem label="Modelo de placa" valor={detalleEquipo.placa_modelo} />
                          <DetalleItem label="Serial de placa" valor={detalleEquipo.placa_serial} />
                          <DetalleItem label="Fabricante BIOS" valor={detalleEquipo.fabricante_bios} />
                          <DetalleItem label="Versión BIOS" valor={detalleEquipo.bios_version} />
                          <DetalleItem label="Fecha BIOS" valor={detalleEquipo.bios_release_date} />
                          <DetalleItem
                            label="Secure Boot"
                            valorNodo={
                              detalleEquipo.secure_boot === null || detalleEquipo.secure_boot === undefined ? undefined : (
                                detalleEquipo.secure_boot ? (
                                  <span className="flex items-center gap-1" style={{ color: "#16a34a" }}><CircleCheck size={14} /> Activado</span>
                                ) : (
                                  <span className="flex items-center gap-1" style={{ color: "#dc2626" }}><CircleX size={14} /> Desactivado</span>
                                )
                              )
                            }
                          />
                          <DetalleItem
                            label="TPM"
                            valorNodo={
                              detalleEquipo.tpm === null || detalleEquipo.tpm === undefined ? undefined : (
                                detalleEquipo.tpm ? (
                                  <span className="flex items-center gap-1" style={{ color: "#16a34a" }}><CircleCheck size={14} /> Presente</span>
                                ) : (
                                  <span className="flex items-center gap-1" style={{ color: "#dc2626" }}><CircleX size={14} /> No detectado</span>
                                )
                              )
                            }
                          />
                          <DetalleItem label="BitLocker" valor={detalleEquipo.bitlocker ? "Activado" : null} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- PESTAÑA: SISTEMA OPERATIVO ---- */}
                  {tabDetalle === "sistema" && (
                    <div>
                      <SeccionTitulo icon={Monitor} texto="Sistema operativo" />
                      <div className="grid grid-cols-3 gap-4">
                        <DetalleItem
                          label="Windows"
                          valor={
                            detalleEquipo.windows
                              ? `${detalleEquipo.windows}${detalleEquipo.windows_version ? " · " + detalleEquipo.windows_version : ""}`
                              : null
                          }
                        />
                        <DetalleItem label="Compilación (Build)" valor={detalleEquipo.windows_build} />
                        <DetalleItem label="Arquitectura" valor={detalleEquipo.windows_architecture} />
                        <DetalleItem label="Fecha de instalación" valor={detalleEquipo.windows_install_date} />
                        <DetalleItem label="Último reinicio" valor={formatearFecha(detalleEquipo.ultimo_reinicio)} />
                        <DetalleItem label="Último inicio" valor={formatearFecha(detalleEquipo.ultimo_inicio_windows)} />
                        <DetalleItem label="Windows activado" pendiente />
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: RED ---- */}
                  {tabDetalle === "red" && (
                    <div>
                      <SeccionTitulo icon={Wifi} texto="Conectividad" />
                      <div className="grid grid-cols-3 gap-4">
                        <DetalleItem label="IP local" valor={detalleEquipo.ip} />
                        <DetalleItem label="Gateway" valor={detalleEquipo.gateway} />
                        <DetalleItem label="DNS" valor={detalleEquipo.dns} />
                        <DetalleItem label="Dominio" valor={detalleEquipo.dominio} />
                        <DetalleItem label="Adaptador" valor={detalleEquipo.adaptador_red} />
                        <DetalleItem label="MAC" valor={detalleEquipo.mac} />
                        <DetalleItem label="IP pública" pendiente />
                        <DetalleItem label="Velocidad de red" pendiente />
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: AGENTE ----
                      Aurica Inventory Agent: versión instalada (detectada
                      automáticamente desde Programas), estado del servicio
                      y fechas de sincronización. */}
                  {tabDetalle === "agente" && (
                    <>
                      <div className="mb-5">
                        <SeccionTitulo icon={Bot} texto="Estado del agente" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Versión instalada" valor={versionAgenteInstalada} />
                          <DetalleItem label="Última versión disponible" valor={ULTIMA_VERSION_AGENTE} />
                          <DetalleItem
                            label="Estado de actualización"
                            valorNodo={
                              agenteActualizado === null ? undefined : agenteActualizado ? (
                                <span className="flex items-center gap-1" style={{ color: "#16a34a" }}>
                                  <CircleCheck size={14} /> Actualizado
                                </span>
                              ) : (
                                <span className="flex items-center gap-1" style={{ color: "#dc2626" }}>
                                  <CircleX size={14} /> Desactualizado
                                </span>
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <SeccionTitulo icon={Clock} texto="Sincronización" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem
                            label="Última sincronización"
                            valor={formatearFecha(detalleEquipo.ultima_sincronizacion)}
                          />
                          <DetalleItem label="Servicio de Windows" valor={detalleEquipo.estado_servicio} />
                          <DetalleItem
                            label="Última revisión de actualización"
                            valor={formatearFecha(detalleEquipo.ultima_revision_actualizacion)}
                          />
                          <DetalleItem
                            label="Última actualización del agente"
                            valor={formatearFecha(detalleEquipo.ultima_actualizacion_agente)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- PESTAÑA: SOFTWARE INSTALADO ---- */}
                  {tabDetalle === "programas" && (
                    <div>
                      <SeccionTitulo icon={Package} texto={`Software instalado (${detalleSoftware.length})`} />

                      {detalleSoftware.length === 0 ? (
                        <p className="text-sm" style={{ color: "#64748b" }}>
                          No hay software registrado para este equipo.
                        </p>
                      ) : (
                        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #dbeafe" }}>
                          <table className="w-full text-sm">
                            <thead style={{ background: "#eff6ff" }}>
                              <tr>
                                <th className="p-2 text-left" style={{ color: "#345D9D" }}>Programa</th>
                                <th className="p-2 text-left" style={{ color: "#345D9D" }}>Versión</th>
                                <th className="p-2 text-left" style={{ color: "#345D9D" }}>Fabricante</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalleSoftware.map((sw) => (
                                <tr key={sw.id} style={{ borderTop: "1px solid #eff6ff" }}>
                                  <td className="p-2" style={{ color: "#1e293b" }}>{sw.nombre}</td>
                                  <td className="p-2" style={{ color: "#475569" }}>{sw.version || "—"}</td>
                                  <td className="p-2" style={{ color: "#475569" }}>{sw.fabricante || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---- PESTAÑA: TICKETS ----
                      Muestra los tickets del Portal de soporte TI
                      registrados para este mismo hostname, del más
                      reciente al más antiguo. */}
                  {tabDetalle === "tickets" && (
                    <div>
                      <SeccionTitulo icon={Ticket} texto={`Tickets (${detalleTickets.length})`} />

                      {detalleTickets.length === 0 ? (
                        <p className="text-sm" style={{ color: "#64748b" }}>
                          No hay tickets registrados para este equipo.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {detalleTickets.map((tk) => {
                            const estadoStyle = ESTADOS_TICKET[tk.estado] || ESTADOS_TICKET._default;
                            const prioridadStyle = PRIORIDADES_TICKET[tk.prioridad] || PRIORIDADES_TICKET._default;

                            return (
                              <div
                                key={tk.id}
                                className="p-4 rounded-xl"
                                style={{ background: "#f8fbff", border: "1px solid #eff6ff" }}
                              >
                                <div className="flex justify-between items-start gap-3 mb-2">
                                  <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                                    #{tk.id} · {tk.titulo}
                                  </p>
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-semibold shrink-0"
                                    style={{ background: estadoStyle.bg, color: estadoStyle.color, border: `1px solid ${estadoStyle.border}` }}
                                  >
                                    {estadoStyle.label}
                                  </span>
                                </div>

                                {tk.descripcion && (
                                  <p className="text-sm mb-3" style={{ color: "#475569" }}>{tk.descripcion}</p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: prioridadStyle.bg, color: prioridadStyle.color, border: `1px solid ${prioridadStyle.border}` }}
                                  >
                                    Prioridad: {prioridadStyle.label}
                                  </span>
                                  {tk.nombre_colaborador && (
                                    <span className="px-2 py-1 rounded-lg text-xs" style={{ background: "#eff6ff", color: "#345D9D", border: "1px solid #bfdbfe" }}>
                                      {tk.nombre_colaborador}{tk.empresa ? ` · ${tk.empresa}` : ""}
                                    </span>
                                  )}
                                  {tk.anydesk && (
                                    <span className="px-2 py-1 rounded-lg text-xs" style={{ background: "#eff6ff", color: "#345D9D", border: "1px solid #bfdbfe" }}>
                                      AnyDesk: {tk.anydesk}
                                    </span>
                                  )}
                                </div>

                                {tk.solucion && (
                                  <div className="p-3 rounded-lg mb-2" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: "#16a34a" }}>Solución</p>
                                    <p className="text-sm" style={{ color: "#166534" }}>{tk.solucion}</p>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#94a3b8" }}>
                                  <span>Creado: {formatearFecha(tk.created_at)}</span>
                                  {tk.resuelto_at && <span>Resuelto: {formatearFecha(tk.resuelto_at)}</span>}
                                  {tk.resuelto_por && <span>Por: {tk.resuelto_por}</span>}
                                  {tk.valoracion_usuario && <span>Valoración: {tk.valoracion_usuario}/5</span>}
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

// =============================================================
// COMPONENTE AUXILIAR: SeccionTitulo
// Encabezado pequeño con ícono, usado para separar bloques de
// información dentro de cada pestaña del panel de detalle.
// =============================================================
function SeccionTitulo({ icon: Icon, texto }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} style={{ color: "#345D9D" }} />
      <h3 className="text-sm font-bold" style={{ color: "#345D9D" }}>{texto}</h3>
    </div>
  );
}

// =============================================================
// COMPONENTE AUXILIAR: DetalleItem
// Muestra un par etiqueta/valor dentro de la card de detalle.
// Si el valor es null/vacío, muestra "—".
// Se puede pasar "valorNodo" para renderizar un elemento
// personalizado (ej. un ícono) en vez de texto plano.
// Si se pasa "pendiente", se muestra como un campo preparado
// para una funcionalidad futura (aún no enviada por el agente),
// con una etiqueta discreta en vez del guion normal.
// =============================================================
function DetalleItem({ label, valor, valorNodo, pendiente }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: pendiente ? "#fafbfd" : "#f8fbff",
        border: pendiente ? "1px dashed #dbeafe" : "1px solid #eff6ff",
      }}
    >
      <p className="text-sm mb-1.5" style={{ color: "#64748b" }}>{label}</p>
      {pendiente ? (
        <p className="text-sm italic" style={{ color: "#94a3b8" }}>No disponible</p>
      ) : valorNodo ? (
        <div style={{ fontSize: "1rem" }}>{valorNodo}</div>
      ) : (
        <p className="text-base font-semibold" style={{ color: "#1e293b" }}>{valor || "—"}</p>
      )}
    </div>
  );
}

// =============================================================
// COMPONENTE AUXILIAR: CampoEditable
// Mismo look que DetalleItem pero envuelve un input/select en
// modo edición dentro de la card de detalle (pestaña General).
// =============================================================
function CampoEditable({ label, children }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: "#ffffff", border: "1px solid #93b4de" }}
    >
      <p className="text-sm mb-1.5" style={{ color: "#64748b" }}>{label}</p>
      {children}
    </div>
  );
}


// =============================================================
// UTILIDAD: formatearFecha
// Convierte un timestamp de Supabase a formato legible es-PE.
// Devuelve null si la fecha no existe.
// =============================================================
function formatearFecha(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}