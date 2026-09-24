import {
  useMemo,
  useState,
} from "react";

import {
  useMsal,
} from "@azure/msal-react";

import {
  InteractionStatus,
} from "@azure/msal-browser";

import {
  loginRequest,
} from "../Config/authConfig";

import {
  Cloud,
  Users,
  KeyRound,
  Package,
  AppWindow,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Mail,
  Building2,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

// =============================================================
// CONFIGURACIÓN
// =============================================================

const EDGE_FUNCTION_URL =
  "https://kugmjzhaxdzyuizjtvjh.supabase.co/functions/v1/sync-microsoft365";

// =============================================================
// COMPONENTE PRINCIPAL
// =============================================================

export default function Microsoft365() {

  // ===========================================================
  // MICROSOFT MSAL
  // ===========================================================

  const {
    instance,
    accounts,
    inProgress,
  } = useMsal();

  // ===========================================================
  // ESTADOS
  // ===========================================================

  const [
    activeTab,
    setActiveTab,
  ] = useState("usuarios");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    empresa,
    setEmpresa,
  ] = useState("Todas");

  const [
    estado,
    setEstado,
  ] = useState("Todos");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    usuarios,
    setUsuarios,
  ] = useState([]);

  const [
    licencias,
    setLicencias,
  ] = useState([]);

  const [
    resumen,
    setResumen,
  ] = useState({
    totalUsuarios: 0,
    usuariosConLicencia: 0,
    totalUsuariosSinLicencia: 0,
    totalAsignaciones: 0,
    totalTiposLicencia: 0,
  });

  const [
    ultimaSincronizacion,
    setUltimaSincronizacion,
  ] = useState(null);

  const [
    errorMicrosoft,
    setErrorMicrosoft,
  ] = useState("");

  const [
    sincronizado,
    setSincronizado,
  ] = useState(false);

  // ===========================================================
  // EMPRESAS DINÁMICAS
  // ===========================================================

  const empresas = useMemo(() => {

    const lista = usuarios
      .map(
        (usuario) =>
          usuario.empresa
      )
      .filter(Boolean)
      .filter(
        (valor) =>
          valor !== "—"
      );

    return [
      ...new Set(lista),
    ].sort();

  }, [usuarios]);

  // ===========================================================
  // FILTRO DE USUARIOS
  // ===========================================================

  const usuariosFiltrados =
    useMemo(() => {

      return usuarios.filter(
        (usuario) => {

          const texto =
            busqueda
              .trim()
              .toLowerCase();

          const nombre =
            String(
              usuario.nombre || ""
            ).toLowerCase();

          const correo =
            String(
              usuario.correo || ""
            ).toLowerCase();

          const licenciaTexto =
            String(
              usuario.licencia || ""
            ).toLowerCase();

          const coincideBusqueda =
            !texto ||
            nombre.includes(texto) ||
            correo.includes(texto) ||
            licenciaTexto.includes(texto);

          const coincideEmpresa =
            empresa === "Todas" ||
            usuario.empresa === empresa;

          const coincideEstado =
            estado === "Todos" ||
            usuario.estado === estado;

          return (
            coincideBusqueda &&
            coincideEmpresa &&
            coincideEstado
          );
        }
      );

    }, [
      usuarios,
      busqueda,
      empresa,
      estado,
    ]);

  // ===========================================================
  // SINCRONIZAR CON MICROSOFT 365
  // ===========================================================

  const sincronizar =
    async () => {

      setLoading(true);
      setErrorMicrosoft("");

      try {

        // -----------------------------------------------------
        // VERIFICAR SESIÓN
        // -----------------------------------------------------

        if (
          !accounts ||
          accounts.length === 0
        ) {

          throw new Error(
            "No hay una sesión activa de Microsoft 365."
          );

        }

        if (
          inProgress !==
          InteractionStatus.None
        ) {

          throw new Error(
            "Microsoft todavía está procesando una operación de inicio de sesión."
          );

        }

        // -----------------------------------------------------
        // OBTENER TOKEN DE MICROSOFT
        // -----------------------------------------------------

        const tokenResponse =
          await instance.acquireTokenSilent(
            {
              account: accounts[0],

              scopes:
                loginRequest.scopes ||
                ["User.Read"],
            }
          );

        const accessToken =
          tokenResponse.accessToken;

        if (!accessToken) {
          throw new Error(
            "No se pudo obtener el token de Microsoft."
          );
        }

        // -----------------------------------------------------
        // LLAMAR A EDGE FUNCTION
        // -----------------------------------------------------

        const response =
          await fetch(
            EDGE_FUNCTION_URL,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },
            }
          );

        // -----------------------------------------------------
        // LEER RESPUESTA
        // -----------------------------------------------------

        const data =
          await response.json();

        // -----------------------------------------------------
        // VALIDAR RESPUESTA
        // -----------------------------------------------------

        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data?.error ||
              `Error al consultar Microsoft 365. Código: ${response.status}`
          );

        }

        // =====================================================
        // FORMATEAR LICENCIAS
        // =====================================================

        const licenciasFormateadas =
          (data.licencias || []).map(
            (licencia, index) => {

              const total =
                Number(
                  licencia.capacidad ??
                    licencia.total ??
                    0
                );

              const asignadas =
                Number(
                  licencia.asignadas ??
                    0
                );

              const disponibles =
                Number(
                  licencia.disponibles ??
                    Math.max(
                      total -
                        asignadas,
                      0
                    )
                );

              let estadoLicencia =
                "Completa";

              if (
                total === 0
              ) {

                estadoLicencia =
                  "Sin capacidad";

              } else if (
                disponibles > 0
              ) {

                estadoLicencia =
                  "Disponible";

              }

              return {

                id:
                  licencia.id ||
                  licencia.skuId ||
                  index,

                skuId:
                  licencia.skuId ||
                  "",

                skuPartNumber:
                  licencia.skuPartNumber ||
                  "",

                nombre:
                  licencia.nombre ||
                  licencia.skuPartNumber ||
                  "Licencia Microsoft 365",

                categoria:
                  licencia.categoria ||
                  "Otros",

                asignadas,

                disponibles,

                total,

                estado:
                  estadoLicencia,

                suspendidas:
                  Number(
                    licencia.suspendidas ||
                      0
                  ),

                warning:
                  Number(
                    licencia.warning ||
                      0
                  ),
              };

            }
          );

        // =====================================================
        // FORMATEAR USUARIOS
        // =====================================================

        const usuariosFormateados =
          (data.usuarios || []).map(
            (usuario) => {

              const listaLicencias =
                Array.isArray(
                  usuario.licencias
                )
                  ? usuario.licencias
                  : [];

              const nombresLicencias =
                listaLicencias
                  .map(
                    (licencia) =>
                      licencia.nombre ||
                      licencia.skuPartNumber ||
                      "Licencia"
                  );

              return {

                id:
                  usuario.id,

                nombre:
                  usuario.nombre ||
                  "Sin nombre",

                correo:
                  usuario.correo ||
                  usuario.userPrincipalName ||
                  "Sin correo",

                empresa:
                  usuario.empresa ||
                  usuario.companyName ||
                  "—",

                estado:
                  usuario.estado ||
                  (
                    usuario.habilitado ===
                    false
                      ? "Bloqueado"
                      : "Activo"
                  ),

                tipo:
                  usuario.tipo ||
                  "Member",

                // Texto para búsqueda
                licencia:
                  nombresLicencias.length >
                  0
                    ? nombresLicencias.join(
                        ", "
                      )
                    : "Sin licencia",

                // Array real para mostrar
                licencias:
                  listaLicencias,

                cantidadLicencias:
                  listaLicencias.length,
              };

            }
          );

        // =====================================================
        // GUARDAR DATOS
        // =====================================================

        setLicencias(
          licenciasFormateadas
        );

        setUsuarios(
          usuariosFormateados
        );

        // -----------------------------------------------------
        // RESUMEN
        // -----------------------------------------------------

        const resumenServidor =
          data.resumen || {};

        setResumen({

          totalUsuarios:
            Number(
              resumenServidor.totalUsuarios ??
                usuariosFormateados.length
            ),

          usuariosConLicencia:
            Number(
              resumenServidor.usuariosConLicencia ??
                usuariosFormateados.filter(
                  (usuario) =>
                    usuario.cantidadLicencias >
                    0
                ).length
            ),

          totalUsuariosSinLicencia:
            Number(
              resumenServidor.totalUsuariosSinLicencia ??
                usuariosFormateados.filter(
                  (usuario) =>
                    usuario.cantidadLicencias ===
                    0
                ).length
            ),

          totalAsignaciones:
            Number(
              resumenServidor.totalAsignaciones ??
                usuariosFormateados.reduce(
                  (
                    total,
                    usuario
                  ) =>
                    total +
                    Number(
                      usuario.cantidadLicencias ||
                        0
                    ),
                  0
                )
            ),

          totalTiposLicencia:
            Number(
              resumenServidor.totalTiposLicencia ??
                licenciasFormateadas.length
            ),
        });

        // -----------------------------------------------------
        // FECHA
        // -----------------------------------------------------

        setUltimaSincronizacion(
          new Date()
        );

        setSincronizado(
          true
        );

      } catch (error) {

        console.error(
          "Error sincronizando Microsoft 365:",
          error
        );

        setSincronizado(
          false
        );

        setErrorMicrosoft(
          error?.message ||
            "Ocurrió un error al sincronizar Microsoft 365."
        );

      } finally {

        setLoading(false);

      }

    };

  // ===========================================================
  // TABS
  // ===========================================================

  const tabs = [

    {
      id: "usuarios",
      label: "Usuarios",
      icon: Users,
    },

    {
      id: "licencias",
      label: "Licencias",
      icon: KeyRound,
    },

    {
      id: "suscripciones",
      label: "Suscripciones",
      icon: Package,
    },

    {
      id: "aplicaciones",
      label: "Aplicaciones",
      icon: AppWindow,
    },

  ];

  // ===========================================================
  // RENDER
  // ===========================================================

  return (

    <div className="w-full min-h-full">

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="mb-5">

        <div className="flex items-center justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Microsoft 365
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Administración y consulta del tenant de Microsoft 365
            </p>

          </div>

          <button
            onClick={sincronizar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3763a5] text-white text-sm font-semibold hover:bg-[#2f5792] disabled:opacity-60 transition"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {loading
              ? "Sincronizando..."
              : "Sincronizar"}

          </button>

        </div>

      </div>

      {/* =====================================================
          ESTADO DE CONEXIÓN
      ===================================================== */}

      <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">

            <Cloud
              size={19}
              className="text-green-600"
            />

          </div>

          <div>

            <p className="text-sm font-semibold text-slate-800">
              Microsoft 365
            </p>

            <p className="text-xs text-slate-500">

              {sincronizado
                ? "Datos obtenidos desde Microsoft Graph"
                : "Listo para sincronizar con Microsoft Graph"}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-green-700">

          <CheckCircle2
            size={16}
          />

          {sincronizado
            ? "Sincronizado"
            : "Conexión preparada"}

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMicrosoft && (

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle
            size={18}
          />

          <span>
            {errorMicrosoft}
          </span>

        </div>

      )}

      {/* =====================================================
          KPIs
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <StatCard
          icon={Users}
          title="Usuarios"
          value={
            sincronizado
              ? resumen.totalUsuarios
              : "—"
          }
          detail={
            sincronizado
              ? `${resumen.usuariosConLicencia} con licencia`
              : "Sincroniza para consultar"
          }
        />

        <StatCard
          icon={KeyRound}
          title="Asignaciones"
          value={
            sincronizado
              ? resumen.totalAsignaciones
              : "—"
          }
          detail={
            sincronizado
              ? "Licencias asignadas a usuarios"
              : "Sincroniza para consultar"
          }
        />

        <StatCard
          icon={Package}
          title="Tipos de licencia"
          value={
            sincronizado
              ? resumen.totalTiposLicencia
              : "—"
          }
          detail={
            sincronizado
              ? "SKU encontradas en el tenant"
              : "Sincroniza para consultar"
          }
        />

        <StatCard
          icon={AppWindow}
          title="Aplicaciones"
          value="—"
          detail="Próxima integración con Graph"
        />

      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

        {/* TABS */}

        <div className="border-b border-slate-200 px-4 pt-4">

          <div className="flex gap-2 overflow-x-auto">

            {tabs.map(
              (tab) => {

                const Icon =
                  tab.icon;

                const active =
                  activeTab ===
                  tab.id;

                return (

                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold whitespace-nowrap transition ${
                      active
                        ? "bg-[#3763a5] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >

                    <Icon
                      size={16}
                    />

                    {tab.label}

                  </button>

                );

              }
            )}

          </div>

        </div>

        {/* ===================================================
            USUARIOS
        =================================================== */}

        {activeTab ===
          "usuarios" && (

          <div className="p-4">

            {/* FILTROS */}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_170px] gap-3 mb-4">

              <div className="relative">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  placeholder="Buscar usuario, correo o licencia..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] focus:ring-2 focus:ring-blue-100 text-sm"
                />

              </div>

              <select
                value={empresa}
                onChange={(e) =>
                  setEmpresa(
                    e.target.value
                  )
                }
                className="h-11 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] text-sm bg-white"
              >

                <option value="Todas">
                  Todas las empresas
                </option>

                {empresas.map(
                  (nombreEmpresa) => (

                    <option
                      key={
                        nombreEmpresa
                      }
                      value={
                        nombreEmpresa
                      }
                    >
                      {nombreEmpresa}
                    </option>

                  )
                )}

              </select>

              <select
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value
                  )
                }
                className="h-11 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] text-sm bg-white"
              >

                <option value="Todos">
                  Todos los estados
                </option>

                <option value="Activo">
                  Activos
                </option>

                <option value="Bloqueado">
                  Bloqueados
                </option>

              </select>

            </div>

            {/* TABLA */}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">

              <table className="w-full text-sm">

                <thead className="bg-blue-50">

                  <tr className="text-left text-[#3763a5]">

                    <th className="px-4 py-3 font-bold">
                      Usuario
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Empresa
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Licencias
                    </th>

                    <th className="px-4 py-3 font-bold">
                      Estado
                    </th>

                    <th className="px-4 py-3 font-bold text-right">
                      Detalle
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {usuariosFiltrados.length >
                  0 ? (

                    usuariosFiltrados.map(
                      (usuario) => (

                        <tr
                          key={
                            usuario.id
                          }
                          className="border-t border-slate-100 hover:bg-slate-50 transition"
                        >

                          {/* USUARIO */}

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-3">

                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">

                                <Users
                                  size={17}
                                  className="text-[#3763a5]"
                                />

                              </div>

                              <div>

                                <p className="font-semibold text-slate-800">

                                  {
                                    usuario.nombre
                                  }

                                </p>

                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">

                                  <Mail
                                    size={12}
                                  />

                                  {
                                    usuario.correo
                                  }

                                </p>

                              </div>

                            </div>

                          </td>

                          {/* EMPRESA */}

                          <td className="px-4 py-4 text-slate-700">

                            <span className="flex items-center gap-1.5">

                              <Building2
                                size={14}
                                className="text-slate-400"
                              />

                              {
                                usuario.empresa ||
                                "—"
                              }

                            </span>

                          </td>

                          {/* LICENCIAS */}

                          <td className="px-4 py-4">

                            <div className="flex flex-wrap gap-1.5">

                              {usuario.licencias &&
                              usuario.licencias.length >
                                0 ? (

                                usuario.licencias.map(
                                  (
                                    licencia,
                                    index
                                  ) => (

                                    <span
                                      key={
                                        licencia.skuId ||
                                        index
                                      }
                                      className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                                      title={
                                        licencia.categoria ||
                                        ""
                                      }
                                    >

                                      {
                                        licencia.nombre ||
                                        licencia.skuPartNumber ||
                                        "Licencia"
                                      }

                                    </span>

                                  )
                                )

                              ) : (

                                <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">

                                  Sin licencia

                                </span>

                              )}

                            </div>

                          </td>

                          {/* ESTADO */}

                          <td className="px-4 py-4">

                            {usuario.estado ===
                            "Activo" ? (

                              <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold text-xs">

                                <CheckCircle2
                                  size={15}
                                />

                                Activo

                              </span>

                            ) : (

                              <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold text-xs">

                                <XCircle
                                  size={15}
                                />

                                Bloqueado

                              </span>

                            )}

                          </td>

                          {/* DETALLE */}

                          <td className="px-4 py-4 text-right">

                            <button
                              onClick={() =>
                                setSelectedUser(
                                  usuario
                                )
                              }
                              className="inline-flex items-center gap-1 text-[#3763a5] hover:underline font-semibold text-xs"
                            >

                              Ver detalle

                              <ChevronRight
                                size={14}
                              />

                            </button>

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="5"
                        className="px-4 py-12 text-center text-slate-500"
                      >

                        {sincronizado
                          ? "No se encontraron usuarios con los filtros seleccionados."
                          : 'Pulsa "Sincronizar" para cargar los usuarios reales del tenant.'}

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            {/* PIE */}

            <div className="flex items-center justify-between mt-4 text-xs text-slate-500">

              <span>

                Mostrando{" "}
                <strong>
                  {
                    usuariosFiltrados.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {usuarios.length}
                </strong>{" "}
                usuarios

              </span>

              <span className="flex items-center gap-1.5">

                <CalendarDays
                  size={14}
                />

                Última sincronización:{" "}

                {ultimaSincronizacion
                  ? ultimaSincronizacion.toLocaleString()
                  : "—"}

              </span>

            </div>

          </div>

        )}

        {/* ===================================================
            LICENCIAS
        =================================================== */}

        {activeTab ===
          "licencias" && (

          <div className="p-4">

            {licencias.length ===
            0 ? (

              <div className="min-h-[280px] flex flex-col items-center justify-center text-center">

                <KeyRound
                  size={42}
                  className="text-slate-300"
                />

                <h3 className="font-bold text-slate-800 mt-4">
                  No hay datos sincronizados
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Pulsa "Sincronizar" para consultar
                  las licencias de Microsoft 365.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

                {licencias.map(
                  (licencia) => {

                    const porcentaje =
                      licencia.total >
                      0
                        ? Math.round(
                            (
                              licencia.asignadas /
                              licencia.total
                            ) *
                              100
                          )
                        : 0;

                    return (

                      <div
                        key={
                          licencia.id
                        }
                        className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

                              <KeyRound
                                size={19}
                                className="text-[#3763a5]"
                              />

                            </div>

                            <p className="text-[11px] text-slate-400 font-semibold mt-3 uppercase">

                              {
                                licencia.categoria ||
                                "Otros"
                              }

                            </p>

                          </div>

                          <span
                            className={`text-xs font-semibold ${
                              licencia.estado ===
                              "Disponible"
                                ? "text-green-600"
                                : licencia.estado ===
                                  "Completa"
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >

                            {
                              licencia.estado
                            }

                          </span>

                        </div>

                        <h3 className="font-bold text-slate-800 mt-3">

                          {
                            licencia.nombre
                          }

                        </h3>

                        <p className="text-[11px] text-slate-400 mt-1 break-all">

                          {
                            licencia.skuPartNumber
                          }

                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-5">

                          <MiniStat
                            label="Total"
                            value={
                              licencia.total
                            }
                          />

                          <MiniStat
                            label="Asignadas"
                            value={
                              licencia.asignadas
                            }
                          />

                          <MiniStat
                            label="Disponibles"
                            value={
                              licencia.disponibles
                            }
                          />

                        </div>

                        <div className="mt-5">

                          <div className="flex justify-between text-xs text-slate-500 mb-2">

                            <span>
                              Uso
                            </span>

                            <span>
                              {
                                Math.min(
                                  porcentaje,
                                  100
                                )
                              }
                              %
                            </span>

                          </div>

                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                            <div
                              className="h-full bg-[#3763a5] rounded-full"
                              style={{
                                width:
                                  `${Math.min(
                                    porcentaje,
                                    100
                                  )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </div>

        )}

        {/* ===================================================
            SUSCRIPCIONES
        =================================================== */}

        {activeTab ===
          "suscripciones" && (

          <EmptyModule
            icon={Package}
            title="Suscripciones"
            description="Aquí mostraremos las suscripciones contratadas en el tenant."
          />

        )}

        {/* ===================================================
            APLICACIONES
        =================================================== */}

        {activeTab ===
          "aplicaciones" && (

          <EmptyModule
            icon={AppWindow}
            title="Aplicaciones"
            description="Aquí mostraremos las aplicaciones y servicios empresariales."
          />

        )}

      </div>

      {/* =====================================================
          MODAL DETALLE
      ===================================================== */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() =>
            setSelectedUser(
              null
            )
          }
        >

          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CABECERA */}

            <div className="bg-[#3763a5] text-white p-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">

                  <Users
                    size={21}
                  />

                </div>

                <div>

                  <h2 className="font-bold text-lg">

                    {
                      selectedUser.nombre
                    }

                  </h2>

                  <p className="text-blue-100 text-sm">

                    Usuario de Microsoft 365

                  </p>

                </div>

              </div>

            </div>

            {/* CONTENIDO */}

            <div className="p-5 space-y-5">

              <DetailRow
                icon={Mail}
                label="Correo"
                value={
                  selectedUser.correo
                }
              />

              <DetailRow
                icon={Building2}
                label="Empresa"
                value={
                  selectedUser.empresa ||
                  "—"
                }
              />

              <DetailRow
                icon={ShieldCheck}
                label="Tipo"
                value={
                  selectedUser.tipo ||
                  "Member"
                }
              />

              <DetailRow
                icon={
                  selectedUser.estado ===
                  "Activo"
                    ? CheckCircle2
                    : AlertCircle
                }
                label="Estado"
                value={
                  selectedUser.estado
                }
              />

              {/* LICENCIAS */}

              <div>

                <p className="text-xs text-slate-500 mb-2">
                  Licencias asignadas
                </p>

                {selectedUser.licencias &&
                selectedUser.licencias.length >
                  0 ? (

                  <div className="flex flex-wrap gap-2">

                    {selectedUser.licencias.map(
                      (
                        licencia,
                        index
                      ) => (

                        <span
                          key={
                            licencia.skuId ||
                            index
                          }
                          className="inline-flex px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"
                        >

                          {
                            licencia.nombre ||
                            licencia.skuPartNumber ||
                            "Licencia"
                          }

                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold">

                    Sin licencia asignada

                  </span>

                )}

              </div>

              <button
                onClick={() =>
                  setSelectedUser(
                    null
                  )
                }
                className="w-full mt-2 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
              >

                Cerrar

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}

// =============================================================
// COMPONENTE KPI
// =============================================================

function StatCard({
  icon: Icon,
  title,
  value,
  detail,
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">

          <Icon
            size={19}
            className="text-[#3763a5]"
          />

        </div>

        <span className="text-2xl font-bold text-slate-800">

          {value}

        </span>

      </div>

      <p className="font-semibold text-slate-700 mt-3">

        {title}

      </p>

      <p className="text-xs text-slate-500 mt-1">

        {detail}

      </p>

    </div>

  );
}

// =============================================================
// MINI STAT
// =============================================================

function MiniStat({
  label,
  value,
}) {

  return (

    <div className="bg-slate-50 rounded-lg p-3">

      <p className="text-[11px] text-slate-500">

        {label}

      </p>

      <p className="font-bold text-slate-800 mt-1">

        {value}

      </p>

    </div>

  );
}

// =============================================================
// DETAIL ROW
// =============================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}) {

  return (

    <div className="flex items-center gap-3">

      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">

        <Icon
          size={16}
          className="text-[#3763a5]"
        />

      </div>

      <div>

        <p className="text-xs text-slate-500">

          {label}

        </p>

        <p className="text-sm font-semibold text-slate-800">

          {value}

        </p>

      </div>

    </div>

  );
}

// =============================================================
// EMPTY MODULE
// =============================================================

function EmptyModule({
  icon: Icon,
  title,
  description,
}) {

  return (

    <div className="p-12 text-center">

      <div className="w-14 h-14 mx-auto rounded-xl bg-blue-50 flex items-center justify-center">

        <Icon
          size={25}
          className="text-[#3763a5]"
        />

      </div>

      <h3 className="font-bold text-slate-800 mt-4">

        {title}

      </h3>

      <p className="text-sm text-slate-500 mt-1">

        {description}

      </p>

    </div>

  );
}