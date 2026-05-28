import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard({ onNavigate }) {

  const [stats, setStats] = useState({
    abiertos: 0,
    en_proceso: 0,
    resueltos: 0,
    total: 0
  });

  const [porCategoria, setPorCategoria] = useState([]);
  const [porEmpresa, setPorEmpresa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const { data } = await supabase
      .from("tickets")
      .select(`*, categorias(nombre)`);

    if (data) {

      setStats({
        abiertos: data.filter((t) => t.estado === "abierto").length,
        en_proceso: data.filter((t) => t.estado === "en_proceso").length,
        resueltos: data.filter((t) => t.estado === "resuelto").length,
        total: data.length,
      });

      // Categorías
      const catMap = {};

      data.forEach((t) => {
        const cat = t.categorias?.nombre || "Sin categoría";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });

      setPorCategoria(
        Object.entries(catMap).sort((a, b) => b[1] - a[1])
      );

      // Empresas
      const empMap = {};

      data.forEach((t) => {
        const emp = t.empresa || "Sin empresa";
        empMap[emp] = (empMap[emp] || 0) + 1;
      });

      setPorEmpresa(
        Object.entries(empMap).sort((a, b) => b[1] - a[1])
      );
    }

    setLoading(false);
  };

  const maxCat = porCategoria[0]?.[1] || 1;
  const maxEmp = porEmpresa[0]?.[1] || 1;

  const statCards = [
    {
      label: "Total Tickets",
      value: stats.total,
      color: "#2563eb",
      icon: "🎫",
      bg: "#dbeafe"
    },
    {
      label: "Abiertos",
      value: stats.abiertos,
      color: "#ef4444",
      icon: "🔴",
      bg: "#fee2e2"
    },
    {
      label: "En Proceso",
      value: stats.en_proceso,
      color: "#f59e0b",
      icon: "🟡",
      bg: "#fef3c7"
    },
    {
      label: "Resueltos",
      value: stats.resueltos,
      color: "#22c55e",
      icon: "✅",
      bg: "#dcfce7"
    },
  ];

  const porcentajeResueltos =
    stats.total > 0
      ? Math.round((stats.resueltos / stats.total) * 100)
      : 0;

  return (

    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Resumen general del sistema
        </p>

      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {statCards.map((card) => (

          <div
            key={card.label}
            className="rounded-2xl p-5 shadow-sm"
            style={{
              background: "#ffffff",
              border: "1px solid #dbeafe"
            }}
          >

            <div className="flex items-center justify-between mb-3">

              <p
                className="text-sm"
                style={{ color: "#64748b" }}
              >
                {card.label}
              </p>

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: card.bg
                }}
              >
                <span className="text-lg">
                  {card.icon}
                </span>
              </div>

            </div>

            <p
              className="text-4xl font-bold"
              style={{ color: card.color }}
            >
              {card.value}
            </p>

          </div>

        ))}

      </div>

      {/* GRAFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* RESOLUCION */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          <p className="text-sm mb-4 font-semibold text-slate-700">
            Tasa de resolución
          </p>

          <div className="relative w-32 h-32">

            <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">

              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />

              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={`${porcentajeResueltos} 100`}
                strokeLinecap="round"
              />

            </svg>

            <div className="absolute inset-0 flex items-center justify-center">

              <span className="text-2xl font-bold text-slate-800">
                {porcentajeResueltos}%
              </span>

            </div>

          </div>

          <p className="text-xs mt-3 text-slate-500">
            {stats.resueltos} de {stats.total} tickets
          </p>

        </div>

        {/* CATEGORIAS */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          <p className="text-sm font-semibold text-slate-700 mb-4">
            Tickets por categoría
          </p>

          {loading ? (

            <p className="text-xs text-slate-500">
              Cargando...
            </p>

          ) : porCategoria.length === 0 ? (

            <p className="text-xs text-slate-500">
              Sin datos aún.
            </p>

          ) : (

            <div className="space-y-3">

              {porCategoria.slice(0, 5).map(([cat, count]) => (

                <div key={cat}>

                  <div className="flex justify-between text-xs mb-1">

                    <span className="text-slate-500">
                      {cat}
                    </span>

                    <span style={{ color: "#2563eb" }}>
                      {count}
                    </span>

                  </div>

                  <div
                    className="h-2 rounded-full"
                    style={{ background: "#e2e8f0" }}
                  >

                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / maxCat) * 100}%`,
                        background:
                          "linear-gradient(90deg, #2563eb, #60a5fa)"
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* EMPRESAS */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          <p className="text-sm font-semibold text-slate-700 mb-4">
            Tickets por empresa
          </p>

          {loading ? (

            <p className="text-xs text-slate-500">
              Cargando...
            </p>

          ) : porEmpresa.length === 0 ? (

            <p className="text-xs text-slate-500">
              Sin datos aún.
            </p>

          ) : (

            <div className="space-y-3">

              {porEmpresa.map(([emp, count]) => (

                <div key={emp}>

                  <div className="flex justify-between text-xs mb-1">

                    <span className="text-slate-500">
                      {emp}
                    </span>

                    <span style={{ color: "#2563eb" }}>
                      {count}
                    </span>

                  </div>

                  <div
                    className="h-2 rounded-full"
                    style={{ background: "#e2e8f0" }}
                  >

                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(count / maxEmp) * 100}%`,
                        background:
                          "linear-gradient(90deg, #2563eb, #60a5fa)"
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

      {/* ACCESOS */}
      <div className="grid grid-cols-2 gap-4">

        <button
          onClick={() => onNavigate("tickets")}
          className="rounded-2xl p-5 text-left transition hover:shadow-md"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          <p className="text-2xl mb-2">
            🎫
          </p>

          <p className="font-semibold text-slate-800">
            Ver tickets pendientes
          </p>

          <p className="text-xs mt-1 text-slate-500">
            {stats.abiertos + stats.en_proceso} tickets requieren atención
          </p>

        </button>

        <button
          onClick={() => onNavigate("reportes")}
          className="rounded-2xl p-5 text-left transition hover:shadow-md"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          <p className="text-2xl mb-2">
            📈
          </p>

          <p className="font-semibold text-slate-800">
            Generar reporte
          </p>

          <p className="text-xs mt-1 text-slate-500">
            {stats.resueltos} tickets resueltos disponibles
          </p>

        </button>

      </div>

    </div>
  );
}