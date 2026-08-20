import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Building2,
  MapPin,
  BriefcaseBusiness,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("usuarios_grupo_aurica")
      .select("*")
      .order("USUARIO", { ascending: true });

    if (error) {
      console.error("Error cargando usuarios:", error);
      setUsuarios([]);
    } else {
      setUsuarios(data || []);
    }

    setCargando(false);
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase();

    return (
      (usuario.EMPRESA || "").toLowerCase().includes(texto) ||
      (usuario.UBICACION || "").toLowerCase().includes(texto) ||
      (usuario.USUARIO || "").toLowerCase().includes(texto) ||
      (usuario.PUESTO || "").toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cuentas de correo
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Gestión de usuarios y cuentas corporativas
        </p>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* TOTAL */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total de usuarios
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                {usuarios.length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50">
              <Users
                size={22}
                className="text-blue-600"
              />
            </div>

          </div>
        </div>

        {/* EMPRESAS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Empresas
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                {
                  new Set(
                    usuarios
                      .map((u) => u.EMPRESA)
                      .filter(Boolean)
                  ).size
                }
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50">
              <Building2
                size={22}
                className="text-indigo-600"
              />
            </div>

          </div>
        </div>

        {/* UBICACIONES */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Ubicaciones
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                {
                  new Set(
                    usuarios
                      .map((u) => u.UBICACION)
                      .filter(Boolean)
                  ).size
                }
              </p>
            </div>

            <div className="p-3 rounded-xl bg-green-50">
              <MapPin
                size={22}
                className="text-green-600"
              />
            </div>

          </div>
        </div>

      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {/* BUSCADOR */}
        <div className="p-4 border-b border-slate-200">

          <div className="relative max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar usuario, empresa, ubicación..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr>

                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Empresa
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Ubicación
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Usuario
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Puesto
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-12 text-slate-500"
                  >
                    Cargando usuarios...
                  </td>
                </tr>

              ) : usuariosFiltrados.length === 0 ? (

                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-12"
                  >

                    <Users
                      size={35}
                      className="mx-auto text-slate-300 mb-3"
                    />

                    <p className="text-slate-500">
                      No se encontraron usuarios.
                    </p>

                  </td>
                </tr>

              ) : (

                usuariosFiltrados.map((usuario) => (

                  <tr
                    key={usuario.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                  >

                    {/* EMPRESA */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="p-2 rounded-lg bg-blue-50">
                          <Building2
                            size={17}
                            className="text-blue-600"
                          />
                        </div>

                        <span className="text-sm font-medium text-slate-700">
                          {usuario.EMPRESA || "-"}
                        </span>

                      </div>

                    </td>

                    {/* UBICACION */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-slate-600">

                        <MapPin
                          size={16}
                          className="text-slate-400"
                        />

                        {usuario.UBICACION || "-"}

                      </div>

                    </td>

                    {/* USUARIO */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <Users
                          size={16}
                          className="text-slate-400"
                        />

                        <span className="text-sm font-medium text-slate-700">
                          {usuario.USUARIO || "-"}
                        </span>

                      </div>

                    </td>

                    {/* PUESTO */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-slate-600">

                        <BriefcaseBusiness
                          size={16}
                          className="text-slate-400"
                        />

                        {usuario.PUESTO || "-"}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* PIE */}
        {!cargando && (
          <div className="px-5 py-3 border-t border-slate-200 text-sm text-slate-500">
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
          </div>
        )}

      </div>

    </div>
  );
}