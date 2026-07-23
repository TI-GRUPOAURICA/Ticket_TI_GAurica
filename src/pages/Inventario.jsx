import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Pencil, Trash2, Save, X, Monitor, Cpu, HardDrive,
  Package, User, CircleCheck, CircleX,
  Wifi, Server, Bot, Clock,
  Info, Ticket, Mail, MapPin, RefreshCw, AlertTriangle
} from "lucide-react";

// --- CLIENTE SUPABASE (Asegúrate de ajustar tus variables de entorno) ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://tu-proyecto.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "tu-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONSTANTES Y HELPERS PARA MATRIZ DE RENOVACIÓN ---
const OPCIONES_CALIFICACION = ["BUENO", "REGULAR", "MALO"];

function calcularAnosAntiguedad(fechaStr) {
  if (!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 0;
  const diffMs = Date.now() - fecha.getTime();
  const anos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, parseFloat(anos.toFixed(1)));
}

function obtenerPuntosCargo(cargoStr) {
  if (!cargoStr) return 5;
  const c = cargoStr.toLowerCase();
  if (c.includes("gerente") || c.includes("director") || c.includes("ceo")) return 10;
  if (c.includes("jefe") || c.includes("coordinador") || c.includes("supervisor")) return 8;
  if (c.includes("analista") || c.includes("especialista") || c.includes("ingeniero")) return 6;
  if (c.includes("asistente") || c.includes("auxiliar") || c.includes("practicante")) return 4;
  return 5;
}

function calcularPuntajeRenovacion({ fechaCompra, fechaInstalacionWin, estadoFisico, rendimiento, cargo, numTickets }) {
  const fechaReferencia = fechaCompra || fechaInstalacionWin;
  const anos = calcularAnosAntiguedad(fechaReferencia);

  let ptsAntiguedad = 0;
  if (anos >= 5) ptsAntiguedad = 30;
  else if (anos >= 4) ptsAntiguedad = 24;
  else if (anos >= 3) ptsAntiguedad = 18;
  else if (anos >= 2) ptsAntiguedad = 10;
  else ptsAntiguedad = 4;

  let ptsFisico = 5;
  if (estadoFisico === "MALO") ptsFisico = 20;
  else if (estadoFisico === "REGULAR") ptsFisico = 12;

  let ptsRendimiento = 5;
  if (rendimiento === "MALO") ptsRendimiento = 20;
  else if (rendimiento === "REGULAR") ptsRendimiento = 12;

  const ptsCargoRaw = obtenerPuntosCargo(cargo);
  const ptsCargo = Math.round((ptsCargoRaw / 10) * 15);

  let ptsFallas = 0;
  if (numTickets >= 5) ptsFallas = 15;
  else if (numTickets >= 3) ptsFallas = 10;
  else if (numTickets >= 1) ptsFallas = 5;

  const totalScore = ptsAntiguedad + ptsFisico + ptsRendimiento + ptsCargo + ptsFallas;

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

export default function Inventario() {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [colaboradorActual, setColaboradorActual] = useState(null);
  const [tabDetalle, setTabDetalle] = useState("general");

  const [detalleEquipo, setDetalleEquipo] = useState(null);
  const [detalleProgramas, setDetalleProgramas] = useState([]);
  const [detalleTickets, setDetalleTickets] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

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

  useEffect(() => {
    obtenerColaboradores();
  }, []);

  async function obtenerColaboradores() {
    setCargando(true);
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("id", { ascending: true });

    if (error) console.error("Error cargando colaboradores:", error);
    else setColaboradores(data || []);
    setCargando(false);
  }

  async function abrirDetalle(colab) {
    setColaboradorActual(colab);
    setEditandoId(null);
    setTabDetalle("general");
    setModalAbierto(true);
    setCargandoDetalle(true);

    try {
      const { data: eq } = await supabase
        .from("equipos")
        .select("*")
        .eq("host", colab.host)
        .maybeSingle();
      setDetalleEquipo(eq || null);

      if (eq?.host) {
        const { data: prog } = await supabase
          .from("programas")
          .select("*")
          .eq("host", eq.host);
        setDetalleProgramas(prog || []);
      } else {
        setDetalleProgramas([]);
      }

      const { data: tck } = await supabase
        .from("tickets")
        .select("*")
        .ilike("usuario", `%${colab.colaborador}%`);
      setDetalleTickets(tck || []);

    } catch (err) {
      console.error("Error al obtener detalle del equipo:", err);
    } finally {
      setCargandoDetalle(false);
    }
  }

  function iniciarEdicion() {
    if (!colaboradorActual) return;
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
  }

  async function guardarCambios() {
    if (!editandoId) return;

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
      alert("Error al actualizar: " + error.message);
    } else {
      const actualizado = { ...colaboradorActual, ...editData };
      setColaboradorActual(actualizado);
      setColaboradores((prev) =>
        prev.map((c) => (c.id === editandoId ? actualizado : c))
      );
      setEditandoId(null);
    }
  }

  async function eliminarColaborador(id) {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      setColaboradores((prev) => prev.filter((c) => c.id !== id));
      if (colaboradorActual?.id === id) setModalAbierto(false);
    }
  }

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.colaborador?.toLowerCase().includes(q) ||
      c.host?.toLowerCase().includes(q) ||
      c.empresa?.toLowerCase().includes(q) ||
      c.cargo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Equipos</h1>
          <p className="text-sm text-slate-500">Gestión de colaboradores, hardware y matriz de renovación</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por colaborador, host, empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-full md:w-80 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-slate-500">Cargando colaboradores...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Host</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Empresa</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Sede</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colaboradoresFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-medium text-slate-800">{c.host || "-"}</td>
                  <td className="p-3 font-medium text-slate-800">{c.colaborador || "-"}</td>
                  <td className="p-3">{c.empresa || "-"}</td>
                  <td className="p-3">{c.cargo || "-"}</td>
                  <td className="p-3">{c.sede || "-"}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => abrirDetalle(c)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-medium text-xs transition-colors"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {colaboradoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETALLE */}
      {modalAbierto && colaboradorActual && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {colaboradorActual.colaborador || "Detalle del Colaborador"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{colaboradorActual.host}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editandoId ? (
                  <>
                    <button
                      onClick={guardarCambios}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" /> Guardar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={iniciarEdicion}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <Pencil className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => eliminarColaborador(colaboradorActual.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setModalAbierto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 overflow-x-auto scrollbar-none">
              {TABS_DETALLE.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = tabDetalle === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabDetalle(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-600">
              {cargandoDetalle ? (
                <div className="p-12 text-center text-slate-400">Cargando información...</div>
              ) : (
                <>
                  {/* TAB: GENERAL */}
                  {tabDetalle === "general" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Host</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.host}
                            onChange={(e) => setEditData({ ...editData, host: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p className="font-mono font-semibold text-slate-800">{colaboradorActual.host || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Colaborador</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.colaborador}
                            onChange={(e) => setEditData({ ...editData, colaborador: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{colaboradorActual.colaborador || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Empresa</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.empresa}
                            onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p>{colaboradorActual.empresa || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Cargo</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.cargo}
                            onChange={(e) => setEditData({ ...editData, cargo: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p>{colaboradorActual.cargo || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Sede</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.sede}
                            onChange={(e) => setEditData({ ...editData, sede: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p>{colaboradorActual.sede || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Correo</label>
                        {editandoId ? (
                          <input
                            type="text"
                            value={editData.correo}
                            onChange={(e) => setEditData({ ...editData, correo: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p>{colaboradorActual.correo || "-"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha de Compra</label>
                        {editandoId ? (
                          <input
                            type="date"
                            value={editData.fecha_compra}
                            onChange={(e) => setEditData({ ...editData, fecha_compra: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        ) : (
                          <p>{colaboradorActual.fecha_compra || "Sin registrar"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Estado Físico</label>
                        {editandoId ? (
                          <select
                            value={editData.estado_fisico}
                            onChange={(e) => setEditData({ ...editData, estado_fisico: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          >
                            {OPCIONES_CALIFICACION.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <p>{colaboradorActual.estado_fisico || "BUENO"}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Rendimiento Actual</label>
                        {editandoId ? (
                          <select
                            value={editData.rendimiento_actual}
                            onChange={(e) => setEditData({ ...editData, rendimiento_actual: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm"
                          >
                            {OPCIONES_CALIFICACION.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <p>{colaboradorActual.rendimiento_actual || "BUENO"}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: RENOVACIÓN */}
                  {tabDetalle === "renovacion" && (() => {
                    const datosRenovacion = calcularPuntajeRenovacion({
                      fechaCompra: colaboradorActual?.fecha_compra,
                      fechaInstalacionWin: detalleEquipo?.fecha_instalacion,
                      estadoFisico: colaboradorActual?.estado_fisico || "BUENO",
                      rendimiento: colaboradorActual?.rendimiento_actual || "BUENO",
                      cargo: colaboradorActual?.cargo,
                      numTickets: detalleTickets.length,
                    });

                    return (
                      <div className="space-y-4">
                        {/* Dictamen Resumen */}
                        <div
                          className="p-4 rounded-xl flex justify-between items-center"
                          style={{
                            background: datosRenovacion.colorBadge.bg,
                            color: datosRenovacion.colorBadge.color,
                            border: `1px solid ${datosRenovacion.colorBadge.border}`,
                          }}
                        >
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider block opacity-80">
                              Dictamen Sugerido
                            </span>
                            <span className="text-base font-extrabold">{datosRenovacion.accion}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold uppercase tracking-wider block opacity-80">
                              Puntaje Global
                            </span>
                            <span className="text-xl font-black">{datosRenovacion.totalScore} / 100 pts</span>
                          </div>
                        </div>

                        {/* Tabla Desglose */}
                        <div className="rounded-xl border overflow-hidden text-sm" style={{ borderColor: "#dbeafe", background: "#ffffff" }}>
                          <table className="w-full text-left">
                            <thead style={{ background: "#eff6ff", color: "#345D9D" }}>
                              <tr>
                                <th className="p-3 text-xs uppercase font-semibold">Criterio</th>
                                <th className="p-3 text-xs uppercase font-semibold">Valor</th>
                                <th className="p-3 text-xs uppercase font-semibold text-right">Puntos</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100" style={{ color: "#475569" }}>
                              <tr>
                                <td className="p-3 font-medium">
                                  Antigüedad
                                  {datosRenovacion.esFechaAproximada && (
                                    <span className="block text-xs text-amber-600 font-normal">
                                      * Estimado según fecha de Win
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">{datosRenovacion.anos} años</td>
                                <td className="p-3 text-right font-bold" style={{ color: "#1e293b" }}>{datosRenovacion.ptsAntiguedad} / 30 pts</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-medium">Estado Físico</td>
                                <td className="p-3">{colaboradorActual?.estado_fisico || "BUENO"}</td>
                                <td className="p-3 text-right font-bold" style={{ color: "#1e293b" }}>{datosRenovacion.ptsFisico} / 20 pts</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-medium">Rendimiento Actual</td>
                                <td className="p-3">{colaboradorActual?.rendimiento_actual || "BUENO"}</td>
                                <td className="p-3 text-right font-bold" style={{ color: "#1e293b" }}>{datosRenovacion.ptsRendimiento} / 20 pts</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-medium">Criticidad del Cargo</td>
                                <td className="p-3">{colaboradorActual?.cargo || "No asignado"}</td>
                                <td className="p-3 text-right font-bold" style={{ color: "#1e293b" }}>{datosRenovacion.ptsCargo} / 15 pts</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-medium">Frecuencia de Tickets</td>
                                <td className="p-3">{detalleTickets.length} tickets</td>
                                <td className="p-3 text-right font-bold" style={{ color: "#1e293b" }}>{datosRenovacion.ptsFallas} / 15 pts</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TAB: HARDWARE */}
                  {tabDetalle === "hardware" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Procesador (CPU)</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.procesador || "No registrado"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Memoria RAM</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.ram || "No registrada"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Almacenamiento (Disco)</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.disco || "No registrado"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Modelo de Equipo</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.modelo || "No registrado"}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB: SISTEMA */}
                  {tabDetalle === "sistema" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Sistema Operativo</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.so || "No registrado"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Fecha Instalación Win</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.fecha_instalacion || "No registrada"}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB: RED */}
                  {tabDetalle === "red" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Dirección IP</span>
                        <p className="font-mono font-medium text-slate-800">{detalleEquipo?.ip || "No registrada"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Dirección MAC</span>
                        <p className="font-mono font-medium text-slate-800">{detalleEquipo?.mac || "No registrada"}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB: AGENTE */}
                  {tabDetalle === "agente" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Versión del Agente</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.version_agente || "Desconocida"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Último Reporte</span>
                        <p className="font-medium text-slate-800">{detalleEquipo?.ultimo_reporte || "Sin datos"}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB: PROGRAMAS */}
                  {tabDetalle === "programas" && (
                    <div>
                      {detalleProgramas.length === 0 ? (
                        <p className="text-slate-400 italic">No hay programas registrados para este equipo.</p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                          {detalleProgramas.map((p, idx) => (
                            <div key={idx} className="p-2.5 text-xs flex justify-between items-center">
                              <span className="font-medium text-slate-700">{p.nombre}</span>
                              <span className="text-slate-400 font-mono">{p.version}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: TICKETS */}
                  {tabDetalle === "tickets" && (
                    <div>
                      {detalleTickets.length === 0 ? (
                        <p className="text-slate-400 italic">No hay tickets registrados a este colaborador.</p>
                      ) : (
                        <div className="space-y-2">
                          {detalleTickets.map((t) => (
                            <div key={t.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-700 block">{t.asunto || "Ticket sin asunto"}</span>
                                <span className="text-slate-400">{t.fecha || "Fecha no disponible"}</span>
                              </div>
                              <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                                {t.estado || "ABIERTO"}
                              </span>
                            </div>
                          ))}
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