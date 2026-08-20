import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Building2,
  MapPin,
  BriefcaseBusiness,
  Mail,
  Pencil,
  X,
  Save,
  UserRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Usuario seleccionado para editar
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    CORREO: "",
    LICENCIA: "",
    ESTADO_CORREO: "",
    OBSERVACIONES: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // =========================================================
  // CARGAR USUARIOS
  // =========================================================

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
      setMensaje("Error al cargar los usuarios.");
      setUsuarios([]);
    } else {
      setUsuarios(data || []);
    }

    setCargando(false);
  };

  // =========================================================
  // ABRIR MODAL DE EDICIÓN
  // =========================================================

  const abrirEditar = (usuario) => {
    setUsuarioEditando(usuario);

    setFormulario({
      CORREO: usuario.CORREO || "",
      LICENCIA: usuario.LICENCIA || "",
      ESTADO_CORREO:
        usuario.ESTADO_CORREO ||
        (usuario.CORREO ? "Activa" : "Pendiente"),
      OBSERVACIONES: usuario.OBSERVACIONES || "",
    });

    setMensaje("");
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const cerrarEditar = () => {
    if (guardando) return;

    setUsuarioEditando(null);

    setFormulario({
      CORREO: "",
      LICENCIA: "",
      ESTADO_CORREO: "",
      OBSERVACIONES: "",
    });

    setMensaje("");
  };

  // =========================================================
  // CAMBIAR FORMULARIO
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // =========================================================
  // GUARDAR CAMBIOS EN SUPABASE
  // =========================================================

  const guardarCambios = async () => {
    if (!usuarioEditando) return;

    setGuardando(true);
    setMensaje("");

    const datosActualizar = {
      CORREO: formulario.CORREO.trim() || null,
      LICENCIA: formulario.LICENCIA.trim() || null,
      ESTADO_CORREO:
        formulario.ESTADO_CORREO || "Pendiente",
      OBSERVACIONES:
        formulario.OBSERVACIONES.trim() || null,
    };

    console.log("Actualizando usuario:", usuarioEditando.id);
    console.log("Datos:", datosActualizar);

    const { data, error } = await supabase
      .from("usuarios_grupo_aurica")
      .update(datosActualizar)
      .eq("id", usuarioEditando.id)
      .select()
      .single();

    if (error) {
      console.error("ERROR SUPABASE:", error);

      setMensaje(
        `Error al guardar: ${error.message}`
      );

      setGuardando(false);
      return;
    }

    console.log("Usuario actualizado:", data);

    // Actualizamos la tarjeta inmediatamente
    setUsuarios((usuariosActuales) =>
      usuariosActuales.map((usuario) =>
        usuario.id === usuarioEditando.id
          ? data
          : usuario
      )
    );

    setGuardando(false);

    // Cerramos modal
    setUsuarioEditando(null);

    setFormulario({
      CORREO: "",
      LICENCIA: "",
      ESTADO_CORREO: "",
      OBSERVACIONES: "",
    });
  };

  // =========================================================
  // FILTRO
  // =========================================================

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return true;

    return (
      String(usuario.EMPRESA || "")
        .toLowerCase()
        .includes(texto) ||

      String(usuario.UBICACION || "")
        .toLowerCase()
        .includes(texto) ||

      String(usuario.USUARIO || "")
        .toLowerCase()
        .includes(texto) ||

      String(usuario.PUESTO || "")
        .toLowerCase()
        .includes(texto) ||

      String(usuario.CORREO || "")
        .toLowerCase()
        .includes(texto)
    );
  });

  // =========================================================
  // ESTADO DEL CORREO
  // =========================================================

  const obtenerEstado = (usuario) => {
    if (usuario.ESTADO_CORREO) {
      return usuario.ESTADO_CORREO;
    }

    if (usuario.CORREO) {
      return "Activa";
    }

    return "Pendiente";
  };

  // =========================================================
  // CONTADORES
  // =========================================================

  const totalUsuarios = usuarios.length;

  const conCorreo = usuarios.filter(
    (usuario) =>
      usuario.CORREO &&
      String(usuario.CORREO).trim() !== ""
  ).length;

  const sinCorreo = totalUsuarios - conCorreo;

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
          Gestión de usuarios y cuentas de correo corporativas
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
                Total de usuarios
              </p>

              <p className="text-2xl font-bold text-slate-800 mt-1">
                {totalUsuarios}
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

        {/* CON CORREO */}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Con correo asignado
              </p>

              <p className="text-2xl font-bold text-green-600 mt-1">
                {conCorreo}
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

        {/* SIN CORREO */}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Sin correo
              </p>

              <p className="text-2xl font-bold text-orange-500 mt-1">
                {sinCorreo}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Buscar usuario, empresa, puesto o correo..."
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
          CARDS
      ===================================================== */}

      {cargando ? (

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

          <div className="animate-pulse text-slate-500">
            Cargando usuarios...
          </div>

        </div>

      ) : usuariosFiltrados.length === 0 ? (

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

          <Users
            size={42}
            className="mx-auto text-slate-300 mb-3"
          />

          <p className="text-slate-500">
            No se encontraron usuarios.
          </p>

        </div>

      ) : (

        /*
         * AQUÍ ESTÁ EL CAMBIO PRINCIPAL:
         *
         * Ya NO usamos <table>.
         *
         * Cada usuario es una CARD.
         */

        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-5
        ">

          {usuariosFiltrados.map((usuario) => {

            const estado = obtenerEstado(usuario);

            return (

              <div
                key={usuario.id}
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-slate-200
                  overflow-hidden
                  hover:shadow-lg
                  hover:-translate-y-0.5
                  transition-all
                  duration-200
                "
              >

                {/* BARRA SUPERIOR */}

                <div
                  className="h-1.5"
                  style={{
                    background: "#345D9D",
                  }}
                />

                <div className="p-5">

                  {/* =================================================
                      CABECERA
                  ================================================= */}

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      {/* ICONO PERFIL */}

                      <div
                        className="
                          w-12
                          h-12
                          rounded-full
                          flex
                          items-center
                          justify-center
                          flex-shrink-0
                        "
                        style={{
                          background: "#eef4ff",
                          color: "#345D9D",
                        }}
                      >

                        <UserRound
                          size={24}
                          strokeWidth={1.8}
                        />

                      </div>

                      {/* NOMBRE */}

                      <div className="min-w-0">

                        <h3 className="
                          font-semibold
                          text-slate-800
                          truncate
                        ">
                          {usuario.USUARIO ||
                            "Sin nombre"}
                        </h3>

                        <p className="
                          text-xs
                          text-slate-500
                          mt-0.5
                        ">
                          {usuario.EMPRESA ||
                            "Sin empresa"}
                        </p>

                      </div>

                    </div>

                    {/* BOTON EDITAR */}

                    <button
                      type="button"
                      onClick={() =>
                        abrirEditar(usuario)
                      }
                      className="
                        w-9
                        h-9
                        rounded-lg
                        flex
                        items-center
                        justify-center
                        text-slate-400
                        hover:text-blue-600
                        hover:bg-blue-50
                        transition
                        flex-shrink-0
                      "
                      title="Editar cuenta"
                    >

                      <Pencil size={17} />

                    </button>

                  </div>

                  {/* =================================================
                      INFORMACION
                  ================================================= */}

                  <div className="mt-5 space-y-4">

                    {/* PUESTO */}

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">

                        <BriefcaseBusiness
                          size={16}
                          className="text-slate-500"
                        />

                      </div>

                      <div className="min-w-0">

                        <p className="text-xs text-slate-400">
                          Puesto
                        </p>

                        <p className="
                          text-sm
                          text-slate-700
                          mt-0.5
                          truncate
                        ">
                          {usuario.PUESTO ||
                            "Sin puesto"}
                        </p>

                      </div>

                    </div>

                    {/* UBICACION */}

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">

                        <MapPin
                          size={16}
                          className="text-slate-500"
                        />

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Ubicación
                        </p>

                        <p className="text-sm text-slate-700 mt-0.5">
                          {usuario.UBICACION ||
                            "Sin ubicación"}
                        </p>

                      </div>

                    </div>

                    {/* CORREO */}

                    <div className="flex gap-3">

                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">

                        <Mail
                          size={16}
                          className="text-slate-500"
                        />

                      </div>

                      <div className="min-w-0">

                        <p className="text-xs text-slate-400">
                          Correo
                        </p>

                        {usuario.CORREO ? (

                          <p className="
                            text-sm
                            text-slate-700
                            mt-0.5
                            break-all
                          ">
                            {usuario.CORREO}
                          </p>

                        ) : (

                          <p className="
                            text-sm
                            text-orange-500
                            italic
                            mt-0.5
                          ">
                            Sin asignar
                          </p>

                        )}

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      PIE DE CARD
                  ================================================= */}

                  <div className="
                    mt-5
                    pt-4
                    border-t
                    border-slate-100
                    flex
                    items-center
                    justify-between
                  ">

                    {/* ESTADO */}

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        px-3
                        py-1.5
                        rounded-full
                        text-xs
                        font-medium
                        ${
                          estado === "Activa"
                            ? "bg-green-100 text-green-700"
                            : estado === "Bloqueada"
                            ? "bg-red-100 text-red-700"
                            : estado === "Desactivada"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-orange-100 text-orange-700"
                        }
                      `}
                    >

                      <span className="text-[10px]">
                        ●
                      </span>

                      {estado}

                    </span>

                    {/* EDITAR */}

                    <button
                      type="button"
                      onClick={() =>
                        abrirEditar(usuario)
                      }
                      className="
                        text-sm
                        font-medium
                        text-blue-600
                        hover:text-blue-800
                      "
                    >
                      Editar
                    </button>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      )}

      {/* =========================================================
          MODAL DE EDICION
      ========================================================= */}

      {usuarioEditando && (

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
            background:
              "rgba(15, 23, 42, 0.60)",
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
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                HEADER MODAL
            ================================================= */}

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
                  Editar cuenta de correo
                </h2>

                <p className="
                  text-sm
                  text-blue-100
                  mt-1
                ">
                  {usuarioEditando.USUARIO}
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

            {/* =================================================
                CUERPO
            ================================================= */}

            <div className="p-6 space-y-5">

              {/* INFORMACION DEL USUARIO */}

              <div className="
                bg-slate-50
                rounded-xl
                p-4
              ">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-full
                      flex
                      items-center
                      justify-center
                    "
                    style={{
                      background: "#dbeafe",
                      color: "#345D9D",
                    }}
                  >

                    <UserRound size={21} />

                  </div>

                  <div>

                    <p className="
                      font-semibold
                      text-slate-800
                    ">
                      {usuarioEditando.USUARIO}
                    </p>

                    <p className="
                      text-xs
                      text-slate-500
                      mt-0.5
                    ">
                      {usuarioEditando.EMPRESA ||
                        "Sin empresa"}
                    </p>

                  </div>

                </div>

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
                    value={formulario.CORREO}
                    onChange={(e) =>
                      cambiarCampo(
                        "CORREO",
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

              {/* LICENCIA */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Licencia
                </label>

                <select
                  value={formulario.LICENCIA}
                  onChange={(e) =>
                    cambiarCampo(
                      "LICENCIA",
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
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  <option value="">
                    Sin licencia registrada
                  </option>

                  <option value="Microsoft 365 Business Basic">
                    Microsoft 365 Business Basic
                  </option>

                  <option value="Microsoft 365 Business Standard">
                    Microsoft 365 Business Standard
                  </option>

                  <option value="Microsoft 365 Business Premium">
                    Microsoft 365 Business Premium
                  </option>

                  <option value="Microsoft 365 E3">
                    Microsoft 365 E3
                  </option>

                  <option value="Microsoft 365 E5">
                    Microsoft 365 E5
                  </option>

                </select>

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
                  value={formulario.ESTADO_CORREO}
                  onChange={(e) =>
                    cambiarCampo(
                      "ESTADO_CORREO",
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
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                  "
                >

                  <option value="Pendiente">
                    Pendiente
                  </option>

                  <option value="Activa">
                    Activa
                  </option>

                  <option value="Bloqueada">
                    Bloqueada
                  </option>

                  <option value="Desactivada">
                    Desactivada
                  </option>

                </select>

              </div>

              {/* OBSERVACIONES */}

              <div>

                <label className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  mb-2
                ">
                  Observaciones
                </label>

                <textarea
                  value={formulario.OBSERVACIONES}
                  onChange={(e) =>
                    cambiarCampo(
                      "OBSERVACIONES",
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Agregar observaciones..."
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-slate-200
                    rounded-xl
                    outline-none
                    text-sm
                    resize-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />

              </div>

              {/* ERROR */}

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

            {/* =================================================
                FOOTER
            ================================================= */}

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
                  transition
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
                  transition
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