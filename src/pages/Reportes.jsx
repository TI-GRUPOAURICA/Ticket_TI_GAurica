import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Reportes() {

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [empresa, setEmpresa] = useState("todas");

  const [empresas, setEmpresas] = useState([]);

  const [generando, setGenerando] = useState(false);

  const [preview, setPreview] = useState([]);

  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {

    const { data } = await supabase
      .from("colaboradores")
      .select("empresa")
      .order("empresa");

    if (data) {

      const unicas = [
        ...new Set(data.map((d) => d.empresa))
      ];

      setEmpresas(unicas);
    }
  };

  const buscarTickets = async () => {

    if (!fechaInicio || !fechaFin) {
      alert("Selecciona un rango de fechas.");
      return;
    }

    setGenerando(true);

    let query = supabase
      .from("tickets")
      .select(`*, categorias(nombre)`)
      .eq("estado", "resuelto")
      .gte("created_at", `${fechaInicio}T00:00:00`)
      .lte("created_at", `${fechaFin}T23:59:59`)
      .order("created_at", { ascending: true });

    if (empresa !== "todas") {
      query = query.eq("empresa", empresa);
    }

    const { data } = await query;
    console.log(data);

    if (data) setPreview(data);

    setBuscado(true);

    setGenerando(false);
  };

  const exportarExcel = () => {
    alert("Exportando reporte nuevo");
console.log(preview);

    if (preview.length === 0) return;

const filas = preview.map((t) => {
  console.log(filas);

  const fechaCreacion = new Date(t.created_at);

  const fechaResolucion = t.resuelto_at
    ? new Date(t.resuelto_at)
    : null;

  let duracion = "—";

  if (fechaResolucion) {

    const diferencia =
      fechaResolucion - fechaCreacion;

    const horas = Math.floor(
      diferencia / (1000 * 60 * 60)
    );

    const minutos = Math.floor(
      (diferencia % (1000 * 60 * 60))
      / (1000 * 60)
    );

    duracion = `${horas}h ${minutos}m`;
  }

  return {

    "N° Ticket": t.id,

    "Fecha Creación":
      fechaCreacion.toLocaleDateString("es-PE"),

    "Hora Creación":
      fechaCreacion.toLocaleTimeString("es-PE"),

    "Fecha Resolución":
      fechaResolucion
        ? fechaResolucion.toLocaleDateString("es-PE")
        : "—",

    "Hora Resolución":
      fechaResolucion
        ? fechaResolucion.toLocaleTimeString("es-PE")
        : "—",

    "Duración":
      duracion,

    "Resuelto Por":
      t.resuelto_por || "—",

    "Colaborador":
      t.nombre_colaborador || "—",

    "Empresa":
      t.empresa || "—",

    "Hostname":
      t.hostname || "—",

    "Categoría":
      t.categorias?.nombre || "—",

    "Título":
      t.titulo,

    "Descripción":
      t.descripcion,

    "Prioridad":
      t.prioridad,

    "Estado":
      t.estado.replace("_", " "),

    "Solución":
      t.solucion || "—",

    "AnyDesk":
      t.anydesk || "—",

  };
});

    const ws = XLSX.utils.json_to_sheet(filas);

    const wb = XLSX.utils.book_new();

    ws["!cols"] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Tickets Resueltos"
    );

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob(
      [excelBuffer],
      { type: "application/octet-stream" }
    );

    saveAs(
      blob,
      `reporte_${empresa}_${fechaInicio}_${fechaFin}.xlsx`
    );
  };

  const prioridadColor = {
    bajo: "#22c55e",
    medio: "#f59e0b",
    alto: "#f97316",
    critico: "#ef4444",
    emergencia: "#a855f7",
  };

  return (

    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Reportes
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Tickets resueltos — exporta por rango de fechas y empresa
        </p>

      </div>

      {/* FILTROS */}
      <div
        className="rounded-2xl p-6 mb-6 shadow-sm"
        style={{
          background: "#ffffff",
          border: "1px solid #dbeafe"
        }}
      >

        <h2 className="text-slate-800 font-semibold mb-4">
          Filtros
        </h2>

        <div className="flex flex-wrap gap-4 items-end">

          {/* FECHA INICIO */}
          <div>

            <label className="block text-xs mb-1 text-slate-500">
              Fecha inicio
            </label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) =>
                setFechaInicio(e.target.value)
              }
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
                color: "#1e293b"
              }}
            />

          </div>

          {/* FECHA FIN */}
          <div>

            <label className="block text-xs mb-1 text-slate-500">
              Fecha fin
            </label>

            <input
              type="date"
              value={fechaFin}
              onChange={(e) =>
                setFechaFin(e.target.value)
              }
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
                color: "#1e293b"
              }}
            />

          </div>

          {/* EMPRESA */}
          <div>

            <label className="block text-xs mb-1 text-slate-500">
              Empresa
            </label>

            <select
              value={empresa}
              onChange={(e) =>
                setEmpresa(e.target.value)
              }
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
                color: "#1e293b"
              }}
            >

              <option value="todas">
                Todas
              </option>

              {empresas.map((e) => (

                <option key={e} value={e}>
                  {e}
                </option>

              ))}

            </select>

          </div>

          {/* BUSCAR */}
          <button
            onClick={buscarTickets}
            disabled={generando}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, #305da0, #305da0)",
              color: "#ffffff"
            }}
          >

            {generando
              ? "Buscando..."
              : "🔍 Buscar"}

          </button>

          {/* EXPORTAR */}
          {preview.length > 0 && (

            <button
              onClick={exportarExcel}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background:
                  "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "#ffffff"
              }}
            >
              📥 Exportar Excel ({preview.length})
            </button>

          )}

        </div>

      </div>

      {/* PREVIEW */}
      {buscado && (

        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe"
          }}
        >

          {/* HEADER TABLA */}
          <div
            className="px-6 py-4"
            style={{
              borderBottom: "1px solid #dbeafe",
              background: "#eff6ff"
            }}
          >

            <h2 className="font-semibold text-slate-800">

              {preview.length === 0
                ? "No hay tickets resueltos en ese rango"
                : `${preview.length} tickets resueltos encontrados`}

            </h2>

          </div>

          {/* TABLA */}
          {preview.length > 0 && (

            <div className="overflow-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr
                    style={{
                      borderBottom: "1px solid #dbeafe"
                    }}
                  >

                    {[
                          "#",
                          "Fecha",
                          "Hora",
                          "Resuelto Por",
                          "Duración",
                          "Colaborador",
                          "Empresa",
                          "Host",
                          "Título",
                          "Categoría",
                          "Prioridad",
                          "Solución"
                    ].map((h) => (

                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
                        style={{ color: "#305da0" }}
                      >
                        {h}
                      </th>

                    ))}

                  </tr>

                </thead>

                <tbody>

                  {preview.map((t, i) => (

                    <tr
                      key={t.id}
                      className="transition"
                      style={{
                        borderTop:
                          i > 0
                            ? "1px solid #eff6ff"
                            : "none"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "#f8fbff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "transparent";
                      }}
                    >

                      <td className="px-4 py-3 text-xs text-slate-500">
                        #{t.id}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {new Date(t.created_at)
                          .toLocaleDateString("es-PE")}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                        {t.nombre_colaborador || "—"}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.empresa || "—"}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.hostname || "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-800">
                        {t.titulo}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.categorias?.nombre || "—"}
                      </td>

                      <td className="px-4 py-3">

                        <span
                          className="text-xs font-medium capitalize"
                          style={{
                            color:
                              prioridadColor[t.prioridad]
                          }}
                        >
                          {t.prioridad}
                        </span>

                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">

                        {t.solucion
                          ? t.solucion.substring(0, 50) +
                            (t.solucion.length > 50
                              ? "..."
                              : "")
                          : "—"}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}

    </div>
  );
}