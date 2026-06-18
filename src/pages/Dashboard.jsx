import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Ticket,
  CircleAlert,
  Clock3,
  CircleCheckBig,
  FileSpreadsheet,
} from "lucide-react";

// =============================================================
// COMPONENTE: Dashboard
// Panel de control principal para el equipo de TI.
// Muestra estadísticas generales de tickets, gráficos por
// categoría y empresa, y accesos rápidos a otras secciones.
//
// Props:
//   onNavigate → función que recibe una ruta ("tickets" o "reportes")
//                y navega a la sección correspondiente del panel admin.
// =============================================================
export default function Dashboard({ onNavigate }) {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [stats, setStats] = useState({
    abiertos: 0,       // Tickets con estado "abierto"
    en_proceso: 0,     // Tickets con estado "en_proceso"
    resueltos: 0,      // Tickets con estado "resuelto"
    total: 0,          // Total de tickets registrados
  });

  const [porCategoria, setPorCategoria] = useState([]); // Lista ordenada [nombre, cantidad]
  const [porEmpresa, setPorEmpresa] = useState([]);     // Lista ordenada [empresa, cantidad]
  const [loading, setLoading] = useState(true);         // Controla el estado de carga inicial

  // ----------------------------------------------------------
  // EFECTO INICIAL
  // Carga los datos desde Supabase al montar el componente.
  // ----------------------------------------------------------
  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------------
  // CARGA DE DATOS DESDE SUPABASE
  // Obtiene todos los tickets junto con su categoría.
  // Con esa data calcula:
  //   - Conteo por estado (abierto, en_proceso, resuelto)
  //   - Agrupación por categoría (para la barra horizontal)
  //   - Agrupación por empresa (para la barra horizontal)
  // ----------------------------------------------------------
  const fetchData = async () => {

    const { data } = await supabase
      .from("tickets")
      .select(`*, categorias(nombre)`);

    if (data) {

      // Conteo de tickets por estado
      setStats({
        abiertos:   data.filter((t) => t.estado === "abierto").length,
        en_proceso: data.filter((t) => t.estado === "en_proceso").length,
        resueltos:  data.filter((t) => t.estado === "resuelto").length,
        total:      data.length,
      });

      // Agrupación por categoría: genera un objeto { "Red": 5, "Hardware": 3, ... }
      // luego lo convierte en array ordenado de mayor a menor
      const catMap = {};
      data.forEach((t) => {
        const cat = t.categorias?.nombre || "Sin categoría";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      setPorCategoria(Object.entries(catMap).sort((a, b) => b[1] - a[1]));

      // Agrupación por empresa: misma lógica que categorías
      const empMap = {};
      data.forEach((t) => {
        const emp = t.empresa || "Sin empresa";
        empMap[emp] = (empMap[emp] || 0) + 1;
      });
      setPorEmpresa(Object.entries(empMap).sort((a, b) => b[1] - a[1]));
    }

    setLoading(false);
  };

  // ----------------------------------------------------------
  // VALORES MÁXIMOS PARA LAS BARRAS DE PROGRESO
  // Se usan para calcular el ancho relativo (%) de cada barra.
  // El ítem con más tickets siempre ocupa el 100% del ancho.
  // ----------------------------------------------------------
  const maxCat = porCategoria[0]?.[1] || 1;
  const maxEmp = porEmpresa[0]?.[1] || 1;

  // ----------------------------------------------------------
  // CONFIGURACIÓN DE LAS 4 TARJETAS DE ESTADÍSTICAS
  // Cada objeto define el texto, valor, color e ícono de su card.
  // ----------------------------------------------------------
  const statCards = [
    { label: "Total Tickets", value: stats.total,      color: "#345D9D", icon: Ticket,         bg: "#EAF2FB" },
    { label: "Abiertos",      value: stats.abiertos,   color: "#EF4444", icon: CircleAlert,    bg: "#FEE2E2" },
    { label: "En Proceso",    value: stats.en_proceso,  color: "#F59E0B", icon: Clock3,         bg: "#FEF3C7" },
    { label: "Resueltos",     value: stats.resueltos,  color: "#22C55E", icon: CircleCheckBig, bg: "#DCFCE7" },
  ];

  // ----------------------------------------------------------
  // PORCENTAJE DE RESOLUCIÓN
  // Se muestra en el gráfico circular (donut chart SVG).
  // Calcula cuántos tickets han sido resueltos del total.
  // ----------------------------------------------------------
  const porcentajeResueltos =
    stats.total > 0 ? Math.round((stats.resueltos / stats.total) * 100) : 0;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div  className="max-w-7xl mx-auto">

      {/* --------------------------------------------------------
          ENCABEZADO
          Título de la sección y descripción breve.
      -------------------------------------------------------- */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold"style={{ color: "#345D9D", fontFamily: "nexa" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Resumen general del sistema</p>
      </div>

      {/* --------------------------------------------------------
          TARJETAS DE ESTADÍSTICAS
          Grid de 4 cards que muestran el conteo de tickets
          por estado. Se generan dinámicamente desde statCards[].
      -------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "#64748b" }}>{card.label}</p>
              {/* Ícono con fondo de color según el estado */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon size={22} color={card.color} strokeWidth={2} />
              </div>
            </div>
            {/* Número grande con el color del estado */}
            <p className="text-3xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------
          SECCIÓN DE GRÁFICOS — 3 columnas
          1. Donut chart: tasa de resolución
          2. Barras horizontales: tickets por categoría
          3. Barras horizontales: tickets por empresa
      -------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* -------------------------------------------------------
            GRÁFICO 1: Tasa de resolución (donut SVG)
            Círculo SVG donde el arco verde representa el % resuelto.
            Se construye con strokeDasharray usando el porcentaje
            calculado sobre una circunferencia normalizada a 100.
        ------------------------------------------------------- */}
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
              {/* Círculo de fondo (gris) */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              {/* Arco verde proporcional al porcentaje resuelto */}
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={`${porcentajeResueltos} 100`}
                strokeLinecap="round"
              />
            </svg>
            {/* Porcentaje centrado sobre el donut */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{porcentajeResueltos}%</span>
            </div>
          </div>

          <p className="text-xs mt-3 text-slate-500">
            {stats.resueltos} de {stats.total} tickets
          </p>
        </div>

        {/* -------------------------------------------------------
            GRÁFICO 2: Tickets por categoría
            Barras horizontales proporcionales al máximo (maxCat).
            Muestra solo las 5 categorías con más tickets.
        ------------------------------------------------------- */}
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
                  {/* Barra de fondo gris + barra azul proporcional */}
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

        {/* -------------------------------------------------------
            GRÁFICO 3: Tickets por empresa
            Misma estructura que el gráfico de categorías,
            pero agrupa por la empresa del colaborador que abrió el ticket.
        ------------------------------------------------------- */}
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
                  {/* Barra de fondo gris + barra azul proporcional */}
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

      {/* --------------------------------------------------------
          ACCESOS RÁPIDOS
          Dos botones que llevan directamente a:
            - "tickets": lista de tickets pendientes de atención
            - "reportes": sección para generar reportes exportables
          Muestran conteos relevantes como contexto al usuario.
      -------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4">

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