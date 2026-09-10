import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Ticket,
  CircleAlert,
  Clock3,
  CircleCheckBig,
  FileSpreadsheet,
  Monitor,
  MapPin,
  Building2,
  Bell,
  KeyRound,
  ChevronRight,
  WifiOff,
} from "lucide-react";

// Empresas que NO deben aparecer como filtro (typos de datos ya
// identificados; en cuanto se corrijan en Supabase, esta lista
// puede quedar vacía).
const EMPRESAS_EXCLUIDAS_FILTRO = ["TERREMETAL"];

// Umbrales (en días) para las alertas de "equipo sin sincronizar".
const DIAS_ALERTA_ATENCION = 3; // 3 a 6 días -> amarillo
const DIAS_ALERTA_CRITICO = 7;  // 7+ días -> rojo
 
export default function Dashboard({ onNavigate }) {

  // ---- Datos "crudos" tal cual vienen de Supabase ----
  const [ticketsRaw, setTicketsRaw] = useState([]);
  const [equiposRaw, setEquiposRaw] = useState([]);
  const [cuentasRaw, setCuentasRaw] = useState([]);
  const [licenciasRaw, setLicenciasRaw] = useState([]);
  const [estadosRaw, setEstadosRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventario, setLoadingInventario] = useState(true);
  const [loadingLicencias, setLoadingLicencias] = useState(true);
  const [loadingEstados, setLoadingEstados] = useState(true);

  // ---- Filtro activo del dashboard ----
  // "" = todas las empresas
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
 
  useEffect(() => {
    fetchData();
    fetchInventario();
    fetchLicencias();
    fetchEstadosAgente();
  }, []);
 
  const fetchData = async () => {
    const { data } = await supabase
      .from("tickets")
      .select(`*, categorias(nombre)`);

    if (data) setTicketsRaw(data);
    setLoading(false);
  };

  const fetchInventario = async () => {
    const { data, error } = await supabase
      .from("colaboradores")
      .select("empresa, sede, tipo, host, colaborador");

    if (error) {
      console.error(error);
      setLoadingInventario(false);
      return;
    }

    if (data) setEquiposRaw(data);
    setLoadingInventario(false);
  };

  // ----------------------------------------------------------
  // FETCH LICENCIAS (centro de notificaciones)
  // Mismas tablas y mismo criterio de "vencida" / "por vencer"
  // que ya usas en la pantalla de Cuentas de correo, para que
  // ambas pantallas siempre digan lo mismo.
  // ----------------------------------------------------------
  const fetchLicencias = async () => {
    const [cuentasRes, licenciasRes] = await Promise.all([
      supabase.from("cuentas_correo").select("id, nombre, correo, empresa, activo"),
      supabase.from("licencias_correo").select("cuenta_id, tipo_licencia, fecha_expira"),
    ]);

    if (cuentasRes.error) console.error(cuentasRes.error);
    if (licenciasRes.error) console.error(licenciasRes.error);

    if (cuentasRes.data) setCuentasRaw(cuentasRes.data);
    if (licenciasRes.data) setLicenciasRaw(licenciasRes.data);
    setLoadingLicencias(false);
  };

  // ----------------------------------------------------------
  // FETCH ESTADO DEL AGENTE (equipos_estado)
  // "ultima_sincronizacion" es el mismo dato que se ve en la
  // pestaña "Agente" del detalle de cada equipo en Inventario.
  // ----------------------------------------------------------
  const fetchEstadosAgente = async () => {
    const { data, error } = await supabase
      .from("equipos_estado")
      .select("hostname, ultima_sincronizacion");

    if (error) {
      console.error(error);
      setLoadingEstados(false);
      return;
    }

    if (data) setEstadosRaw(data);
    setLoadingEstados(false);
  };

  // ----------------------------------------------------------
  // LISTA DE EMPRESAS PARA EL FILTRO
  // Se arma dinámicamente combinando las empresas que aparecen
  // en tickets y en equipos, excluyendo los typos conocidos.
  // ----------------------------------------------------------
  const empresasDisponibles = useMemo(() => {
    const set = new Set();
    ticketsRaw.forEach((t) => t.empresa && set.add(t.empresa));
    equiposRaw.forEach((e) => e.empresa && set.add(e.empresa));
    EMPRESAS_EXCLUIDAS_FILTRO.forEach((e) => set.delete(e));
    return Array.from(set).sort();
  }, [ticketsRaw, equiposRaw]);

  // ----------------------------------------------------------
  // DATOS FILTRADOS POR EMPRESA
  // ----------------------------------------------------------
  const ticketsFiltrados = useMemo(() => {
    if (!filtroEmpresa) return ticketsRaw;
    return ticketsRaw.filter((t) => t.empresa === filtroEmpresa);
  }, [ticketsRaw, filtroEmpresa]);

  const equiposFiltrados = useMemo(() => {
    if (!filtroEmpresa) return equiposRaw;
    return equiposRaw.filter((e) => e.empresa === filtroEmpresa);
  }, [equiposRaw, filtroEmpresa]);

  // ---- Stats de tickets (derivados de ticketsFiltrados) ----
  const stats = useMemo(() => ({
    abiertos:   ticketsFiltrados.filter((t) => t.estado === "abierto").length,
    en_proceso: ticketsFiltrados.filter((t) => t.estado === "en_proceso").length,
    resueltos:  ticketsFiltrados.filter((t) => t.estado === "resuelto").length,
    total:      ticketsFiltrados.length,
  }), [ticketsFiltrados]);

  const porCategoria = useMemo(() => {
    const catMap = {};
    ticketsFiltrados.forEach((t) => {
      const cat = t.categorias?.nombre || "Sin categoría";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  }, [ticketsFiltrados]);

  const porEmpresa = useMemo(() => {
    const empMap = {};
    ticketsFiltrados.forEach((t) => {
      const emp = t.empresa || "Sin empresa";
      empMap[emp] = (empMap[emp] || 0) + 1;
    });
    return Object.entries(empMap).sort((a, b) => b[1] - a[1]);
  }, [ticketsFiltrados]);

  // ---- Stats de inventario (derivados de equiposFiltrados) ----
  const equipoStats = useMemo(() => {
    const total = equiposFiltrados.length;
    const lima = equiposFiltrados.filter((e) => (e.sede || "").toUpperCase() === "LIMA").length;
    const chala = equiposFiltrados.filter((e) => (e.sede || "").toUpperCase() === "CHALA").length;
    return { total, lima, chala, sinSede: total - lima - chala };
  }, [equiposFiltrados]);

  const equiposPorEmpresa = useMemo(() => {
    const empMap = {};
    equiposFiltrados.forEach((e) => {
      const emp = e.empresa || "Sin empresa";
      empMap[emp] = (empMap[emp] || 0) + 1;
    });
    return Object.entries(empMap).sort((a, b) => b[1] - a[1]);
  }, [equiposFiltrados]);

  const equiposPorTipo = useMemo(() => {
    const tipoMap = {};
    equiposFiltrados.forEach((e) => {
      const tipo = e.tipo || "Sin tipo";
      tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
    });
    return Object.entries(tipoMap).sort((a, b) => b[1] - a[1]);
  }, [equiposFiltrados]);

  // ----------------------------------------------------------
  // NOTIFICACIONES DE LICENCIAS
  // Mismo criterio que estadoGeneralLicenciasCuenta() en
  // CuentasCorreo.jsx: vencida = fecha_expira ya pasó,
  // por_vencer = vence en 30 días o menos.
  // ----------------------------------------------------------
  const notificacionesLicencias = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cuentasPorId = {};
    cuentasRaw.forEach((c) => { cuentasPorId[c.id] = c; });

    const items = [];
    licenciasRaw.forEach((lic) => {
      if (!lic.fecha_expira) return;

      const cuenta = cuentasPorId[lic.cuenta_id];
      if (!cuenta) return;
      if (filtroEmpresa && cuenta.empresa !== filtroEmpresa) return;

      const vencimiento = new Date(`${lic.fecha_expira}T00:00:00`);
      const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

      let estado = null;
      if (diasRestantes < 0) estado = "vencida";
      else if (diasRestantes <= 30) estado = "por_vencer";
      else return; // vigente, no genera notificación

      items.push({
        cuenta: cuenta.nombre || cuenta.correo || "Sin nombre",
        empresa: cuenta.empresa || "Sin empresa",
        tipo_licencia: lic.tipo_licencia || "Licencia",
        fecha_expira: lic.fecha_expira,
        diasRestantes,
        estado,
      });
    });

    return items.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [cuentasRaw, licenciasRaw, filtroEmpresa]);

  const licenciasVencidas = notificacionesLicencias.filter((n) => n.estado === "vencida");
  const licenciasPorVencer = notificacionesLicencias.filter((n) => n.estado === "por_vencer");

  // ----------------------------------------------------------
  // NOTIFICACIONES DE EQUIPOS SIN SINCRONIZAR (offline)
  // "Offline" = han pasado 3 días o más desde ultima_sincronizacion.
  //   3-6 días  -> atención (amarillo)
  //   7+ días   -> crítico (rojo)
  // ----------------------------------------------------------
  const notificacionesEquipos = useMemo(() => {
    const hoy = new Date();

    const colabPorHost = {};
    equiposRaw.forEach((e) => {
      if (e.host) colabPorHost[e.host.trim().toUpperCase()] = e;
    });

    const items = [];
    estadosRaw.forEach((es) => {
      if (!es.ultima_sincronizacion || !es.hostname) return;

      const key = es.hostname.trim().toUpperCase();
      const colab = colabPorHost[key];

      if (filtroEmpresa && (!colab || colab.empresa !== filtroEmpresa)) return;

      const ultima = new Date(es.ultima_sincronizacion);
      const diasSinSincronizar = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));

      if (diasSinSincronizar < DIAS_ALERTA_ATENCION) return;

      items.push({
        host: es.hostname,
        colaborador: colab?.colaborador || "Sin asignar",
        empresa: colab?.empresa || "Sin empresa",
        diasSinSincronizar,
        nivel: diasSinSincronizar >= DIAS_ALERTA_CRITICO ? "critico" : "atencion",
      });
    });

    return items.sort((a, b) => b.diasSinSincronizar - a.diasSinSincronizar);
  }, [estadosRaw, equiposRaw, filtroEmpresa]);

  const equiposCriticos = notificacionesEquipos.filter((e) => e.nivel === "critico");
  const equiposAtencion = notificacionesEquipos.filter((e) => e.nivel === "atencion");
 
  const maxCat = porCategoria[0]?.[1] || 1;
  const maxEmp = porEmpresa[0]?.[1] || 1;
  const maxEmpresaEquipos = equiposPorEmpresa[0]?.[1] || 1;
  const maxTipoEquipos = equiposPorTipo[0]?.[1] || 1;
 
  const statCards = [
    { label: "Total tickets", value: stats.total,      color: "#345D9D", icon: Ticket },
    { label: "Abiertos",      value: stats.abiertos,   color: "#EF4444", icon: CircleAlert },
    { label: "En proceso",    value: stats.en_proceso,  color: "#F59E0B", icon: Clock3 },
    { label: "Resueltos",     value: stats.resueltos,  color: "#22C55E", icon: CircleCheckBig },
  ];

  const equipoStatCards = [
    { label: "Total equipos", value: equipoStats.total,   color: "#345D9D", icon: Monitor },
    { label: "En Lima",       value: equipoStats.lima,    color: "#22C55E", icon: MapPin },
    { label: "En Chala",      value: equipoStats.chala,   color: "#F59E0B", icon: MapPin },
    { label: "Sin sede",      value: equipoStats.sinSede, color: "#94A3B8", icon: Building2 },
  ];
 
  const porcentajeResueltos =
    stats.total > 0 ? Math.round((stats.resueltos / stats.total) * 100) : 0;
 
  return (
    <div className="max-w-[1600px] mx-auto">
 
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#1e293b" }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#1e293b" }}>Resumen general del sistema</p>
        </div>

        {/* ---- FILTRO POR EMPRESA ---- */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFiltroEmpresa("")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            style={
              filtroEmpresa === ""
                ? { background: "#345D9D", color: "#ffffff", border: "1px solid #345D9D" }
                : { background: "#ffffff", color: "#345D9D", border: "1px solid #dbeafe" }
            }
          >
            Todas las empresas
          </button>

          {empresasDisponibles.map((emp) => (
            <button
              key={emp}
              onClick={() => setFiltroEmpresa(emp)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              style={
                filtroEmpresa === emp
                  ? { background: "#345D9D", color: "#ffffff", border: "1px solid #345D9D" }
                  : { background: "#ffffff", color: "#345D9D", border: "1px solid #dbeafe" }
              }
            >
              {emp}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          DOS COLUMNAS: contenido principal (izquierda) +
          barra de notificaciones (derecha)
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

        {/* ================= COLUMNA PRINCIPAL ================= */}
        <div className="lg:col-span-3 min-w-0">
 
          {/* ---- TARJETAS ---- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-4 shadow-sm"
                style={{
                  boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                }}
              >
                <p className="text-sm mb-2" style={{ color: "#345D9D" }}>{card.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold" style={{ color: "#345D9D" }}>
                    {card.value}
                  </p>
                  <card.icon size={28} color={card.color} strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
 
          {/* ---- GRÁFICOS ---- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 
            {/* Donut */}
            <div
              className="rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm"
              style={{
                boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                background: "#ffffff",
                border: "1px solid #dbeafe",
              }}
            >
              <p className="text-sm mb-4 font-semibold" style={{ color: "#345D9D" }}>
                Tasa de resolución
              </p>
 
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeDasharray={`${porcentajeResueltos} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{porcentajeResueltos}%</span>
                </div>
              </div>
 
              <p className="text-xs mt-3 text-slate-500">
                {stats.resueltos} de {stats.total} tickets
              </p>
            </div>
 
            {/* Por categoría */}
            <div
              className="rounded-2xl p-4 shadow-sm"
              style={{
                boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                background: "#ffffff",
                border: "1px solid #dbeafe",
              }}
            >
              <h3 className="font-bold mb-3" style={{ color: "#345D9D" }}>
                Tickets por categoría
              </h3>
 
              {loading ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : porCategoria.length === 0 ? (
                <p className="text-xs text-slate-500">Sin datos aún.</p>
              ) : (
                <div className="space-y-3">
                  {porCategoria.slice(0, 5).map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{cat}</span>
                        <span style={{ color: "#345D9D" }}>{count}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(count / maxCat) * 100}%`, background: "#345D9D" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
            {/* Por empresa */}
            <div
              className="rounded-2xl p-4 shadow-sm"
              style={{
                boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                background: "#ffffff",
                border: "1px solid #dbeafe",
              }}
            >
              <h3 className="font-bold mb-3" style={{ color: "#345D9D" }}>
                Tickets por empresa
              </h3>
 
              {loading ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : porEmpresa.length === 0 ? (
                <p className="text-xs text-slate-500">Sin datos aún.</p>
              ) : (
                <div className="space-y-3">
                  {porEmpresa.map(([emp, count]) => (
                    <div key={emp}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{emp}</span>
                        <span style={{ color: "#345D9D" }}>{count}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(count / maxEmp) * 100}%`, background: "#345D9D" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 
          </div>

          {/* ============================================================
              SECCIÓN: INVENTARIO
          ============================================================ */}
          <div className="mb-4">
            <h2 className="text-xl font-black" style={{ color: "#1e293b" }}>
              Inventario
            </h2>
            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
              Resumen de equipos registrados
            </p>
          </div>

          {/* ---- TARJETAS DE INVENTARIO ---- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {equipoStatCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-4 shadow-sm"
                style={{
                  boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                }}
              >
                <p className="text-sm mb-2" style={{ color: "#345D9D" }}>{card.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold" style={{ color: "#345D9D" }}>
                    {card.value}
                  </p>
                  <card.icon size={28} color={card.color} strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>

          {/* ---- GRÁFICOS DE INVENTARIO ---- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Equipos por empresa */}
            <div
              className="rounded-2xl p-4 shadow-sm"
              style={{
                boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                background: "#ffffff",
                border: "1px solid #dbeafe",
              }}
            >
              <h3 className="font-bold mb-3" style={{ color: "#345D9D" }}>
                Equipos por empresa
              </h3>

              {loadingInventario ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : equiposPorEmpresa.length === 0 ? (
                <p className="text-xs text-slate-500">Sin datos aún.</p>
              ) : (
                <div className="space-y-3">
                  {equiposPorEmpresa.map(([emp, count]) => (
                    <div key={emp}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{emp}</span>
                        <span style={{ color: "#345D9D" }}>{count}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(count / maxEmpresaEquipos) * 100}%`, background: "#345D9D" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipos por tipo (Laptop / PC) */}
            <div
              className="rounded-2xl p-4 shadow-sm"
              style={{
                boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
                background: "#ffffff",
                border: "1px solid #dbeafe",
              }}
            >
              <h3 className="font-bold mb-3" style={{ color: "#345D9D" }}>
                Equipos por tipo
              </h3>

              {loadingInventario ? (
                <p className="text-xs text-slate-500">Cargando...</p>
              ) : equiposPorTipo.length === 0 ? (
                <p className="text-xs text-slate-500">Sin datos aún.</p>
              ) : (
                <div className="space-y-3">
                  {equiposPorTipo.map(([tipo, count]) => (
                    <div key={tipo}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{tipo}</span>
                        <span style={{ color: "#345D9D" }}>{count}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(count / maxTipoEquipos) * 100}%`, background: "#345D9D" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
 
          {/* ---- ACCESOS RÁPIDOS ---- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 
            <button
              onClick={() => onNavigate("tickets")}
              className="rounded-2xl p-4 text-left transition hover:shadow-md"
              style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
            >
              <Ticket size={30} color="#345D9D" strokeWidth={2} />
              <p className="font-semibold text-slate-800 mt-2">Ver tickets pendientes</p>
              <p className="text-xs mt-1 text-slate-500">
                {stats.abiertos + stats.en_proceso} tickets requieren atención
              </p>
            </button>

            <button
              onClick={() => onNavigate("inventario")}
              className="rounded-2xl p-4 text-left transition hover:shadow-md"
              style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
            >
              <Monitor size={30} color="#345D9D" strokeWidth={2} />
              <p className="font-semibold text-slate-800 mt-2">Ver inventario</p>
              <p className="text-xs mt-1 text-slate-500">
                {equipoStats.total} equipos registrados
              </p>
            </button>
 
            <button
              onClick={() => onNavigate("reportes")}
              className="rounded-2xl p-4 text-left transition hover:shadow-md"
              style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
            >
              <FileSpreadsheet size={30} color="#345D9D" strokeWidth={2} />
              <p className="font-semibold text-slate-800 mt-2">Generar reporte</p>
              <p className="text-xs mt-1 text-slate-500">
                {stats.resueltos} tickets resueltos disponibles
              </p>
            </button>
 
          </div>

        </div>

        {/* ================= BARRA LATERAL: NOTIFICACIONES ================= */}
        <div className="lg:col-span-1 space-y-4">

          {/* ---- Licencias ---- */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
              background: "#ffffff",
              border: licenciasVencidas.length > 0
                ? "1px solid #fecaca"
                : licenciasPorVencer.length > 0
                  ? "1px solid #fde68a"
                  : "1px solid #dbeafe",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} style={{ color: "#345D9D" }} />
              <h3 className="font-bold text-sm" style={{ color: "#1e293b" }}>
                Licencias de correo
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {licenciasVencidas.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  {licenciasVencidas.length} vencida{licenciasVencidas.length !== 1 ? "s" : ""}
                </span>
              )}
              {licenciasPorVencer.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}
                >
                  {licenciasPorVencer.length} por vencer
                </span>
              )}
            </div>

            {loadingLicencias ? (
              <p className="text-xs text-slate-500">Cargando...</p>
            ) : notificacionesLicencias.length === 0 ? (
              <div className="flex items-center gap-2 py-1">
                <CircleCheckBig size={16} color="#22C55E" />
                <p className="text-xs" style={{ color: "#64748b" }}>Todo al día.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacionesLicencias.slice(0, 6).map((n, i) => (
                  <div
                    key={`${n.cuenta}-${n.tipo_licencia}-${i}`}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
                    style={{
                      background: n.estado === "vencida" ? "#fef2f2" : "#fffbeb",
                      border: n.estado === "vencida" ? "1px solid #fecaca" : "1px solid #fde68a",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound
                        size={13}
                        style={{ color: n.estado === "vencida" ? "#dc2626" : "#b45309" }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>
                          {n.cuenta}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
                          {n.tipo_licencia} · {n.empresa}
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-[11px] font-semibold whitespace-nowrap"
                      style={{ color: n.estado === "vencida" ? "#dc2626" : "#b45309" }}
                    >
                      {n.estado === "vencida"
                        ? `-${Math.abs(n.diasRestantes)}d`
                        : n.diasRestantes === 0
                          ? "Hoy"
                          : `${n.diasRestantes}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {notificacionesLicencias.length > 6 && (
              <button
                onClick={() => onNavigate("cuentas-correo")}
                className="mt-2 text-xs font-semibold flex items-center gap-1"
                style={{ color: "#345D9D" }}
              >
                Ver {notificacionesLicencias.length - 6} más <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* ---- Equipos sin sincronizar ---- */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{
              boxShadow: "0 4px 12px rgba(48, 93, 160, 0.08)",
              background: "#ffffff",
              border: equiposCriticos.length > 0
                ? "1px solid #fecaca"
                : equiposAtencion.length > 0
                  ? "1px solid #fde68a"
                  : "1px solid #dbeafe",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <WifiOff size={16} style={{ color: "#345D9D" }} />
              <h3 className="font-bold text-sm" style={{ color: "#1e293b" }}>
                Equipos Inactivos
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {equiposCriticos.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  {equiposCriticos.length} crítico{equiposCriticos.length !== 1 ? "s" : ""} (7d+)
                </span>
              )}
              {equiposAtencion.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}
                >
                  {equiposAtencion.length} en atención
                </span>
              )}
            </div>

            {loadingEstados ? (
              <p className="text-xs text-slate-500">Cargando...</p>
            ) : notificacionesEquipos.length === 0 ? (
              <div className="flex items-center gap-2 py-1">
                <CircleCheckBig size={16} color="#22C55E" />
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Todos los equipos sincronizaron en los últimos {DIAS_ALERTA_ATENCION - 1} días.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacionesEquipos.slice(0, 6).map((eq, i) => (
                  <div
                    key={`${eq.host}-${i}`}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
                    style={{
                      background: eq.nivel === "critico" ? "#fef2f2" : "#fffbeb",
                      border: eq.nivel === "critico" ? "1px solid #fecaca" : "1px solid #fde68a",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Monitor
                        size={13}
                        style={{ color: eq.nivel === "critico" ? "#dc2626" : "#b45309" }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>
                          {eq.host}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
                          {eq.colaborador} · {eq.empresa}
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-[11px] font-semibold whitespace-nowrap"
                      style={{ color: eq.nivel === "critico" ? "#dc2626" : "#b45309" }}
                    >
                      {eq.diasSinSincronizar}d
                    </span>
                  </div>
                ))}
              </div>
            )}

            {notificacionesEquipos.length > 6 && (
              <button
                onClick={() => onNavigate("inventario")}
                className="mt-2 text-xs font-semibold flex items-center gap-1"
                style={{ color: "#345D9D" }}
              >
                Ver {notificacionesEquipos.length - 6} más <ChevronRight size={13} />
              </button>
            )}
          </div>

        </div>

      </div>
 
    </div>
  );
}