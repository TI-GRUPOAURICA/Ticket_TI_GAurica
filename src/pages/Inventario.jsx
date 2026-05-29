import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Inventario() {

  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState(null);

  const [editData, setEditData] = useState({
    host: "",
    colaborador: "",
    empresa: "",
  });

  useEffect(() => {
    obtenerEquipos();
  }, []);

  // OBTENER EQUIPOS
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

  // GUARDAR CAMBIOS
  async function guardarCambios() {

    const { error } = await supabase
      .from("colaboradores")
      .update({
        host: editData.host,
        colaborador: editData.colaborador,
        empresa: editData.empresa,
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

  // FILTRAR
  const filtrados = equipos.filter((item) =>
    item.host?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.colaborador?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.empresa?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (

    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold text-slate-800">
            Inventario de Equipos
          </h1>

          <p className="text-sm mt-1 text-slate-500">
            Lista general de equipos registrados
          </p>

        </div>

        <div
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: "#dbeafe",
            color: "#305da0",
            border: "1px solid #bfdbfe"
          }}
        >
          Total: {filtrados.length}
        </div>

      </div>

      {/* BUSCADOR */}
      <div className="mb-5">

        <input
          type="text"
          placeholder="Buscar host, colaborador o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-3 rounded-xl outline-none transition"
          style={{
            background: "#ffffff",
            border: "1px solid #dbeafe",
            color: "#1e293b"
          }}
          onFocus={(e) => {
            e.target.style.border = "1px solid #305da0";
          }}
          onBlur={(e) => {
            e.target.style.border = "1px solid #dbeafe";
          }}
        />

      </div>

      {/* TABLA */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: "#ffffff",
          border: "1px solid #dbeafe"
        }}
      >

        <table className="w-full">

          {/* HEADER TABLA */}
          <thead
            style={{
              background: "#eff6ff",
              borderBottom: "1px solid #dbeafe"
            }}
          >

            <tr>

              <th
                className="p-4 text-left text-sm font-semibold"
                style={{ color ":#305da0
" }}
              >
                Host
              </th>

              <th
                className="p-4 text-left text-sm font-semibold"
                style={{ color: "#24599a" }}
              >
                Colaborador
              </th>

              <th
                className="p-4 text-left text-sm font-semibold"
                style={{ color: "#24599a" }}
              >
                Empresa
              </th>

              <th
                className="p-4 text-left text-sm font-semibold"
                style={{ color: "#24599a" }}
              >
                Acción
              </th>

            </tr>

          </thead>

          {/* BODY */}
          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="4"
                  className="p-10 text-center text-slate-500"
                >
                  Cargando inventario...
                </td>

              </tr>

            ) : filtrados.length === 0 ? (

              <tr>

                <td
                  colSpan="4"
                  className="p-10 text-center text-slate-500"
                >
                  No se encontraron registros
                </td>

              </tr>

            ) : (

              filtrados.map((item) => (

                <tr
                  key={item.id}
                  className="transition"
                  style={{
                    borderTop: "1px solid #eff6ff"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fbff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >

                  {/* HOST */}
                  <td className="p-4">

                    {editandoId === item.id ? (

                      <input
                        value={editData.host}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            host: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#ffffff",
                          color: "#1e293b",
                          border: "1px solid #bfdbfe"
                        }}
                      />

                    ) : (

                      <span
                        className="font-semibold"
                        style={{ color: "#1e293b" }}
                      >
                        {item.host}
                      </span>

                    )}

                  </td>

                  {/* COLABORADOR */}
                  <td className="p-4">

                    {editandoId === item.id ? (

                      <input
                        value={editData.colaborador}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            colaborador: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#ffffff",
                          color: "#1e293b",
                          border: "1px solid #bfdbfe"
                        }}
                      />

                    ) : (

                      <span style={{ color: "#475569" }}>
                        {item.colaborador}
                      </span>

                    )}

                  </td>

                  {/* EMPRESA */}
                  <td className="p-4">

                    {editandoId === item.id ? (

                      <input
                        value={editData.empresa}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            empresa: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#ffffff",
                          color: "#1e293b",
                          border: "1px solid #bfdbfe"
                        }}
                      />

                    ) : (

                      <span style={{ color: "#475569" }}>
                        {item.empresa}
                      </span>

                    )}

                  </td>

                  {/* BOTON */}
                  <td className="p-4">

                    {editandoId === item.id ? (

                      <button
                        onClick={guardarCambios}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{
                          background:
                            "linear-gradient(135deg, #16a34a, #22c55e)",
                          color: "#ffffff"
                        }}
                      >
                        💾 Guardar
                      </button>

                    ) : (

                      <button
                        onClick={() => {

                          setEditandoId(item.id);

                          setEditData({
                            host: item.host,
                            colaborador: item.colaborador,
                            empresa: item.empresa,
                          });

                        }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{
                          background:
                            "linear-gradient(135deg, #24599a, #3b82f6)",
                          color: "#ffffff"
                        }}
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