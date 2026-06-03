import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// =============================================================
// COMPONENTE: Inventario
// Tabla de gestión de equipos registrados en el sistema.
// Permite al equipo de TI visualizar, buscar y editar los datos
// de cada equipo (host, colaborador asignado y empresa).
//
// No recibe props — consume Supabase directamente.
// =============================================================
export default function Inventario() {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [equipos, setEquipos] = useState([]);       // Lista completa de equipos desde Supabase
  const [busqueda, setBusqueda] = useState("");      // Texto del input de búsqueda en tiempo real
  const [loading, setLoading] = useState(true);     // Controla el estado de carga inicial

  const [editandoId, setEditandoId] = useState(null); // ID del equipo actualmente en modo edición
  const [editData, setEditData] = useState({           // Datos temporales del equipo que se está editando
    host: "",
    colaborador: "",
    empresa: "",
  });

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
  // ----------------------------------------------------------
  async function guardarCambios() {
    const { error } = await supabase
      .from("colaboradores")
      .update({
        host:         editData.host,
        colaborador:  editData.colaborador,
        empresa:      editData.empresa,
      })
      .eq("id", editandoId);

    if (error) {
      console.error(error);
      alert("Error actualizando");
      return;
    }

    setEditandoId(null);
    obtenerEquipos();
  }

  // ----------------------------------------------------------
  // FILTRADO EN TIEMPO REAL
  // Filtra los equipos localmente según el texto ingresado.
  // Busca coincidencias en host, colaborador y empresa
  // sin distinguir mayúsculas/minúsculas.
  // ----------------------------------------------------------
  const filtrados = equipos.filter((item) =>
    item.host?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.colaborador?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.empresa?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="p-6">

      {/* --------------------------------------------------------
          ENCABEZADO
          Título, descripción y contador de equipos visibles.
          El contador se actualiza según el filtro activo.
      -------------------------------------------------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Inventario de Equipos</h1>
          <p className="text-sm mt-1 text-slate-500">Lista general de equipos registrados</p>
        </div>
        <div
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#dbeafe", color: "#345D9D", border: "1px solid #bfdbfe" }}
        >
          Total: {filtrados.length}
        </div>
      </div>

      {/* --------------------------------------------------------
          BUSCADOR
          Input de texto que filtra la tabla en tiempo real
          por host, nombre del colaborador o empresa.
      -------------------------------------------------------- */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar host, colaborador o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-3 rounded-xl outline-none transition"
          style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
          onFocus={(e) => (e.target.style.border = "1px solid #345D9D")}
          onBlur={(e) => (e.target.style.border = "1px solid #dbeafe")}
        />
      </div>

      {/* --------------------------------------------------------
          TABLA DE EQUIPOS
          Muestra los equipos filtrados con 4 columnas:
          Host · Colaborador · Empresa · Acción (Editar/Guardar)

          Cada fila puede estar en dos modos:
            - Modo lectura: muestra texto plano + botón "Editar"
            - Modo edición: muestra inputs + botón "Guardar"
          Solo una fila puede estar en edición a la vez (editandoId).
      -------------------------------------------------------- */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >
        <table className="w-full">

          {/* Cabecera de la tabla */}
          <thead style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe" }}>
            <tr>
              {["Host", "Colaborador", "Empresa", "Acción"].map((col) => (
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

                  {/* CELDA: Host
                      En modo edición muestra un input editable.
                      En modo lectura muestra el valor en texto. */}
                  <td className="p-4">
                    {editandoId === item.id ? (
                      <input
                        value={editData.host}
                        onChange={(e) => setEditData({ ...editData, host: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{ background: "#ffffff", color: "#1e293b", border: "1px solid #bfdbfe" }}
                      />
                    ) : (
                      <span className="font-semibold" style={{ color: "#1e293b" }}>{item.host}</span>
                    )}
                  </td>

                  {/* CELDA: Colaborador — mismo patrón lectura/edición */}
                  <td className="p-4">
                    {editandoId === item.id ? (
                      <input
                        value={editData.colaborador}
                        onChange={(e) => setEditData({ ...editData, colaborador: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{ background: "#ffffff", color: "#1e293b", border: "1px solid #bfdbfe" }}
                      />
                    ) : (
                      <span style={{ color: "#475569" }}>{item.colaborador}</span>
                    )}
                  </td>

                  {/* CELDA: Empresa — mismo patrón lectura/edición */}
                  <td className="p-4">
                    {editandoId === item.id ? (
                      <input
                        value={editData.empresa}
                        onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{ background: "#ffffff", color: "#1e293b", border: "1px solid #bfdbfe" }}
                      />
                    ) : (
                      <span style={{ color: "#475569" }}>{item.empresa}</span>
                    )}
                  </td>

                  {/* CELDA: Acción
                      En modo edición: botón verde "Guardar" que llama a guardarCambios().
                      En modo lectura: botón azul "Editar" que activa el modo edición
                      cargando los valores actuales del item en editData. */}
                  <td className="p-4">
                    {editandoId === item.id ? (
                      <button
                        onClick={guardarCambios}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#ffffff" }}
                      >
                        💾 Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoId(item.id);
                          setEditData({
                            host:        item.host,
                            colaborador: item.colaborador,
                            empresa:     item.empresa,
                          });
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #345D9D, #345D9D)", color: "#ffffff" }}
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
}