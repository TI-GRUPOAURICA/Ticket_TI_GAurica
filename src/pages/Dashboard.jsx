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
} from "lucide-react";
 
export default function Dashboard({ onNavigate }) {

  // ---- Datos "crudos" tal cual vienen de Supabase ----
  const [ticketsRaw, setTicketsRaw] = useState([]);
  const [equiposRaw, setEquiposRaw] = useState([]);
  const [cuentasRaw, setCuentasRaw] = useState([]);
  const [licenciasRaw, setLicenciasRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventario, setLoadingInventario] = useState(true);
  const [loadingLicencias, setLoadingLicencias] = useState(true);

  // ---- Filtro activo del dashboard ----
  // "" = todas las empresas
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
 
  useEffect(() => {
    fetchData();
    fetchInventario();
    fetchLicencias();
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
      .select("empresa, sede, tipo");

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
  // LISTA DE EMPRESAS PARA EL FILTRO
  // Se arma dinámicamente combinando las empresas que aparecen
  // en tickets y en equipos, así nunca queda desactualizada
  // aunque agregues una empresa nueva en Supabase.
  // ----------------------------------------------------------
  const empresasDisponibles = useMemo(() => {
    const set = new Set();
    ticketsRaw.forEach((t) => t.empresa && set.add(t.empresa));
    equiposRaw.forEach((e) => e.empresa && set.add(e.empresa));
    return Array.from(set).sort();
  }, [ticketsRaw, equiposRaw]);

  // ----------------------------------------------------------
  // DATOS FILTRADOS POR EMPRESA
  // Todo lo que se calcula debajo de aquí ya respeta el filtro.
  // ----------------------------------------------------------
  const ticketsFiltrados = useMemo(() => {
    if (!filtroEmpresa) return ticketsRaw;
    return ticketsRaw.filter((t) => t.empresa === filtroEmpresa);
  }, [ticketsRaw, filtroEmpresa]);

  const equiposFiltrados = useMemo(() => {
    if (!filtroEmpresa) return equiposRaw;
    return equiposRaw.filter((e) => e.empresa === filtroEmpresa);
  }, [equiposRaw, filtroEmpresa]);

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
    <div className="max-w-7xl mx-auto">
 
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
          CENTRO DE NOTIFICACIONES: licencias por vencer / vencidas
      ============================================================ */}
      <div
        className="rounded-2xl p-4 mb-4 shadow-sm"
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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bell size={18} style={{ color: "#345D9D" }} />
            <h3 className="font-bold" style={{ color: "#1e293b" }}>
              Centro de notificaciones
            </h3>
            <span className="text-xs" style={{ color: "#64748b" }}>· Licencias de correo</span>
          </div>

          <div className="flex items-center gap-2">
            {licenciasVencidas.length > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
              >
                {licenciasVencidas.length} vencida{licenciasVencidas.length !== 1 ? "s" : ""}
              </span>
            )}
            {licenciasPorVencer.length > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}
              >
                {licenciasPorVencer.length} por vencer
              </span>
            )}
          </div>
        </div>

        {loadingLicencias ? (
          <p className="text-xs text-slate-500">Cargando...</p>
        ) : notificacionesLicencias.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <CircleCheckBig size={18} color="#22C55E" />
            <p className="text-sm" style={{ color: "#64748b" }}>
              Todo al día. No hay licencias vencidas ni próximas a vencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {notificacionesLicencias.slice(0, 8).map((n, i) => (
              <div
                key={`${n.cuenta}-${n.tipo_licencia}-${i}`}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                style={{
                  background: n.estado === "vencida" ? "#fef2f2" : "#fffbeb",
                  border: n.estado === "vencida" ? "1px solid #fecaca" : "1px solid #fde68a",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <KeyRound
                    size={15}
                    style={{ color: n.estado === "vencida" ? "#dc2626" : "#b45309" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1e293b" }}>
                      {n.cuenta} <span className="font-normal text-slate-500">· {n.tipo_licencia}</span>
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{n.empresa}</p>
                  </div>
                </div>

                <span
                  className="text-xs font-semibold whitespace-nowrap"
                  style={{ color: n.estado === "vencida" ? "#dc2626" : "#b45309" }}
                >
                  {n.estado === "vencida"
                    ? `Venció hace ${Math.abs(n.diasRestantes)} día${Math.abs(n.diasRestantes) !== 1 ? "s" : ""}`
                    : n.diasRestantes === 0
                      ? "Vence hoy"
                      : `Vence en ${n.diasRestantes} día${n.diasRestantes !== 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {notificacionesLicencias.length > 8 && (
          <button
            onClick={() => onNavigate("cuentas-correo")}
            className="mt-3 text-xs font-semibold flex items-center gap-1"
            style={{ color: "#345D9D" }}
          >
            Ver las {notificacionesLicencias.length - 8} restantes <ChevronRight size={14} />
          </button>
        )}
      </div>
 
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
            {/* Label arriba */}
            <p className="text-sm mb-2" style={{ color: "#345D9D" }}>{card.label}</p>
 
            {/* Número + ícono en la misma fila, número a la izquierda, ícono a la derecha */}
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
          Mismo patrón visual que la sección de Tickets de arriba,
          pero con datos de la tabla "colaboradores" (empresa, sede,
          tipo de cada equipo). También respeta el filtro de empresa.
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
  );
}