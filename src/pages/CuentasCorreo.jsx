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
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [cuentas, setCuentas] = useState([]);
  const [licencias, setLicencias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

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
  // FILTRO
  // =========================================================

  const cuentasFiltradas = useMemo(() => {
    const texto = search.toLowerCase().trim();

    if (!texto) return cuentas;

    return cuentas.filter((cuenta) =>
      [
        cuenta.empresa,
        cuenta.nombre,
        cuenta.correo,
      ]
        .filter(Boolean)
        .some((valor) =>
          valor.toLowerCase().includes(texto)
        )
    );
  }, [cuentas, search]);

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
  // LICENCIAS
  // =========================================================

  function obtenerLicencias(cuentaId) {
    return licencias.filter(
      (licencia) => licencia.cuenta_id === cuentaId
    );
  }

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

    try {
      setSaving(true);

      if (licenciaEditando) {
        const { data, error } = await supabase
          .from("licencias_correo")
          .update({
            tipo_licencia: formLicencia.tipo_licencia,
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
            tipo_licencia: formLicencia.tipo_licencia,
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
        clase: "text-gray-500 bg-gray-100",
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
        clase: "text-red-700 bg-red-100",
      };
    }

    if (diferencia <= 30) {
      return {
        texto: `Vence en ${diferencia} días`,
        clase: "text-orange-700 bg-orange-100",
      };
    }

    return {
      texto: "Vigente",
      clase: "text-green-700 bg-green-100",
    };
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Cuentas de correo
        </h1>

        <p className="text-slate-500">
          Gestión de cuentas corporativas y sus licencias
        </p>
      </div>

      {/* ESTADISTICAS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total de cuentas
              </p>

              <p className="text-3xl font-bold mt-2">
                {totalCuentas}
              </p>
            </div>

            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <Mail size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Cuentas activas
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {cuentasActivas}
              </p>
            </div>

            <div className="bg-green-50 text-green-600 p-3 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Cuentas inactivas
              </p>

              <p className="text-3xl font-bold text-orange-600 mt-2">
                {cuentasInactivas}
              </p>
            </div>

            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
              <XCircle size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* BUSCADOR + BOTON */}

      <div className="bg-white border rounded-xl p-4 flex gap-3">

        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar empresa, nombre o correo..."
            className="w-full border rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={abrirNuevaCuenta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva cuenta
        </button>

      </div>

      {/* LISTADO */}

      <div className="space-y-4">

        {loading ? (

          <div className="bg-white rounded-xl border p-10 text-center">
            Cargando cuentas...
          </div>

        ) : cuentasFiltradas.length === 0 ? (

          <div className="bg-white rounded-xl border p-10 text-center">
            <Mail
              size={45}
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
                className="bg-white rounded-xl border overflow-hidden"
              >

                {/* CABECERA CUENTA */}

                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

                  <div className="flex items-center gap-4">

                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                      <Mail size={25} />
                    </div>

                    <div>

                      <div className="flex items-center gap-2">

                        <h2 className="font-semibold text-slate-800">
                          {cuenta.nombre}
                        </h2>

                        {cuenta.activo ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            Activa
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                            Inactiva
                          </span>
                        )}

                      </div>

                      <p className="text-sm text-slate-500">
                        {cuenta.empresa}
                      </p>

                      <p className="text-sm text-slate-600">
                        {cuenta.correo}
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        abrirNuevaLicencia(cuenta)
                      }
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm"
                    >
                      <KeyRound size={17} />
                      Añadir licencia
                    </button>

                    <button
                      onClick={() =>
                        abrirEditarCuenta(cuenta)
                      }
                      className="p-2 border rounded-lg hover:bg-slate-50"
                      title="Editar cuenta"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() =>
                        eliminarCuenta(cuenta)
                      }
                      className="p-2 border rounded-lg text-red-600 hover:bg-red-50"
                      title="Eliminar cuenta"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>

                {/* LICENCIAS */}

                <div className="border-t bg-slate-50 p-5">

                  <div className="flex items-center justify-between mb-3">

                    <div className="flex items-center gap-2">

                      <ShieldCheck
                        size={20}
                        className="text-blue-600"
                      />

                      <h3 className="font-semibold text-slate-700">
                        Licencias asignadas
                      </h3>

                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {licenciasCuenta.length}
                      </span>

                    </div>

                  </div>

                  {licenciasCuenta.length === 0 ? (

                    <div className="bg-white border rounded-lg p-4 text-sm text-slate-500">
                      Esta cuenta no tiene licencias registradas.
                    </div>

                  ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                      {licenciasCuenta.map((licencia) => {

                        const estado =
                          estadoLicencia(
                            licencia.fecha_expira
                          );

                        return (

                          <div
                            key={licencia.id}
                            className="bg-white border rounded-lg p-4"
                          >

                            <div className="flex justify-between gap-2">

                              <div>

                                <p className="font-semibold text-slate-800">
                                  {licencia.tipo_licencia}
                                </p>

                                <div className="mt-2 space-y-1 text-xs text-slate-500">

                                  <p className="flex items-center gap-1">
                                    <CalendarDays size={14} />
                                    Compra:{" "}
                                    {formatearFecha(
                                      licencia.fecha_compra
                                    )}
                                  </p>

                                  <p>
                                    Vencimiento:{" "}
                                    {formatearFecha(
                                      licencia.fecha_expira
                                    )}
                                  </p>

                                </div>

                                <span
                                  className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${estado.clase}`}
                                >
                                  {estado.texto}
                                </span>

                              </div>

                              <div className="flex gap-1">

                                <button
                                  onClick={() =>
                                    abrirEditarLicencia(
                                      cuenta,
                                      licencia
                                    )
                                  }
                                  className="p-1.5 text-slate-500 hover:text-blue-600"
                                  title="Editar licencia"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  onClick={() =>
                                    eliminarLicencia(
                                      licencia
                                    )
                                  }
                                  className="p-1.5 text-slate-500 hover:text-red-600"
                                  title="Eliminar licencia"
                                >
                                  <Trash2 size={16} />
                                </button>

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

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <form
            onSubmit={guardarCuenta}
            className="bg-white rounded-xl w-full max-w-lg shadow-xl"
          >

            <div className="p-5 border-b flex justify-between items-center">

              <h2 className="text-lg font-bold">
                {cuentaEditando
                  ? "Editar cuenta"
                  : "Nueva cuenta"}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setModalCuenta(false)
                }
              >
                <X size={22} />
              </button>

            </div>

            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={formCuenta.activo}
                  onChange={(e) =>
                    setFormCuenta({
                      ...formCuenta,
                      activo: e.target.checked,
                    })
                  }
                />

                Cuenta activa

              </label>

            </div>

            <div className="p-5 border-t flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setModalCuenta(false)
                }
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Save size={18} />
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

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <form
            onSubmit={guardarLicencia}
            className="bg-white rounded-xl w-full max-w-lg shadow-xl"
          >

            <div className="p-5 border-b flex justify-between items-center">

              <div>

                <h2 className="text-lg font-bold">
                  {licenciaEditando
                    ? "Editar licencia"
                    : "Añadir licencia"}
                </h2>

                {cuentaSeleccionada && (
                  <p className="text-sm text-slate-500">
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
              >
                <X size={22} />
              </button>

            </div>

            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

            </div>

            <div className="p-5 border-t flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setModalLicencia(false)
                }
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar licencia"}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}