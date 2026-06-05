import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { saveAs } from "file-saver";
import { Search } from "lucide-react";

// =============================================================
// COMPONENTE: Reportes
// Permite al equipo de TI consultar y exportar tickets resueltos
// filtrando por rango de fechas y empresa.
// Genera un archivo CSV compatible con Excel (con BOM UTF-8).
//
// No recibe props — consume Supabase directamente.
// =============================================================
export default function Reportes() {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [fechaInicio, setFechaInicio] = useState("");  // Fecha inicial del filtro (formato YYYY-MM-DD)
  const [fechaFin, setFechaFin] = useState("");         // Fecha final del filtro (formato YYYY-MM-DD)
  const [empresa, setEmpresa] = useState("todas");      // Empresa seleccionada en el filtro ("todas" = sin filtro)
  const [empresas, setEmpresas] = useState([]);         // Lista de empresas únicas cargadas desde Supabase
  const [generando, setGenerando] = useState(false);    // Bloquea el botón mientras se consulta Supabase
  const [preview, setPreview] = useState([]);           // Tickets encontrados para mostrar en la tabla
  const [buscado, setBuscado] = useState(false);        // Controla si ya se hizo al menos una búsqueda

  // ----------------------------------------------------------
  // EFECTO INICIAL
  // Carga las empresas disponibles al montar el componente
  // para poblar el selector del filtro.
  // ----------------------------------------------------------
  useEffect(() => {
    cargarEmpresas();
  }, []);

  // ----------------------------------------------------------
  // CARGAR EMPRESAS
  // Obtiene los valores únicos del campo "empresa" desde la
  // tabla "colaboradores" y los almacena para el selector.
  // ----------------------------------------------------------
  const cargarEmpresas = async () => {
    const { data } = await supabase
      .from("colaboradores")
      .select("empresa")
      .order("empresa");

    if (data) {
      const unicas = [...new Set(data.map((d) => d.empresa))];
      setEmpresas(unicas);
    }
  };

  // ----------------------------------------------------------
  // BUSCAR TICKETS
  // Consulta la tabla "tickets" filtrando por:
  //   - Estado: solo "resuelto"
  //   - Rango de fechas: created_at entre fechaInicio y fechaFin
  //   - Empresa: si no es "todas", filtra por empresa específica
  // Los resultados se guardan en preview para mostrar en tabla.
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // EXPORTAR A CSV (compatible con Excel)
  // Transforma los tickets del preview en filas con columnas
  // definidas, calcula la duración de cada ticket (creación
  // hasta resolución), genera el CSV con separador "," y lo
  // descarga con BOM UTF-8 para que Excel lo lea correctamente.
  // El nombre del archivo incluye empresa, fechas y hora exacta.
  // ----------------------------------------------------------
  const exportarExcel = () => {
    if (preview.length === 0) return;

    // Mapeo de cada ticket a un objeto con columnas para el CSV
    const filas = preview.map((t) => {
      const fechaCreacion   = new Date(t.created_at);
      const fechaResolucion = t.resuelto_at ? new Date(t.resuelto_at) : null;

      // Cálculo de duración entre creación y resolución
      let duracion = "—";
      if (fechaResolucion) {
        const diferencia = fechaResolucion - fechaCreacion;
        const horas   = Math.floor(diferencia / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        duracion = `${horas}h ${minutos}m`;
      }

      return {
        "N° Ticket":        t.id,
        "Fecha Creación":   fechaCreacion.toLocaleDateString("es-PE"),
        "Hora Creación":    fechaCreacion.toLocaleTimeString("es-PE"),
        "Fecha Resolución": fechaResolucion ? fechaResolucion.toLocaleDateString("es-PE") : "—",
        "Hora Resolución":  fechaResolucion ? fechaResolucion.toLocaleTimeString("es-PE") : "—",
        "Duración":         duracion,
        "Resuelto Por":     t.resuelto_por || "—",
        "Colaborador":      t.nombre_colaborador || "—",
        "Empresa":          t.empresa || "—",
        "Hostname":         t.hostname || "—",
        "Categoría":        t.categorias?.nombre || "—",
        "Título":           t.titulo,
        "Descripción":      t.descripcion,
        "Prioridad":        t.prioridad,
        "Estado":           t.estado.replace("_", " "),
        "Solución":         t.solucion || "—",
        "AnyDesk":          t.anydesk || "—",
      };
    });

    // Construcción del CSV: encabezados + filas con valores entre comillas
    const encabezados = Object.keys(filas[0]);
    const csv = [
      encabezados.join(","),
      ...filas.map((fila) =>
        encabezados
          .map((campo) => `"${String(fila[campo] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    // BOM (\uFEFF) necesario para que Excel interprete correctamente el UTF-8
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

    // Nombre del archivo con fecha y hora exacta de exportación
    const ahora = new Date();
    const fechaHora =
      ahora.getFullYear() + "-" +
      String(ahora.getMonth() + 1).padStart(2, "0") + "-" +
      String(ahora.getDate()).padStart(2, "0") + "_" +
      String(ahora.getHours()).padStart(2, "0") + "-" +
      String(ahora.getMinutes()).padStart(2, "0") + "-" +
      String(ahora.getSeconds()).padStart(2, "0");

    saveAs(blob, `reporte_${empresa}_${fechaInicio}_${fechaFin}_${fechaHora}.csv`);
  };

  // ----------------------------------------------------------
  // COLORES DE PRIORIDAD
  // Mapa de colores para mostrar la prioridad de cada ticket
  // con su color correspondiente en la tabla de preview.
  // ----------------------------------------------------------
  const prioridadColor = {
    bajo:       "#22c55e",
    medio:      "#f59e0b",
    alto:       "#f97316",
    critico:    "#ef4444",
    emergencia: "#a855f7",
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* --------------------------------------------------------
          ENCABEZADO
          Título y descripción breve de la sección.
      -------------------------------------------------------- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight" style={{ color: "#345D9D" }}>Reportes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tickets resueltos — exporta por rango de fechas y empresa
        </p>
      </div>

      {/* --------------------------------------------------------
          PANEL DE FILTROS
          Contiene los inputs de fecha inicio, fecha fin y empresa,
          el botón de búsqueda y el botón de exportación (que solo
          aparece cuando hay resultados en el preview).
      -------------------------------------------------------- */}
      <div
        className="rounded-2xl p-6 mb-6 shadow-sm"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >
        <h2 className="text-slate-800 font-semibold mb-4" style={{ color: "#345D9D" }}>Filtros</h2>

        <div className="flex flex-wrap gap-4 items-end">

          {/* Filtro: fecha de inicio */}
          <div>
            <label className="block text-xs mb-1 text-slate-500">Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
            />
          </div>

          {/* Filtro: fecha de fin */}
          <div>
            <label className="block text-xs mb-1 text-slate-500">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
            />
          </div>

          {/* Filtro: empresa (cargado dinámicamente desde Supabase) */}
          <div>
            <label className="block text-xs mb-1 text-slate-500">Empresa</label>
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="text-sm px-4 py-2 rounded-xl focus:outline-none"
              style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todas">Todas</option>
              {empresas.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Botón: ejecutar la búsqueda con los filtros activos */}
          <button
              onClick={buscarTickets}
              className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition hover:opacity-90"
              style={{
                background: "#345D9D",
                color: "#ffffff",
              }}
            >
              <Search size={20} strokeWidth={2.5} />
              Buscar
            </button>

          {/* Botón: exportar CSV — solo visible si hay resultados */}
          {preview.length > 0 && (
            <button
              onClick={exportarExcel}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#ffffff" }}
            >
              📥 Exportar Excel ({preview.length})
            </button>
          )}

        </div>
      </div>

      {/* --------------------------------------------------------
          TABLA DE PREVIEW
          Solo se muestra si ya se realizó al menos una búsqueda.
          Si no hay resultados muestra un mensaje. Si hay, muestra
          la tabla con todas las columnas del reporte:
          #, Fecha, Hora, Resuelto Por, Duración, Colaborador,
          Empresa, Host, Título, Categoría, Prioridad, Solución.
          La columna Solución se trunca a 50 caracteres.
          La duración se calcula en línea desde created_at y resuelto_at.
      -------------------------------------------------------- */}
      {buscado && (
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
        >

          {/* Encabezado de la tabla con conteo de resultados */}
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid #dbeafe", background: "#eff6ff" }}
          >
            <h2 className="font-semibold text-slate-800">
              {preview.length === 0
                ? "No hay tickets resueltos en ese rango"
                : `${preview.length} tickets resueltos encontrados`}
            </h2>
          </div>

          {preview.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-sm">

                {/* Cabecera de columnas */}
                <thead>
                  <tr style={{ borderBottom: "1px solid #dbeafe" }}>
                    {["#", "Fecha", "Hora", "Resuelto Por", "Duración", "Colaborador",
                      "Empresa", "Host", "Título", "Categoría", "Prioridad", "Solución"
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
                        style={{ color: "#345D9D" }}
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
                      style={{ borderTop: i > 0 ? "1px solid #eff6ff" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fbff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >

                      {/* N° de ticket */}
                      <td className="px-4 py-3 text-xs text-slate-500">#{t.id}</td>

                      {/* Fecha y hora de creación */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {new Date(t.created_at).toLocaleDateString("es-PE")}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {new Date(t.created_at).toLocaleTimeString("es-PE")}
                      </td>

                      {/* Técnico que resolvió el ticket */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.resuelto_por || "—"}
                      </td>

                      {/* Duración calculada en línea: diferencia entre creación y resolución */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.resuelto_at
                          ? (() => {
                              const inicio   = new Date(t.created_at);
                              const fin      = new Date(t.resuelto_at);
                              const minutos  = Math.floor((fin - inicio) / (1000 * 60));
                              const horas    = Math.floor(minutos / 60);
                              const mins     = minutos % 60;
                              return `${horas}h ${mins}m`;
                            })()
                          : "—"}
                      </td>

                      {/* Datos del colaborador y equipo */}
                      <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                        {t.nombre_colaborador || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.empresa || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.hostname || "—"}
                      </td>

                      {/* Título del ticket */}
                      <td className="px-4 py-3 text-sm text-slate-800">{t.titulo}</td>

                      {/* Categoría del ticket */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                        {t.categorias?.nombre || "—"}
                      </td>

                      {/* Prioridad con color según nivel */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium capitalize"
                          style={{ color: prioridadColor[t.prioridad] }}
                        >
                          {t.prioridad}
                        </span>
                      </td>

                      {/* Solución truncada a 50 caracteres para no romper el layout */}
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {t.solucion
                          ? t.solucion.substring(0, 50) + (t.solucion.length > 50 ? "..." : "")
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