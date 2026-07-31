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
// =============================================================

const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU"];
const TIPOS = ["Laptop", "PC"];
const SEDES = ["LIMA", "AREQUIPA", "CHALA"];
const ESTADOS_FISICOS = ["Excelente", "Bueno", "Regular", "Usable", "Antiguo"];
const RENDIMIENTOS = ["Excelente", "Bueno", "Regular", "Malo", "Pésimo"];
const CRITICIDADES = ["Alta", "Media", "Baja"];

const ULTIMA_VERSION_AGENTE = "1.0.0";
const NOMBRE_AGENTE_REGISTRY = "Aurica Inventory Agent";

const ESTADOS_TICKET = {
  Nuevo: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Nuevo" },
  "En Proceso": { bg: "#fefce8", color: "#ca8a04", border: "#fef08a", label: "En Proceso" },
  Resuelto: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Resuelto" },
  Cancelado: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Cancelado" },
  _default: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Desconocido" },
};

const PRIORIDADES_TICKET = {
  Alta: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Alta" },
  Media: { bg: "#fefce8", color: "#ca8a04", border: "#fef08a", label: "Media" },
  Baja: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Baja" },
  _default: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Normal" },
};

export default function Inventario() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [sedeFiltro, setSedeFiltro] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    hostname: "",
    colaborador_id: "",
    empresa: "",
    tipo_equipo: "",
  });

  const [colaboradores, setColaboradores] = useState([]);

  const [detalleEquipo, setDetalleEquipo] = useState(null);
  const [detalleSoftware, setDetalleSoftware] = useState([]);
  const [detalleTickets, setDetalleTickets] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [tabDetalle, setTabDetalle] = useState("general");

  const [editandoRenovacion, setEditandoRenovacion] = useState(false);
  const [renovacionData, setRenovacionData] = useState({
    anio_compra: "",
    estado_fisico: "Bueno",
    rendimiento: "Bueno",
    criticidad: "Media",
    observaciones: "",
  });

  const [analisisIA, setAnalisisIA] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);

  useEffect(() => {
    cargarEquipos();
    cargarColaboradores();
  }, []);

  const cargarEquipos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("inventario")
      .select(`
        id,
        hostname,
        empresa,
        tipo_equipo,
        cpu,
        ram_gb,
        disco_total_gb,
        salud_sistema,
        flag_antivirus,
        flag_frecuencia_reinicios,
        flag_disco_lleno,
        flag_hardware_antiguo,
        ultima_sincronizacion,
        colaborador_id,
        anio_compra,
        estado_fisico,
        rendimiento,
        criticidad,
        observaciones,
        colaboradores (
          id,
          nombre_completo,
          cargo,
          area,
          sede,
          correo
        )
      `)
      .order("hostname", { ascending: true });

    if (error) {
      setMensaje("Error al cargar los equipos: " + error.message);
    } else {
      setEquipos(data || []);
    }
    setCargando(false);
  };

  const cargarColaboradores = async () => {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("id, nombre_completo, sede")
      .order("nombre_completo", { ascending: true });

    if (!error) {
      setColaboradores(data || []);
    }
  };

  const abrirDetalle = async (equipo) => {
    setDetalleEquipo(equipo);
    setTabDetalle("general");

    setRenovacionData({
      anio_compra: equipo.anio_compra || "",
      estado_fisico: equipo.estado_fisico || "Bueno",
      rendimiento: equipo.rendimiento || "Bueno",
      criticidad: equipo.criticidad || "Media",
      observaciones: equipo.observaciones || "",
    });
    setEditandoRenovacion(false);
    setAnalisisIA(null);

    setCargandoDetalle(true);

    const { data: dataEquipo } = await supabase
      .from("inventario")
      .select("*")
      .eq("id", equipo.id)
      .single();

    if (dataEquipo) {
      setDetalleEquipo((prev) => ({ ...prev, ...dataEquipo }));
    }

    const { data: dataSw } = await supabase
      .from("software_instalado")
      .select("id, nombre, version, fabricante")
      .eq("hostname", equipo.hostname)
      .order("nombre", { ascending: true });

    setDetalleSoftware(dataSw || []);

    const { data: dataTk } = await supabase
      .from("tickets")
      .select("id, titulo, descripcion, estado, prioridad, created_at, resuelto_at, resuelto_por, valoracion_usuario, solucion, anydesk, nombre_colaborador, empresa")
      .eq("hostname", equipo.hostname)
      .order("created_at", { ascending: false });

    setDetalleTickets(dataTk || []);

    setCargandoDetalle(false);
  };

  const cerrarDetalle = () => {
    setDetalleEquipo(null);
    setDetalleSoftware([]);
    setDetalleTickets([]);
    setAnalisisIA(null);
  };

  const iniciarEdicion = (equipo, e) => {
    e.stopPropagation();
    setEditandoId(equipo.id);
    setFormData({
      hostname: equipo.hostname || "",
      colaborador_id: equipo.colaborador_id || "",
      empresa: equipo.empresa || "",
      tipo_equipo: equipo.tipo_equipo || "",
    });
  };

  const cancelarEdicion = (e) => {
    if (e) e.stopPropagation();
    setEditandoId(null);
    setFormData({
      hostname: "",
      colaborador_id: "",
      empresa: "",
      tipo_equipo: "",
    });
  };

  const guardarEdicion = async (id, e) => {
    e.stopPropagation();
    setMensaje("");

    const payload = {
      hostname: formData.hostname.trim(),
      colaborador_id: formData.colaborador_id ? Number(formData.colaborador_id) : null,
      empresa: formData.empresa,
      tipo_equipo: formData.tipo_equipo,
    };

    const { error } = await supabase
      .from("inventario")
      .update(payload)
      .eq("id", id);

    if (error) {
      setMensaje("Error al guardar: " + error.message);
    } else {
      setMensaje("Equipo actualizado correctamente.");
      setEditandoId(null);
      cargarEquipos();
    }
  };

  const eliminarEquipo = async (id, hostname, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Seguro que deseas eliminar el equipo "${hostname}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("inventario")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("Error al eliminar: " + error.message);
    } else {
      setMensaje("Equipo eliminado.");
      cargarEquipos();
    }
  };

  const guardarRenovacion = async () => {
    if (!detalleEquipo) return;

    const payload = {
      anio_compra: renovacionData.anio_compra ? Number(renovacionData.anio_compra) : null,
      estado_fisico: renovacionData.estado_fisico,
      rendimiento: renovacionData.rendimiento,
      criticidad: renovacionData.criticidad,
      observaciones: renovacionData.observaciones,
    };

    const { error } = await supabase
      .from("inventario")
      .update(payload)
      .eq("id", detalleEquipo.id);

    if (error) {
      alert("Error al guardar evaluación: " + error.message);
    } else {
      setDetalleEquipo((prev) => ({ ...prev, ...payload }));
      setEditandoRenovacion(false);
      cargarEquipos();
    }
  };

  const analizarEquipoIA = async () => {
    if (!detalleEquipo) return;
    setAnalizandoIA(true);
    setAnalisisIA(null);

    try {
      const response = await fetch("https://aurica-agente.deno.dev/analizar-renovacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipo: detalleEquipo,
          software: detalleSoftware,
          tickets: detalleTickets,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setAnalisisIA(data.analisis);
      } else {
        alert("Error en análisis IA: " + (data.error || "Desconocido"));
      }
    } catch (err) {
      alert("Error de conexión al analizar con IA: " + err.message);
    } finally {
      setAnalizandoIA(false);
    }
  };

  const equiposFiltrados = equipos.filter((eq) => {
    const texto = busqueda.toLowerCase();
    const matchBusqueda =
      eq.hostname?.toLowerCase().includes(texto) ||
      eq.colaboradores?.nombre_completo?.toLowerCase().includes(texto) ||
      eq.colaboradores?.cargo?.toLowerCase().includes(texto);

    const matchEmpresa = empresaFiltro ? eq.empresa === empresaFiltro : true;
    const matchTipo = tipoFiltro ? eq.tipo_equipo === tipoFiltro : true;
    const matchSede = sedeFiltro ? eq.colaboradores?.sede === sedeFiltro : true;

    return matchBusqueda && matchEmpresa && matchTipo && matchSede;
  });

  const swAgente = detalleSoftware.find((sw) =>
    sw.nombre?.toLowerCase().includes(NOMBRE_AGENTE_REGISTRY.toLowerCase())
  );
  const versionAgenteInstalada = swAgente ? swAgente.version : null;
  const agenteActualizado = versionAgenteInstalada
    ? versionAgenteInstalada === ULTIMA_VERSION_AGENTE
    : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Equipos</h1>
          <p className="text-slate-500 text-sm">Gestión e inspección técnica en tiempo real</p>
        </div>
      </div>

      {mensaje && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200 flex justify-between">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje("")} className="font-bold">X</button>
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por host, usuario o cargo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={empresaFiltro}
          onChange={(e) => setEmpresaFiltro(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-full outline-none"
        >
          <option value="">Todas las Empresas</option>
          {EMPRESAS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-full outline-none"
        >
          <option value="">Todos los Tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={sedeFiltro}
          onChange={(e) => setSedeFiltro(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm w-full outline-none"
        >
          <option value="">Todas las Sedes</option>
          {SEDES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <th className="p-4">Hostname</th>
              <th className="p-4">Usuario Asignado</th>
              <th className="p-4">Empresa</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Salud</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">Cargando equipos...</td>
              </tr>
            ) : equiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">No se encontraron equipos</td>
              </tr>
            ) : (
              equiposFiltrados.map((eq) => {
                const esEditando = editandoId === eq.id;
                return (
                  <tr
                    key={eq.id}
                    onClick={() => abrirDetalle(eq)}
                    className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-semibold text-slate-800">
                      {esEditando ? (
                        <input
                          type="text"
                          value={formData.hostname}
                          onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      ) : (
                        eq.hostname
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {esEditando ? (
                        <select
                          value={formData.colaborador_id}
                          onChange={(e) => setFormData({ ...formData, colaborador_id: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="border rounded px-2 py-1 text-sm w-full"
                        >
                          <option value="">Sin Asignar</option>
                          {colaboradores.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                          ))}
                        </select>
                      ) : (
                        eq.colaboradores?.nombre_completo || "—"
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {esEditando ? (
                        <select
                          value={formData.empresa}
                          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="border rounded px-2 py-1 text-sm w-full"
                        >
                          <option value="">Seleccionar</option>
                          {EMPRESAS.map((e) => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      ) : (
                        eq.empresa || "—"
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {esEditando ? (
                        <select
                          value={formData.tipo_equipo}
                          onChange={(e) => setFormData({ ...formData, tipo_equipo: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="border rounded px-2 py-1 text-sm w-full"
                        >
                          <option value="">Seleccionar</option>
                          {TIPOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        eq.tipo_equipo || "—"
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          color: colorSalud(eq.salud_sistema ?? 100),
                          backgroundColor: `${colorSalud(eq.salud_sistema ?? 100)}15`,
                        }}
                      >
                        {eq.salud_sistema ?? 100}%
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {esEditando ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => guardarEdicion(eq.id, e)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={(e) => cancelarEdicion(e)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => iniciarEdicion(eq, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => eliminarEquipo(eq.id, eq.hostname, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL / PANEL DE DETALLE */}
      {detalleEquipo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* HEADER DEL MODAL */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{detalleEquipo.hostname}</h2>
                  <p className="text-xs text-slate-400">
                    Sincronizado: {formatearFecha(detalleEquipo.ultima_sincronizacion)}
                  </p>
                </div>
                <button
                  onClick={cerrarDetalle}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* TABS NAVEGACIÓN */}
              <div className="flex gap-2 border-b border-slate-100 mb-6 overflow-x-auto pb-1">
                {[
                  { id: "general", label: "General" },
                  { id: "renovacion", label: "Renovación" },
                  { id: "hardware", label: "Hardware" },
                  { id: "sistema", label: "Sistema" },
                  { id: "red", label: "Red" },
                  { id: "agente", label: "Agente" },
                  { id: "programas", label: "Software" },
                  { id: "tickets", label: "Tickets" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTabDetalle(t.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      tabDetalle === t.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* CONTENIDO PESTAÑAS */}
              {cargandoDetalle ? (
                <div className="p-8 text-center text-slate-400">Cargando detalles...</div>
              ) : (
                <>
                  {/* ---- PESTAÑA: GENERAL ---- */}
                  {tabDetalle === "general" && (
                    <div className="space-y-4">
                      <SeccionTitulo icon={User} texto="Información del Asignado" />
                      <div className="grid grid-cols-2 gap-4">
                        <DetalleItem label="Colaborador" valor={detalleEquipo.colaboradores?.nombre_completo} />
                        <DetalleItem label="Cargo" valor={detalleEquipo.colaboradores?.cargo} />
                        <DetalleItem label="Área" valor={detalleEquipo.colaboradores?.area} />
                        <DetalleItem label="Sede" valor={detalleEquipo.colaboradores?.sede} />
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: RENOVACIÓN ---- */}
                  {tabDetalle === "renovacion" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Evaluación de Renovación</h3>
                        <button
                          onClick={analizarEquipoIA}
                          disabled={analizandoIA}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {analizandoIA ? "Analizando..." : "🤖 Analizar con IA"}
                        </button>

                        {editandoRenovacion ? (
                          <div className="flex gap-2">
                            <button
                              onClick={guardarRenovacion}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-100 text-green-700 border border-green-200"
                            >
                              <Save size={14} className="inline mr-1" /> Guardar
                            </button>
                            <button
                              onClick={() => setEditandoRenovacion(false)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              <X size={14} className="inline mr-1" /> Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditandoRenovacion(true)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200"
                          >
                            <Pencil size={14} className="inline mr-1" /> Editar
                          </button>
                        )}
                      </div>

                      {analisisIA && (
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-sm text-purple-900">
                          <p className="font-bold mb-1">Dictamen IA:</p>
                          <p>{analisisIA}</p>
                        </div>
                      )}

                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b">
                              <td className="p-3 font-medium">Año de Compra</td>
                              <td className="p-3">
                                {editandoRenovacion ? (
                                  <input
                                    type="number"
                                    value={renovacionData.anio_compra}
                                    onChange={(e) => setRenovacionData({ ...renovacionData, anio_compra: e.target.value })}
                                    className="border rounded px-2 py-1 w-full"
                                  />
                                ) : (
                                  renovacionData.anio_compra || "—"
                                )}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 font-medium">Estado Físico</td>
                              <td className="p-3">
                                {editandoRenovacion ? (
                                  <select
                                    value={renovacionData.estado_fisico}
                                    onChange={(e) => setRenovacionData({ ...renovacionData, estado_fisico: e.target.value })}
                                    className="border rounded px-2 py-1 w-full"
                                  >
                                    {ESTADOS_FISICOS.map((item) => (
                                      <option key={item} value={item}>{item}</option>
                                    ))}
                                  </select>
                                ) : (
                                  renovacionData.estado_fisico
                                )}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 font-medium">Rendimiento</td>
                              <td className="p-3">
                                {editandoRenovacion ? (
                                  <select
                                    value={renovacionData.rendimiento}
                                    onChange={(e) => setRenovacionData({ ...renovacionData, rendimiento: e.target.value })}
                                    className="border rounded px-2 py-1 w-full"
                                  >
                                    {RENDIMIENTOS.map((item) => (
                                      <option key={item} value={item}>{item}</option>
                                    ))}
                                  </select>
                                ) : (
                                  renovacionData.rendimiento
                                )}
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-3 font-medium">Criticidad</td>
                              <td className="p-3">
                                {editandoRenovacion ? (
                                  <select
                                    value={renovacionData.criticidad}
                                    onChange={(e) => setRenovacionData({ ...renovacionData, criticidad: e.target.value })}
                                    className="border rounded px-2 py-1 w-full"
                                  >
                                    {CRITICIDADES.map((item) => (
                                      <option key={item} value={item}>{item}</option>
                                    ))}
                                  </select>
                                ) : (
                                  renovacionData.criticidad
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 font-medium">Frecuencia de Tickets</td>
                              <td className="p-3">{detalleTickets.length} tickets</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: HARDWARE ---- */}
                  {tabDetalle === "hardware" && (
                    <div className="space-y-5">
                      <div>
                        <SeccionTitulo icon={Cpu} texto="Procesador y memoria" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="CPU" valor={detalleEquipo?.cpu} />
                          <DetalleItem label="RAM total" valor={detalleEquipo?.ram_gb ? `${detalleEquipo.ram_gb} GB` : null} />
                          <DetalleItem label="Tipo de RAM" valor={detalleEquipo?.ram_tipo} />
                          <DetalleItem label="Velocidad RAM" valor={detalleEquipo?.ram_velocidad_mhz ? `${detalleEquipo.ram_velocidad_mhz} MHz` : null} />
                          <DetalleItem
                            label="Slots RAM"
                            valor={detalleEquipo?.ram_slots ? `${detalleEquipo.ram_slots_ocupados ?? "?"} / ${detalleEquipo.ram_slots} ocupados` : null}
                          />
                        </div>
                      </div>

                      <div>
                        <SeccionTitulo icon={HardDrive} texto="Almacenamiento" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Disco total" valor={detalleEquipo?.disco_total_gb ? `${detalleEquipo.disco_total_gb} GB` : null} />
                          <DetalleItem
                            label="Disco libre"
                            valor={detalleEquipo?.disco_libre_gb ? `${detalleEquipo.disco_libre_gb} GB (${detalleEquipo.disco_libre_porcentaje ?? "?"}%)` : null}
                          />
                          <DetalleItem label="Tipo de disco" valor={detalleEquipo?.disco_tipo} />
                          <DetalleItem label="Modelo de disco" valor={detalleEquipo?.disco_modelo} />
                          <DetalleItem label="Fabricante de disco" valor={detalleEquipo?.disco_fabricante} />
                          <DetalleItem label="Serial de disco" valor={detalleEquipo?.disco_serial} />
                        </div>
                      </div>

                      <div>
                        <SeccionTitulo icon={Server} texto="Placa base y BIOS" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Fabricante de placa" valor={detalleEquipo?.placa_fabricante} />
                          <DetalleItem label="Modelo de placa" valor={detalleEquipo?.placa_modelo} />
                          <DetalleItem label="Serial de placa" valor={detalleEquipo?.placa_serial} />
                          <DetalleItem label="Fabricante BIOS" valor={detalleEquipo?.fabricante_bios} />
                          <DetalleItem label="Versión BIOS" valor={detalleEquipo?.bios_version} />
                          <DetalleItem label="Fecha BIOS" valor={formatearFecha(detalleEquipo?.bios_release_date)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: SISTEMA OPERATIVO ---- */}
                  {tabDetalle === "sistema" && (
                    <div>
                      <SeccionTitulo icon={Monitor} texto="Sistema operativo" />
                      <div className="grid grid-cols-3 gap-4">
                        <DetalleItem
                          label="Windows"
                          valor={detalleEquipo?.windows ? `${detalleEquipo.windows}${detalleEquipo.windows_version ? " · " + detalleEquipo.windows_version : ""}` : null}
                        />
                        <DetalleItem label="Compilación (Build)" valor={detalleEquipo?.windows_build} />
                        <DetalleItem label="Arquitectura" valor={detalleEquipo?.windows_architecture} />
                        <DetalleItem label="Fecha de instalación" valor={formatearFecha(detalleEquipo?.windows_install_date)} />
                        <DetalleItem label="Último reinicio" valor={formatearFecha(detalleEquipo?.ultimo_reinicio)} />
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: RED ---- */}
                  {tabDetalle === "red" && (
                    <div>
                      <SeccionTitulo icon={Wifi} texto="Conectividad" />
                      <div className="grid grid-cols-3 gap-4">
                        <DetalleItem label="IP local" valor={detalleEquipo?.ip} />
                        <DetalleItem label="Gateway" valor={detalleEquipo?.gateway} />
                        <DetalleItem label="DNS" valor={detalleEquipo?.dns} />
                        <DetalleItem label="Dominio" valor={detalleEquipo?.dominio} />
                        <DetalleItem label="Adaptador" valor={detalleEquipo?.adaptador_red} />
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: AGENTE ---- */}
                  {tabDetalle === "agente" && (
                    <div className="space-y-5">
                      <div>
                        <SeccionTitulo icon={Bot} texto="Estado del agente" />
                        <div className="grid grid-cols-3 gap-4">
                          <DetalleItem label="Versión instalada" valor={versionAgenteInstalada} />
                          <DetalleItem label="Última versión disponible" valor={ULTIMA_VERSION_AGENTE} />
                          <DetalleItem
                            label="Estado de actualización"
                            valorNodo={
                              agenteActualizado === null ? undefined : agenteActualizado ? (
                                <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                                  <CircleCheck size={14} /> Actualizado
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
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
                          <DetalleItem label="Última sincronización" valor={formatearFecha(detalleEquipo?.ultima_sincronizacion)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---- PESTAÑA: SOFTWARE ---- */}
                  {tabDetalle === "programas" && (
                    <div>
                      <SeccionTitulo icon={Package} texto={`Software instalado (${detalleSoftware.length})`} />
                      {detalleSoftware.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay software registrado para este equipo.</p>
                      ) : (
                        <div className="rounded-xl border border-blue-100 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-blue-50 text-blue-900">
                              <tr>
                                <th className="p-2 text-left">Programa</th>
                                <th className="p-2 text-left">Versión</th>
                                <th className="p-2 text-left">Fabricante</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalleSoftware.map((sw) => (
                                <tr key={sw.id} className="border-t border-blue-50">
                                  <td className="p-2 text-slate-800">{sw.nombre}</td>
                                  <td className="p-2 text-slate-500">{sw.version || "—"}</td>
                                  <td className="p-2 text-slate-500">{sw.fabricante || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                {/* ---- PESTAÑA: TICKETS ---- */}
                  {tabDetalle === "tickets" && (
                    <div>
                      <SeccionTitulo icon={Ticket} texto={`Tickets (${detalleTickets.length})`} />
                      {detalleTickets.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay tickets registrados para este equipo.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {detalleTickets.map((tk) => {
                            const estadoStyle = ESTADOS_TICKET[tk.estado] || ESTADOS_TICKET._default;
                            const prioridadStyle = PRIORIDADES_TICKET[tk.prioridad] || PRIORIDADES_TICKET._default;
                            return (
                              <div key={tk.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex justify-between items-start gap-3 mb-2">
                                  <p className="text-sm font-semibold text-slate-800">#{tk.id} · {tk.titulo}</p>
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-semibold shrink-0"
                                    style={{ background: estadoStyle.bg, color: estadoStyle.color, border: `1px solid ${estadoStyle.border}` }}
                                  >
                                    {estadoStyle.label}
                                  </span>
                                </div>
                                {tk.descripcion && <p className="text-sm text-slate-600 mb-3">{tk.descripcion}</p>}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span
                                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                                    style={{ background: prioridadStyle.bg, color: prioridadStyle.color, border: `1px solid ${prioridadStyle.border}` }}
                                  >
                                    Prioridad: {prioridadStyle.label}
                                  </span>
                                </div>
                                {tk.solucion && (
                                  <div className="p-3 rounded-lg mb-2 bg-green-50 border border-green-200">
                                    <p className="text-xs font-semibold text-green-700 mb-1">Solución</p>
                                    <p className="text-sm text-green-900">{tk.solucion}</p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                  <span>Creado: {formatearFecha(tk.created_at)}</span>
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
        </div>
      )}
    </div>
  );
}

// =============================================================
// COMPONENTES AUXILIARES Y UTILIDADES
// =============================================================

function SeccionTitulo({ icon: Icon, texto }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={16} style={{ color: "#345D9D" }} />}
      <h3 className="text-sm font-bold" style={{ color: "#345D9D" }}>{texto}</h3>
    </div>
  );
}

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

function MiniCard({ label, valor, valorNodo }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #eff6ff" }}>
      <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{label}</p>
      {valorNodo ? valorNodo : (
        <p className="text-sm font-bold" style={{ color: "#1e293b" }}>{valor || "—"}</p>
      )}
    </div>
  );
}

function BadgeBool({ label, valor }) {
  return (
    <span
      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
      style={
        valor
          ? { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }
          : { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
      }
    >
      {valor ? <CircleX size={14} /> : <CircleCheck size={14} />}
      {valor ? `${label}: Sí` : `${label}: No`}
    </span>
  );
}

function colorSalud(salud) {
  if (salud >= 80) return "#16a34a";
  if (salud >= 50) return "#a16207";
  return "#dc2626";
}

function formatearFecha(fecha) {
  if (!fecha) return "—";
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