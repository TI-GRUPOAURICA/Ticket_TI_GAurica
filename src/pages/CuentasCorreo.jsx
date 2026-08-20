import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Building2,
  Mail,
  Pencil,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [cuentaEditando, setCuentaEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    empresa: "",
    nombre: "",
    correo: "",
    activo: true,
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // =========================================================
  // CARGAR CUENTAS
  // =========================================================

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    setCargando(true);
    setMensaje("");

    const { data, error } = await supabase
      .from("cuentas_correo")
      .select("*")
      .order("empresa", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error cargando cuentas:", error);
      setMensaje(`Error al cargar las cuentas: ${error.message}`);
      setCuentas([]);
    } else {
      setCuentas(data || []);
    }

    setCargando(false);
  };

  // =========================================================
  // ABRIR EDITAR
  // =========================================================

  const abrirEditar = (cuenta) => {
    setCuentaEditando(cuenta);

    setFormulario({
      empresa: cuenta.empresa || "",
      nombre: cuenta.nombre || "",
      correo: cuenta.correo || "",
      activo: cuenta.activo ?? true,
    });

    setMensaje("");
  };

  // =========================================================
  // CERRAR EDITAR
  // =========================================================

  const cerrarEditar = () => {
    if (guardando) return;

    setCuentaEditando(null);

    setFormulario({
      empresa: "",
      nombre: "",
      correo: "",
      activo: true,
    });

    setMensaje("");
  };

  // =========================================================
  // CAMBIAR CAMPO
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  const guardarCambios = async () => {
    if (!cuentaEditando) return;

    if (!formulario.correo.trim()) {
      setMensaje("El correo electrónico es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const datosActualizar = {
      empresa: formulario.empresa.trim(),
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim().toLowerCase(),
      activo: formulario.activo,
      updated_at: new Date().toISOString(),
    };

    console.log("Actualizando cuenta:", cuentaEditando.id);
    console.log("Datos:", datosActualizar);

    const { data, error } = await supabase
      .from("cuentas_correo")
      .update(datosActualizar)
      .eq("id", cuentaEditando.id)
      .select()
      .single();

    if (error) {
      console.error("ERROR SUPABASE:", error);

      setMensaje(`Error al guardar: ${error.message}`);
      setGuardando(false);

      return;
    }

    console.log("Cuenta actualizada:", data);

    setCuentas((actuales) =>
      actuales.map((cuenta) =>
        cuenta.id === cuentaEditando.id ? data : cuenta
      )
    );

    setGuardando(false);
    cerrarEditar();
  };

  // =========================================================
  // FILTRO
  // =========================================================

  const cuentasFiltradas = cuentas.filter((cuenta) => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return true;

    return (
      String(cuenta.empresa || "")
        .toLowerCase()
        .includes(texto) ||
      String(cuenta.nombre || "")
        .toLowerCase()
        .includes(texto) ||
      String(cuenta.correo || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  // =========================================================
  // CONTADORES
  // =========================================================

  const totalCuentas = cuentas.length;

  const cuentasActivas = cuentas.filter(
    (cuenta) => cuenta.activo === true
  ).length;

  const cuentasInactivas = cuentas.filter(
    (cuenta) => cuenta.activo === false
  ).length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          TITULO
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cuentas de correo
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Gestión de cuentas de correo corporativas y sus licencias
        </p>
      </div>

      {/* =====================================================
          RESUMEN
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* TOTAL */}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total de cuentas
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                {totalCuentas}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users
                size={23}
                className="text-blue-600"
              />
            </div>

          </div>
        </div>

        {/* ACTIVAS */}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Cuentas activas
              </p>

              <p className="text-2xl font-bold text-green-600 mt-1">
                {cuentasActivas}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2
                size={23}
                className="text-green-600"
              />
            </div>

          </div>
        </div>

        {/* INACTIVAS */}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Cuentas inactivas
              </p>

              <p className="text-2xl font-bold text-orange-500 mt-1">
                {cuentasInactivas}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertCircle
                size={23}
                className="text-orange-500"
              />
            </div>

          </div>
        </div>

      </div>

      {/* =====================================================
          BUSCADOR
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4">

        <div className="relative max-w-xl">

          <Search
            size={18}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar empresa, nombre o correo..."
            className="
              w-full
              pl-10
              pr-4
              py-3
              border
              border-slate-200
              rounded-xl
              text-sm
              outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-400
            "
          />

        </div>

      </div>

      {/* =====================================================
          TABLA
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        {cargando ? (

          <div className="p-12 text-center text-slate-500">
            Cargando cuentas...
          </div>

        ) : cuentasFiltradas.length === 0 ? (

          <div className="p-12 text-center">

            <Mail
              size={42}
              className="mx-auto text-slate-300 mb-3"
            />

            <p className="text-slate-500">
              No se encontraron cuentas.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 border-b border-slate-200">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Empresa
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Nombre
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Correo
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {cuentasFiltradas.map((cuenta) => (

                  <tr
                    key={cuenta.id}
                    className="hover:bg-slate-50 transition"
                  >

                    {/* EMPRESA */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

                          <Building2
                            size={17}
                            className="text-blue-600"
                          />

                        </div>

                        <span className="font-medium text-slate-700">
                          {cuenta.empresa || "-"}
                        </span>

                      </div>

                    </td>

                    {/* NOMBRE */}

                    <td className="px-6 py-4">

                      <span className="font-semibold text-slate-800">
                        {cuenta.nombre || "-"}
                      </span>

                    </td>

                    {/* CORREO */}

                    <td className="px-6 py-4">

                      {cuenta.correo ? (

                        <div className="flex items-center gap-2">

                          <Mail
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-600">
                            {cuenta.correo}
                          </span>

                        </div>

                      ) : (

                        <span className="text-sm italic text-orange-500">
                          Sin correo
                        </span>

                      )}

                    </td>

                    {/* ESTADO */}

                    <td className="px-6 py-4">

                      {cuenta.activo ? (

                        <span className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          font-medium
                          bg-green-100
                          text-green-700
                        ">
                          <span>●</span>
                          Activa
                        </span>

                      ) : (

                        <span className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          font-medium
                          bg-slate-100
                          text-slate-600
                        ">
                          <span>●</span>
                          Inactiva
                        </span>

                      )}

                    </td>

                    {/* ACCION */}

                    <td className="px-6 py-4 text-right">

                      <button
                        type="button"
                        onClick={() => abrirEditar(cuenta)}
                        className="
                          inline-flex
                          items-center
                          gap-2
                          px-3
                          py-2
                          rounded-lg
                          text-sm
                          font-medium
                          text-blue-600
                          hover:bg-blue-50
                          transition
                        "
                      >

                        <Pencil size={16} />

                        Editar

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          MODAL EDITAR
      ===================================================== */}

      {cuentaEditando && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            p-4
          "
          style={{
            background: "rgba(15, 23, 42, 0.60)",
          }}
          onMouseDown={(e) => {

            if (
              e.target === e.currentTarget &&
              !guardando
            ) {
              cerrarEditar();
            }

          }}
        >

          <div
            className="
              bg-white
              w-full
              max-w-lg
              rounded-2xl
              shadow-2xl
              overflow-hidden
            "
            onMouseDown={(e) => e.stopPropagation()}
          >

            {/* HEADER */}

            <div
              className="
                px-6
                py-5
                flex
                items-center
                justify-between
              "
              style={{
                background: "#345D9D",
              }}
            >

              <div>

                <h2 className="
                  text-lg
                  font-bold
                  text-white
                ">
                  Editar cuenta
                </h2>

                <p className="
                  text-sm
                  text-blue-100
                  mt-1
                ">
                  {cuentaEditando.nombre}
                </p>

              </div>

              <button
                type="button"
                onClick={cerrarEditar}
                disabled={guardando}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-white
                  hover:bg-white/10
                "
              >

                <X size={20} />

              </button>

            </div>

            {/* CUERPO */}

            <div className="p-6 space-y-5">

              {/* EMPRESA */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Empresa
                </label>

                <input
                  type="text"
                  value={formulario.empresa}
                  onChange={(e) =>
                    cambiarCampo(
                      "empresa",
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-slate-200
                    rounded-xl
                    outline-none
                    text-sm
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* NOMBRE */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Nombre
                </label>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    cambiarCampo(
                      "nombre",
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-slate-200
                    rounded-xl
                    outline-none
                    text-sm
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* CORREO */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Correo electrónico
                </label>

                <div className="relative">

                  <Mail
                    size={17}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    value={formulario.correo}
                    onChange={(e) =>
                      cambiarCampo(
                        "correo",
                        e.target.value
                      )
                    }
                    placeholder="correo@empresa.com"
                    className="
                      w-full
                      pl-10
                      pr-4
                      py-3
                      border
                      border-slate-200
                      rounded-xl
                      outline-none
                      text-sm
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />

                </div>

              </div>

              {/* ESTADO */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Estado
                </label>

                <select
                  value={formulario.activo ? "true" : "false"}
                  onChange={(e) =>
                    cambiarCampo(
                      "activo",
                      e.target.value === "true"
                    )
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-slate-200
                    rounded-xl
                    outline-none
                    text-sm
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  <option value="true">
                    Activa
                  </option>

                  <option value="false">
                    Inactiva
                  </option>

                </select>

              </div>

              {/* MENSAJE */}

              {mensaje && (

                <div className="
                  bg-red-50
                  border
                  border-red-200
                  text-red-700
                  text-sm
                  rounded-xl
                  p-3
                ">
                  {mensaje}
                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="
              px-6
              py-4
              bg-slate-50
              border-t
              border-slate-200
              flex
              justify-end
              gap-3
            ">

              <button
                type="button"
                onClick={cerrarEditar}
                disabled={guardando}
                className="
                  px-4
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                  text-slate-600
                  hover:bg-slate-200
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className="
                  flex
                  items-center
                  gap-2
                  px-5
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                  text-white
                "
                style={{
                  background: guardando
                    ? "#94a3b8"
                    : "#345D9D",
                }}
              >

                <Save size={17} />

                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}