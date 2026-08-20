import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Building2,
  MapPin,
  BriefcaseBusiness,
  Mail,
  Pencil,
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

  // Obtener iniciales para el perfil

  // Filtrado
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase();

    return (
      (usuario.EMPRESA || "")
        .toLowerCase()
        .includes(texto) ||
      (usuario.UBICACION || "")
        .toLowerCase()
        .includes(texto) ||
      (usuario.USUARIO || "")
        .toLowerCase()
        .includes(texto) ||
      (usuario.PUESTO || "")
        .toLowerCase()
        .includes(texto) ||
      (usuario.CORREO || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  // Estado del correo
  const obtenerEstado = (usuario) => {
    if (usuario.ESTADO_CORREO) {
      return usuario.ESTADO_CORREO;
    }

    if (usuario.CORREO) {
      return "Activa";
    }

    return "Pendiente";
  };

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cuentas de correo
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Gestión de usuarios y cuentas de correo corporativas
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

        {/* CON CORREO */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Con correo asignado
              </p>

              <p className="text-2xl font-bold text-green-600 mt-1">
                {
                  usuarios.filter(
                    (usuario) => usuario.CORREO
                  ).length
                }
              </p>
            </div>

            <div className="p-3 rounded-xl bg-green-50">
              <Mail
                size={22}
                className="text-green-600"
              />
            </div>

          </div>
        </div>

        {/* SIN CORREO */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Sin correo
              </p>

              <p className="text-2xl font-bold text-orange-500 mt-1">
                {
                  usuarios.filter(
                    (usuario) => !usuario.CORREO
                  ).length
                }
              </p>
            </div>

            <div className="p-3 rounded-xl bg-orange-50">
              <Mail
                size={22}
                className="text-orange-500"
              />
            </div>

          </div>
        </div>

      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {/* BUSCADOR */}
        <div className="p-4 border-b border-slate-200">

          <div className="relative max-w-lg">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, empresa, puesto o correo..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr>

                {/* PERFIL */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Perfil
                </th>

                {/* EMPRESA */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Empresa
                </th>

                {/* USUARIO */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Usuario
                </th>

                {/* PUESTO */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Puesto
                </th>

                {/* CORREO */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Correo
                </th>

                {/* ESTADO */}
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Estado
                </th>

                {/* ACCIONES */}
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Acción
                </th>

              </tr>

            </thead>

            <tbody>

              {cargando ? (

                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500"
                  >
                    Cargando usuarios...
                  </td>
                </tr>

              ) : usuariosFiltrados.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
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

                usuariosFiltrados.map((usuario) => {

                  const estado = obtenerEstado(usuario);

                  return (
                    <tr
                      key={usuario.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition"
                    >

                      {/* PERFIL */}
                      <td className="px-5 py-4">

                        <div className="flex items-center">

                          <div
  className="w-12 h-12 rounded-full flex items-center justify-center"
  style={{
    background: "#eef4ff",
    color: "#345D9D",
  }}
>
  <Users size={23} strokeWidth={1.8} />
</div>

                        </div>

                      </td>

                      {/* EMPRESA */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <Building2
                            size={16}
                            className="text-blue-500"
                          />

                          <span className="text-sm font-medium text-slate-700">
                            {usuario.EMPRESA || "-"}
                          </span>

                        </div>

                      </td>

                      {/* USUARIO */}
                      <td className="px-5 py-4">

                        <div className="flex flex-col">

                          <span className="text-sm font-semibold text-slate-700">
                            {usuario.USUARIO || "-"}
                          </span>

                          {usuario.UBICACION && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                              <MapPin size={12} />
                              {usuario.UBICACION}
                            </span>
                          )}

                        </div>

                      </td>

                      {/* PUESTO */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <BriefcaseBusiness
                            size={15}
                            className="text-slate-400"
                          />

                          <span>
                            {usuario.PUESTO || "-"}
                          </span>

                        </div>

                      </td>

                      {/* CORREO */}
                      <td className="px-5 py-4">

                        {usuario.CORREO ? (

                          <div className="flex items-center gap-2">

                            <Mail
                              size={16}
                              className="text-blue-500"
                            />

                            <span className="text-sm text-slate-700 whitespace-nowrap">
                              {usuario.CORREO}
                            </span>

                          </div>

                        ) : (

                          <span className="text-sm text-slate-400 italic">
                            Sin asignar
                          </span>

                        )}

                      </td>

                      {/* ESTADO */}
                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            estado === "Activa"
                              ? "bg-green-100 text-green-700"
                              : estado === "Bloqueada"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {estado}
                        </span>

                      </td>

                      {/* EDITAR */}
                      <td className="px-5 py-4 text-center">

                        <button
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Editar cuenta"
                        >
                          <Pencil size={17} />
                        </button>

                      </td>

                    </tr>
                  );
                })

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