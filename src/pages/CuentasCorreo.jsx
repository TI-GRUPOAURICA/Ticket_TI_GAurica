import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
  ShieldCheck,
  CalendarDays,
  X,
  Save,
  KeyRound,
  SlidersHorizontal,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [cuentas, setCuentas] = useState([]);
  const [licencias, setLicencias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  // Filtros
  const [filtroTipoLicencia, setFiltroTipoLicencia] = useState("todas");
  const [filtroEstadoCuenta, setFiltroEstadoCuenta] = useState("todas");
  const [filtroEstadoLicencia, setFiltroEstadoLicencia] = useState("todas");

  // Modal cuenta
  const [modalCuenta, setModalCuenta] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState(null);

  const [formCuenta, setFormCuenta] = useState({
    empresa: "",
    nombre: "",
    correo: "",
    activo: true,
  });

  // Modal licencia
  const [modalLicencia, setModalLicencia] = useState(false);
  const [licenciaEditando, setLicenciaEditando] = useState(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  const [formLicencia, setFormLicencia] = useState({
    tipo_licencia: "",
    fecha_compra: "",
    fecha_expira: "",
  });

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);

      const [cuentasRes, licenciasRes] = await Promise.all([
        supabase
          .from("cuentas_correo")
          .select("*")
          .order("nombre", { ascending: true }),

        supabase
          .from("licencias_correo")
          .select("*")
          .order("fecha_expira", { ascending: true }),
      ]);

      if (cuentasRes.error) throw cuentasRes.error;
      if (licenciasRes.error) throw licenciasRes.error;

      setCuentas(cuentasRes.data || []);
      setLicencias(licenciasRes.data || []);
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      alert("No se pudieron cargar las cuentas.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LICENCIAS - HELPERS
  // =========================================================

  function obtenerLicencias(cuentaId) {
    return licencias.filter(
      (licencia) => licencia.cuenta_id === cuentaId
    );
  }

  // Devuelve: "vigente" | "por_vencer" | "vencida" | "sin_licencia"
  // para el PEOR estado entre todas las licencias de la cuenta
  // (si tiene alguna vencida, se considera "vencida"; si no,
  // si tiene alguna por vencer, se considera "por_vencer"; etc.)
  function estadoGeneralLicenciasCuenta(cuentaId) {
    const licenciasCuenta = obtenerLicencias(cuentaId);

    if (licenciasCuenta.length === 0) {
      return "sin_licencia";
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let tieneVencida = false;
    let tienePorVencer = false;
    let tieneVigente = false;

    licenciasCuenta.forEach((licencia) => {
      if (!licencia.fecha_expira) {
        tieneVigente = true;
        return;
      }

      const vencimiento = new Date(`${licencia.fecha_expira}T00:00:00`);
      const diferencia = Math.ceil(
        (vencimiento - hoy) / (1000 * 60 * 60 * 24)
      );

      if (diferencia < 0) {
        tieneVencida = true;
      } else if (diferencia <= 30) {
        tienePorVencer = true;
      } else {
        tieneVigente = true;
      }
    });

    if (tieneVencida) return "vencida";
    if (tienePorVencer) return "por_vencer";
    if (tieneVigente) return "vigente";

    return "sin_licencia";
  }

  // =========================================================
  // LISTAS ÚNICAS PARA FILTROS
  // =========================================================

  const tiposLicenciaUnicos = useMemo(() => {
    const set = new Set(
      licencias.map((l) => l.tipo_licencia).filter(Boolean)
    );
    return [...set].sort();
  }, [licencias]);

  // =========================================================
  // FILTRO
  // =========================================================

  const cuentasFiltradas = useMemo(() => {
    const texto = search.toLowerCase().trim();

    return cuentas.filter((cuenta) => {
      const coincideTexto =
        !texto ||
        [cuenta.empresa, cuenta.nombre, cuenta.correo]
          .filter(Boolean)
          .some((valor) => valor.toLowerCase().includes(texto));

      const coincideEstadoCuenta =
        filtroEstadoCuenta === "todas" ||
        (filtroEstadoCuenta === "activas" && cuenta.activo) ||
        (filtroEstadoCuenta === "inactivas" && !cuenta.activo);

      const licenciasCuenta = obtenerLicencias(cuenta.id);

      const coincideTipoLicencia =
        filtroTipoLicencia === "todas" ||
        licenciasCuenta.some(
          (l) => l.tipo_licencia === filtroTipoLicencia
        );

      const coincideEstadoLicencia =
        filtroEstadoLicencia === "todas" ||
        estadoGeneralLicenciasCuenta(cuenta.id) === filtroEstadoLicencia;

      return (
        coincideTexto &&
        coincideEstadoCuenta &&
        coincideTipoLicencia &&
        coincideEstadoLicencia
      );
    });
  }, [
    cuentas,
    licencias,
    search,
    filtroEstadoCuenta,
    filtroTipoLicencia,
    filtroEstadoLicencia,
  ]);

  const hayFiltrosActivos =
    filtroTipoLicencia !== "todas" ||
    filtroEstadoCuenta !== "todas" ||
    filtroEstadoLicencia !== "todas";

  function limpiarFiltros() {
    setFiltroTipoLicencia("todas");
    setFiltroEstadoCuenta("todas");
    setFiltroEstadoLicencia("todas");
  }

  // =========================================================
  // ESTADISTICAS
  // =========================================================

  const totalCuentas = cuentas.length;

  const cuentasActivas = cuentas.filter(
    (cuenta) => cuenta.activo
  ).length;

  const cuentasInactivas = cuentas.filter(
    (cuenta) => !cuenta.activo
  ).length;

  // =========================================================
  // CUENTAS
  // =========================================================

  function abrirNuevaCuenta() {
    setCuentaEditando(null);

    setFormCuenta({
      empresa: "",
      nombre: "",
      correo: "",
      activo: true,
    });

    setModalCuenta(true);
  }

  function abrirEditarCuenta(cuenta) {
    setCuentaEditando(cuenta);

    setFormCuenta({
      empresa: cuenta.empresa || "",
      nombre: cuenta.nombre || "",
      correo: cuenta.correo || "",
      activo: cuenta.activo ?? true,
    });

    setModalCuenta(true);
  }

  async function guardarCuenta(e) {
    e.preventDefault();

    if (
      !formCuenta.empresa ||
      !formCuenta.nombre ||
      !formCuenta.correo
    ) {
      alert("Completa empresa, nombre y correo.");
      return;
    }

    try {
      setSaving(true);

      if (cuentaEditando) {
        const { data, error } = await supabase
          .from("cuentas_correo")
          .update({
            empresa: formCuenta.empresa,
            nombre: formCuenta.nombre,
            correo: formCuenta.correo,
            activo: formCuenta.activo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cuentaEditando.id)
          .select()
          .single();

        if (error) throw error;

        setCuentas((prev) =>
          prev.map((c) =>
            c.id === data.id ? data : c
          )
        );
      } else {
        const { data, error } = await supabase
          .from("cuentas_correo")
          .insert({
            empresa: formCuenta.empresa,
            nombre: formCuenta.nombre,
            correo: formCuenta.correo,
            activo: formCuenta.activo,
          })
          .select()
          .single();

        if (error) throw error;

        setCuentas((prev) => [...prev, data]);
      }

      setModalCuenta(false);
    } catch (error) {
      console.error(error);
      alert("Error guardando la cuenta.");
    } finally {
      setSaving(false);
    }
  }

  async function eliminarCuenta(cuenta) {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar la cuenta ${cuenta.correo}?`
    );

    if (!confirmar) return;

    try {
      /*
       * Primero eliminamos sus licencias.
       * Esto evita problemas con la FK cuenta_id.
       */
      const { error: errorLicencias } = await supabase
        .from("licencias_correo")
        .delete()
        .eq("cuenta_id", cuenta.id);

      if (errorLicencias) throw errorLicencias;

      const { error } = await supabase
        .from("cuentas_correo")
        .delete()
        .eq("id", cuenta.id);

      if (error) throw error;

      setCuentas((prev) =>
        prev.filter((c) => c.id !== cuenta.id)
      );

      setLicencias((prev) =>
        prev.filter((l) => l.cuenta_id !== cuenta.id)
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la cuenta.");
    }
  }

  // =========================================================
  // LICENCIAS - MODAL
  // =========================================================

  function abrirNuevaLicencia(cuenta) {
    setCuentaSeleccionada(cuenta);
    setLicenciaEditando(null);

    setFormLicencia({
      tipo_licencia: "",
      fecha_compra: "",
      fecha_expira: "",
    });

    setModalLicencia(true);
  }

  function abrirEditarLicencia(cuenta, licencia) {
    setCuentaSeleccionada(cuenta);
    setLicenciaEditando(licencia);

    setFormLicencia({
      tipo_licencia: licencia.tipo_licencia || "",
      fecha_compra: licencia.fecha_compra || "",
      fecha_expira: licencia.fecha_expira || "",
    });

    setModalLicencia(true);
  }

  async function guardarLicencia(e) {
    e.preventDefault();

    if (!cuentaSeleccionada) return;

    if (!formLicencia.tipo_licencia) {
      alert("Ingresa el tipo de licencia.");
      return;
    }

    // Estandarizamos el tipo de licencia a MAYÚSCULAS antes de guardar,
    // así todo queda escrito de forma consistente sin importar cómo
    // lo haya tecleado quien lo registró.
    const tipoLicenciaEstandarizado = formLicencia.tipo_licencia
      .trim()
      .toUpperCase();

    try {
      setSaving(true);

      if (licenciaEditando) {
        const { data, error } = await supabase
          .from("licencias_correo")
          .update({
            tipo_licencia: tipoLicenciaEstandarizado,
            fecha_compra:
              formLicencia.fecha_compra || null,
            fecha_expira:
              formLicencia.fecha_expira || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", licenciaEditando.id)
          .select()
          .single();

        if (error) throw error;

        setLicencias((prev) =>
          prev.map((l) =>
            l.id === data.id ? data : l
          )
        );
      } else {
        const { data, error } = await supabase
          .from("licencias_correo")
          .insert({
            cuenta_id: cuentaSeleccionada.id,
            tipo_licencia: tipoLicenciaEstandarizado,
            fecha_compra:
              formLicencia.fecha_compra || null,
            fecha_expira:
              formLicencia.fecha_expira || null,
          })
          .select()
          .single();

        if (error) throw error;

        setLicencias((prev) => [
          ...prev,
          data,
        ]);
      }

      setModalLicencia(false);
    } catch (error) {
      console.error(error);
      alert("Error guardando la licencia.");
    } finally {
      setSaving(false);
    }
  }

  async function eliminarLicencia(licencia) {
    const confirmar = window.confirm(
      `¿Eliminar la licencia "${licencia.tipo_licencia}"?`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("licencias_correo")
        .delete()
        .eq("id", licencia.id);

      if (error) throw error;

      setLicencias((prev) =>
        prev.filter((l) => l.id !== licencia.id)
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la licencia.");
    }
  }

  // Diccionario de precios: cada precio tiene varios "alias" posibles
  // porque el mismo tipo de licencia puede estar guardado con distintos
  // nombres (según cómo se escribió al crearla, o el nombre que usa
  // Microsoft en el admin center vs. el que se usó manualmente aquí).
  // Escrito en MAYÚSCULAS para que coincida exactamente con cómo se
  // guarda ahora en Supabase (columna tipo_licencia estandarizada).
  function obtenerPrecioLicencia(tipoLicencia) {
    const preciosPorAlias = {
      // Kiosk / Exchange Online Kiosk — $24
      "KIOSK EXCHANGE ONLINE 2GB": 24,
      "QUIOSCO DE EXCHANGE ONLINE": 24,
      "EXCHANGE ONLINE KIOSK": 24,
      "EXCHANGE ONLINE KIOSK - EXTENDED SERVICE TERM": 24,

      // Exchange Online Plan 1 — $48
      "EXCHANGE PLAN 1 50 GB": 48,
      "EXCHANGE PLAN 1 50GB": 48,
      "EXCHANGE ONLINE (PLAN 1)": 48,
      "EXCHANGE ONLINE PLAN 1": 48,
      "EXCHANGE ONLINE (PLAN 1) - EXTENDED SERVICE TERM": 48,

      // Microsoft 365 Business Standard — $157
      "MICROSOFT ESTANDAR": 157,
      "MICROSOFT 365 BUSINESS STANDARD": 157,
      "MICROSOFT 365 EMPRESA ESTANDAR": 157,
      "BUSINESS STANDARD": 157,

      // Microsoft 365 Apps for business — $99.60
      "MICROSOFT APLICACIONES": 99.60,
      "APLICACIONES DE MICROSOFT 365 PARA NEGOCIOS": 99.60,
      "MICROSOFT 365 APPS FOR BUSINESS": 99.60,

      // Microsoft 365 Business Basic — $72
      "MICROSOFT BASIC": 72,
      "MICROSOFT 365 EMPRESA BASICO": 72,
      "MICROSOFT 365 BUSINESS BASIC": 72,

      // Power BI Pro — $168
      "POWER BI PRO": 168,

      // SharePoint (Plan 1) — $60
      "SHAREPOINT": 60,
      "SHAREPOINT (PLAN 1)": 60,
      "SHAREPOINT PLAN 1": 60,

      // Power Automate Premium — $180
      "POWER AUTOMATE PREMIUM": 180,

      // Power Apps — $60
      "POWER APPS": 60,
      "POWER APPS PER APP PLAN (1 APP OR WEBSITE)": 60,

      // Microsoft Teams Essentials — sin precio propio confirmado todavía
      // (agrégalo aquí si me pasas el precio)
    };

    // Normaliza a MAYÚSCULAS, sin tildes y sin espacios repetidos/extra,
    // para que pequeñas diferencias de escritura no rompan el match.
    function normalizar(texto) {
      return (texto || "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    const tipoLimpio = normalizar(tipoLicencia);

    // 1) Intento directo con espacios normales
    if (preciosPorAlias[tipoLimpio] !== undefined) {
      return preciosPorAlias[tipoLimpio];
    }

    // 2) Intento ignorando espacios por completo (cubre casos como
    //    "50gb" vs "50 gb" sin tener que listar cada variante)
    const sinEspacios = tipoLimpio.replace(/\s+/g, "");

    for (const alias in preciosPorAlias) {
      if (alias.replace(/\s+/g, "") === sinEspacios) {
        return preciosPorAlias[alias];
      }
    }

    return undefined;
  }

  // =========================================================
  // FECHAS
  // =========================================================

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(
      `${fecha}T00:00:00`
    ).toLocaleDateString("es-PE");
  }

  function estadoLicencia(fechaExpira) {
    if (!fechaExpira) {
      return {
        texto: "Sin fecha de vencimiento",
        clase: "text-slate-500 bg-slate-100",
      };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const vencimiento = new Date(
      `${fechaExpira}T00:00:00`
    );

    const diferencia =
      Math.ceil(
        (vencimiento - hoy) /
          (1000 * 60 * 60 * 24)
      );

    if (diferencia < 0) {
      return {
        texto: "Vencida",
        clase: "text-red-700 bg-red-50 ring-1 ring-red-200",
      };
    }

    if (diferencia <= 30) {
      return {
        texto: `Vence en ${diferencia} días`,
        clase: "text-amber-700 bg-amber-50 ring-1 ring-amber-200",
      };
    }

    return {
      texto: "Vigente",
      clase: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200",
    };
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Cuentas de correo
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Gestión de cuentas corporativas y sus licencias
        </p>
      </div>

      {/* ESTADISTICAS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div
          className="rounded-2xl p-5 shadow-sm transition hover:shadow-md"
          style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total de cuentas
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-1">
                {totalCuentas}
              </p>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{ background: "#eff6ff", color: "#345D9D" }}
            >
              <Mail size={24} />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 shadow-sm transition hover:shadow-md"
          style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Cuentas activas
              </p>

              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {cuentasActivas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 shadow-sm transition hover:shadow-md"
          style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Cuentas inactivas
              </p>

              <p className="text-3xl font-bold text-orange-500 mt-1">
                {cuentasInactivas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
              <XCircle size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* BUSCADOR + BOTON */}

      <div
        className="rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >

        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar empresa, nombre o correo..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition focus:ring-2"
            style={{
              background: "#ffffff",
              border: "1px solid #dbeafe",
              color: "#1e293b",
            }}
          />
        </div>

        <button
          onClick={abrirNuevaCuenta}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style={{ background: "#345D9D", color: "#ffffff" }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nueva cuenta
        </button>

      </div>

      {/* PANEL DE FILTROS */}

      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >

        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={17} style={{ color: "#345D9D" }} />
          <h2 className="font-semibold text-slate-700 text-sm">
            Filtros
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 items-end">

          {/* Tipo de licencia */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Tipo de licencia
            </label>

            <select
              value={filtroTipoLicencia}
              onChange={(e) => setFiltroTipoLicencia(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todas">Todas</option>
              {tiposLicenciaUnicos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Estado de la cuenta */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Estado de la cuenta
            </label>

            <select
              value={filtroEstadoCuenta}
              onChange={(e) => setFiltroEstadoCuenta(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todas">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
            </select>
          </div>

          {/* Estado de la licencia */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Estado de la licencia
            </label>

            <select
              value={filtroEstadoLicencia}
              onChange={(e) => setFiltroEstadoLicencia(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ border: "1px solid #dbeafe", color: "#1e293b" }}
            >
              <option value="todas">Todas</option>
              <option value="vigente">Vigente</option>
              <option value="por_vencer">Por vencer (≤30 días)</option>
              <option value="vencida">Vencida</option>
              <option value="sin_licencia">Sin licencia</option>
            </select>
          </div>

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-sm font-medium transition hover:underline"
              style={{ color: "#345D9D" }}
            >
              Limpiar filtros
            </button>
          )}

        </div>

      </div>

      {/* LISTADO */}

      <div className="space-y-4">

        {loading ? (

          <div
            className="rounded-2xl p-12 text-center text-slate-500 shadow-sm"
            style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
          >
            Cargando cuentas...
          </div>

        ) : cuentasFiltradas.length === 0 ? (

          <div
            className="rounded-2xl p-12 text-center shadow-sm"
            style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
          >
            <Mail
              size={42}
              className="mx-auto text-slate-300 mb-3"
            />

            <p className="text-slate-500">
              No se encontraron cuentas.
            </p>
          </div>

        ) : (

          cuentasFiltradas.map((cuenta) => {

            const licenciasCuenta =
              obtenerLicencias(cuenta.id);

            return (
              <div
                key={cuenta.id}
                className="rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md"
                style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
              >

                {/* CABECERA CUENTA */}

                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

                  <div className="flex items-center gap-4">

                    <div
                      className="p-3 rounded-xl shrink-0"
                      style={{ background: "#eff6ff", color: "#345D9D" }}
                    >
                      <Mail size={25} />
                    </div>

                    <div>

                      <div className="flex items-center gap-2 flex-wrap">

                        <h2 className="font-semibold text-slate-800">
                          {cuenta.nombre}
                        </h2>

                        {cuenta.activo ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                            Activa
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">
                            Inactiva
                          </span>
                        )}

                      </div>

                      <p className="text-sm mt-0.5" style={{ color: "#345D9D" }}>
                        {cuenta.empresa}
                      </p>

                      <p className="text-sm text-slate-500">
                        {cuenta.correo}
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-2 shrink-0">

                    <button
                      onClick={() =>
                        abrirNuevaLicencia(cuenta)
                      }
                      className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-white transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
                    >
                      <KeyRound size={16} />
                      Añadir licencia
                    </button>

                    <button
                      onClick={() =>
                        abrirEditarCuenta(cuenta)
                      }
                      className="p-2.5 rounded-xl transition hover:bg-slate-50"
                      style={{ border: "1px solid #dbeafe", color: "#345D9D" }}
                      title="Editar cuenta"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() =>
                        eliminarCuenta(cuenta)
                      }
                      className="p-2.5 rounded-xl text-red-600 border border-red-200 transition hover:bg-red-50"
                      title="Eliminar cuenta"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                </div>

                {/* LICENCIAS */}

                <div
                  className="p-5"
                  style={{ borderTop: "1px solid #dbeafe", background: "#f8fbff" }}
                >

                  <div className="flex items-center justify-between mb-3">

                    <div className="flex items-center gap-2">

                      <ShieldCheck
                        size={19}
                        style={{ color: "#345D9D" }}
                      />

                      <h3 className="font-semibold text-slate-700 text-sm">
                        Licencias asignadas
                      </h3>

                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#eff6ff", color: "#345D9D" }}
                      >
                        {licenciasCuenta.length}
                      </span>

                    </div>

                  </div>

                  {licenciasCuenta.length === 0 ? (

                    <div
                      className="rounded-xl p-4 text-sm text-slate-500"
                      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
                    >
                      Esta cuenta no tiene licencias registradas.
                    </div>

                  ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                      {licenciasCuenta.map((licencia) => {

                        const estado =
                          estadoLicencia(
                            licencia.fecha_expira
                          );

                        const precioAnual = obtenerPrecioLicencia(
                          licencia.tipo_licencia
                        );

                        return (

                          <div
                            key={licencia.id}
                            className="rounded-xl p-4 transition hover:shadow-sm"
                            style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
                          >

                            <div className="flex justify-between gap-3">

                              <div>

                                <p className="font-semibold text-slate-800 text-sm">
                                  {licencia.tipo_licencia}
                                </p>

                                <div className="mt-2 space-y-1 text-xs text-slate-500">

                                  <p className="flex items-center gap-1.5">
                                    <CalendarDays size={13} />
                                    Compra:{" "}
                                    {formatearFecha(
                                      licencia.fecha_compra
                                    )}
                                  </p>

                                  <p className="pl-[19px]">
                                    Vencimiento:{" "}
                                    {formatearFecha(
                                      licencia.fecha_expira
                                    )}
                                  </p>

                                </div>

                                <span
                                  className={`inline-block mt-2.5 px-2.5 py-1 rounded-full text-xs font-medium ${estado.clase}`}
                                >
                                  {estado.texto}
                                </span>

                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">

                                {precioAnual !== undefined && (
                                  <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap"
                                    style={{
                                      background: "#f0fdf4",
                                      color: "#15803d",
                                      border: "1px solid #bbf7d0",
                                    }}
                                  >
                                    ${precioAnual.toFixed(2)} / año
                                  </span>
                                )}

                                <div className="flex gap-1">

                                <button
                                  onClick={() =>
                                    abrirEditarLicencia(
                                      cuenta,
                                      licencia
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                  title="Editar licencia"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  onClick={() =>
                                    eliminarLicencia(
                                      licencia
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Eliminar licencia"
                                >
                                  <Trash2 size={15} />
                                </button>

                                </div>

                              </div>

                            </div>

                          </div>

                        );
                      })}

                    </div>

                  )}

                </div>

              </div>
            );
          })

        )}

      </div>

      {/* =====================================================
          MODAL CUENTA
      ====================================================== */}

      {modalCuenta && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">

          <form
            onSubmit={guardarCuenta}
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
          >

            <div
              className="p-5 flex justify-between items-center"
              style={{ borderBottom: "1px solid #dbeafe" }}
            >

              <h2 className="text-lg font-bold text-slate-800">
                {cuentaEditando
                  ? "Editar cuenta"
                  : "Nueva cuenta"}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setModalCuenta(false)
                }
                className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Empresa
                </label>

                <input
                  value={formCuenta.empresa}
                  onChange={(e) =>
                    setFormCuenta({
                      ...formCuenta,
                      empresa: e.target.value,
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{ border: "1px solid #dbeafe" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Nombre
                </label>

                <input
                  value={formCuenta.nombre}
                  onChange={(e) =>
                    setFormCuenta({
                      ...formCuenta,
                      nombre: e.target.value,
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{ border: "1px solid #dbeafe" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Correo
                </label>

                <input
                  type="email"
                  value={formCuenta.correo}
                  onChange={(e) =>
                    setFormCuenta({
                      ...formCuenta,
                      correo: e.target.value,
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{ border: "1px solid #dbeafe" }}
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">

                <input
                  type="checkbox"
                  checked={formCuenta.activo}
                  onChange={(e) =>
                    setFormCuenta({
                      ...formCuenta,
                      activo: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm text-slate-600">
                  Cuenta activa
                </span>

              </label>

            </div>

            <div
              className="p-5 flex justify-end gap-3"
              style={{ borderTop: "1px solid #dbeafe" }}
            >

              <button
                type="button"
                onClick={() =>
                  setModalCuenta(false)
                }
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                style={{ border: "1px solid #dbeafe" }}
              >
                Cancelar
              </button>

              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#345D9D" }}
              >
                <Save size={17} />
                {saving ? "Guardando..." : "Guardar"}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* =====================================================
          MODAL LICENCIA
      ====================================================== */}

      {modalLicencia && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">

          <form
            onSubmit={guardarLicencia}
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl"
          >

            <div
              className="p-5 flex justify-between items-center"
              style={{ borderBottom: "1px solid #dbeafe" }}
            >

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  {licenciaEditando
                    ? "Editar licencia"
                    : "Añadir licencia"}
                </h2>

                {cuentaSeleccionada && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {cuentaSeleccionada.nombre} ·{" "}
                    {cuentaSeleccionada.correo}
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={() =>
                  setModalLicencia(false)
                }
                className="p-1.5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Tipo de licencia
                </label>

                <input
                  value={formLicencia.tipo_licencia}
                  onChange={(e) =>
                    setFormLicencia({
                      ...formLicencia,
                      tipo_licencia: e.target.value,
                    })
                  }
                  placeholder="Ej. Microsoft 365 E3"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2 uppercase placeholder:normal-case"
                  style={{ border: "1px solid #dbeafe" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Fecha de compra
                </label>

                <input
                  type="date"
                  value={formLicencia.fecha_compra}
                  onChange={(e) =>
                    setFormLicencia({
                      ...formLicencia,
                      fecha_compra: e.target.value,
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{ border: "1px solid #dbeafe" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Fecha de vencimiento
                </label>

                <input
                  type="date"
                  value={formLicencia.fecha_expira}
                  onChange={(e) =>
                    setFormLicencia({
                      ...formLicencia,
                      fecha_expira: e.target.value,
                    })
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{ border: "1px solid #dbeafe" }}
                />
              </div>

            </div>

            <div
              className="p-5 flex justify-end gap-3"
              style={{ borderTop: "1px solid #dbeafe" }}
            >

              <button
                type="button"
                onClick={() =>
                  setModalLicencia(false)
                }
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                style={{ border: "1px solid #dbeafe" }}
              >
                Cancelar
              </button>

              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#345D9D" }}
              >
                <Save size={17} />
                {saving ? "Guardando..." : "Guardar licencia"}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}