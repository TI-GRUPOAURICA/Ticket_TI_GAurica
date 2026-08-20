import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Search,
  Plus,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function CuentasCorreo() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState(null);

  const [form, setForm] = useState({
    empresa: "",
    nombre: "",
    correo: "",
    activo: true,
    tipo_licencia: "",
    fecha_compra: "",
    fecha_expira: "",
  });

  // =========================================================
  // CARGAR CUENTAS + LICENCIAS
  // =========================================================

  const cargarCuentas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cuentas_correo")
        .select(`
          id,
          empresa,
          nombre,
          correo,
          activo,
          created_at,
          updated_at,
          licencias_correo (
            id,
            tipo_licencia,
            fecha_compra,
            fecha_expira
          )
        `)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error cargando cuentas:", error);
        alert("No se pudieron cargar las cuentas.");
        return;
      }

      setCuentas(data || []);
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al cargar las cuentas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  // =========================================================
  // FILTRAR
  // =========================================================

  const cuentasFiltradas = useMemo(() => {
    const texto = search.toLowerCase().trim();

    if (!texto) return cuentas;

    return cuentas.filter((cuenta) => {
      return (
        cuenta.empresa?.toLowerCase().includes(texto) ||
        cuenta.nombre?.toLowerCase().includes(texto) ||
        cuenta.correo?.toLowerCase().includes(texto)
      );
    });
  }, [cuentas, search]);

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const totalCuentas = cuentas.length;

  const cuentasActivas = cuentas.filter(
    (cuenta) => cuenta.activo === true
  ).length;

  const cuentasInactivas = cuentas.filter(
    (cuenta) => cuenta.activo === false
  ).length;

  // =========================================================
  // OBTENER LICENCIA
  // =========================================================

  const obtenerLicencia = (cuenta) => {
    if (
      !cuenta.licencias_correo ||
      cuenta.licencias_correo.length === 0
    ) {
      return null;
    }

    return cuenta.licencias_correo[0];
  };

  // =========================================================
  // ESTADO DE LICENCIA
  // =========================================================

  const estadoLicencia = (licencia) => {
    if (!licencia) {
      return {
        texto: "Sin licencia",
        clase: "bg-gray-100 text-gray-600",
        icono: <AlertCircle size={14} />,
      };
    }

    if (!licencia.fecha_expira) {
      return {
        texto: "Sin vencimiento",
        clase: "bg-gray-100 text-gray-600",
        icono: <Clock size={14} />,
      };
    }

    const hoy = new Date();

    const fechaExpira = new Date(
      `${licencia.fecha_expira}T23:59:59`
    );

    const diferencia =
      fechaExpira.getTime() - hoy.getTime();

    const dias = Math.ceil(
      diferencia / (1000 * 60 * 60 * 24)
    );

    if (dias < 0) {
      return {
        texto: "Vencida",
        clase: "bg-red-100 text-red-700",
        icono: <AlertCircle size={14} />,
      };
    }

    if (dias <= 30) {
      return {
        texto: `Vence en ${dias} días`,
        clase: "bg-yellow-100 text-yellow-700",
        icono: <Clock size={14} />,
      };
    }

    return {
      texto: "Vigente",
      clase: "bg-green-100 text-green-700",
      icono: <CheckCircle size={14} />,
    };
  };

  // =========================================================
  // ABRIR MODAL NUEVO
  // =========================================================

  const abrirNuevo = () => {
    setEditingCuenta(null);

    setForm({
      empresa: "",
      nombre: "",
      correo: "",
      activo: true,
      tipo_licencia: "",
      fecha_compra: "",
      fecha_expira: "",
    });

    setModalOpen(true);
  };

  // =========================================================
  // ABRIR MODAL EDITAR
  // =========================================================

  const abrirEditar = (cuenta) => {
    const licencia = obtenerLicencia(cuenta);

    setEditingCuenta(cuenta);

    setForm({
      empresa: cuenta.empresa || "",
      nombre: cuenta.nombre || "",
      correo: cuenta.correo || "",
      activo: cuenta.activo ?? true,

      tipo_licencia: licencia?.tipo_licencia || "",
      fecha_compra: licencia?.fecha_compra || "",
      fecha_expira: licencia?.fecha_expira || "",
    });

    setModalOpen(true);
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const cerrarModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingCuenta(null);
  };

  // =========================================================
  // CAMBIAR FORMULARIO
  // =========================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================================
  // GUARDAR
  // =========================================================

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.empresa.trim()) {
      alert("Ingresa la empresa.");
      return;
    }

    if (!form.nombre.trim()) {
      alert("Ingresa el nombre.");
      return;
    }

    if (!form.correo.trim()) {
      alert("Ingresa el correo.");
      return;
    }

    try {
      setSaving(true);

      let cuentaId;

      // =====================================================
      // CREAR CUENTA
      // =====================================================

      if (!editingCuenta) {
        const { data, error } = await supabase
          .from("cuentas_correo")
          .insert({
            empresa: form.empresa.trim(),
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            activo: form.activo,
          })
          .select("id")
          .single();

        if (error) {
          console.error(error);
          alert(`Error creando cuenta: ${error.message}`);
          return;
        }

        cuentaId = data.id;
      }

      // =====================================================
      // EDITAR CUENTA
      // =====================================================

      else {
        cuentaId = editingCuenta.id;

        const { error } = await supabase
          .from("cuentas_correo")
          .update({
            empresa: form.empresa.trim(),
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            activo: form.activo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cuentaId);

        if (error) {
          console.error(error);
          alert(`Error actualizando cuenta: ${error.message}`);
          return;
        }
      }

      // =====================================================
      // LICENCIA
      // =====================================================

      const licenciaExistente = editingCuenta
        ? obtenerLicencia(editingCuenta)
        : null;

      const tieneDatosLicencia =
        form.tipo_licencia.trim() ||
        form.fecha_compra ||
        form.fecha_expira;

      if (tieneDatosLicencia) {
        // ---------------------------------------------------
        // EDITAR LICENCIA EXISTENTE
        // ---------------------------------------------------

        if (licenciaExistente) {
          const { error } = await supabase
            .from("licencias_correo")
            .update({
              tipo_licencia:
                form.tipo_licencia.trim() || null,

              fecha_compra:
                form.fecha_compra || null,

              fecha_expira:
                form.fecha_expira || null,

              updated_at: new Date().toISOString(),
            })
            .eq("id", licenciaExistente.id);

          if (error) {
            console.error(error);
            alert(
              `La cuenta se guardó, pero hubo un error actualizando la licencia: ${error.message}`
            );
            return;
          }
        }

        // ---------------------------------------------------
        // CREAR LICENCIA
        // ---------------------------------------------------

        else {
          const { error } = await supabase
            .from("licencias_correo")
            .insert({
              cuenta_id: cuentaId,
              tipo_licencia:
                form.tipo_licencia.trim() || null,

              fecha_compra:
                form.fecha_compra || null,

              fecha_expira:
                form.fecha_expira || null,
            });

          if (error) {
            console.error(error);
            alert(
              `La cuenta se guardó, pero hubo un error creando la licencia: ${error.message}`
            );
            return;
          }
        }
      }

      alert(
        editingCuenta
          ? "Cuenta actualizada correctamente."
          : "Cuenta creada correctamente."
      );

      cerrarModal();

      await cargarCuentas();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // FORMATO FECHA
  // =========================================================

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ===================================================
          ENCABEZADO
      =================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Cuentas de correo
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Gestión de cuentas de correo corporativas y sus licencias
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <Plus size={18} />
          Nueva cuenta
        </button>

      </div>


      {/* ===================================================
          TARJETAS
      =================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total de cuentas
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-1">
                {totalCuentas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={24} />
            </div>

          </div>
        </div>


        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Cuentas activas
              </p>

              <p className="text-3xl font-bold text-green-600 mt-1">
                {cuentasActivas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <CheckCircle size={24} />
            </div>

          </div>
        </div>


        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Cuentas inactivas
              </p>

              <p className="text-3xl font-bold text-orange-600 mt-1">
                {cuentasInactivas}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <AlertCircle size={24} />
            </div>

          </div>
        </div>

      </div>


      {/* ===================================================
          BUSCADOR
      =================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 p-4">

        <div className="relative">

          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa, nombre o correo..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>


      {/* ===================================================
          TABLA
      =================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {loading ? (

          <div className="p-10 text-center text-slate-500">
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

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Empresa
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Usuario
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Correo
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Licencia
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Vencimiento
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Estado
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {cuentasFiltradas.map((cuenta) => {

                  const licencia = obtenerLicencia(cuenta);
                  const estado = estadoLicencia(licencia);

                  return (

                    <tr
                      key={cuenta.id}
                      className="hover:bg-slate-50 transition"
                    >

                      <td className="px-5 py-4">

                        <span className="font-medium text-slate-800">
                          {cuenta.empresa}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <span className="text-slate-700">
                          {cuenta.nombre}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <Mail
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-600">
                            {cuenta.correo}
                          </span>

                        </div>

                      </td>


                      <td className="px-5 py-4">

                        {licencia ? (

                          <div>

                            <p className="text-sm font-medium text-slate-700">
                              {licencia.tipo_licencia || "Sin especificar"}
                            </p>

                            {licencia.fecha_compra && (

                              <p className="text-xs text-slate-400 mt-1">
                                Compra:{" "}
                                {formatearFecha(
                                  licencia.fecha_compra
                                )}
                              </p>

                            )}

                          </div>

                        ) : (

                          <span className="text-sm text-slate-400">
                            Sin licencia
                          </span>

                        )}

                      </td>


                      <td className="px-5 py-4">

                        <span className="text-sm text-slate-600">
                          {formatearFecha(
                            licencia?.fecha_expira
                          )}
                        </span>

                      </td>


                      <td className="px-5 py-4">

                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estado.clase}`}
                        >
                          {estado.icono}
                          {estado.texto}
                        </div>

                      </td>


                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() => abrirEditar(cuenta)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Edit3 size={15} />
                          Editar
                        </button>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ===================================================
          MODAL
      =================================================== */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={cerrarModal}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>

                <h2 className="text-xl font-bold text-slate-800">

                  {editingCuenta
                    ? "Editar cuenta de correo"
                    : "Nueva cuenta de correo"}

                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Datos de la cuenta y su licencia
                </p>

              </div>

              <button
                onClick={cerrarModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORMULARIO */}

            <form
              onSubmit={guardar}
              className="p-6 space-y-5"
            >

              {/* CUENTA */}

              <div>

                <h3 className="font-semibold text-slate-800 mb-3">
                  Datos de la cuenta
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Empresa
                    </label>

                    <input
                      name="empresa"
                      value={form.empresa}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AURICASAC"
                    />

                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Nombre
                    </label>

                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre del usuario"
                    />

                  </div>

                </div>


                <div className="mt-4">

                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Correo
                  </label>

                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@auricasac.com"
                  />

                </div>


                <label className="flex items-center gap-2 mt-4 cursor-pointer">

                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />

                  <span className="text-sm text-slate-600">
                    Cuenta activa
                  </span>

                </label>

              </div>


              {/* LICENCIA */}

              <div className="border-t border-slate-200 pt-5">

                <h3 className="font-semibold text-slate-800 mb-3">
                  Licencia
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Tipo de licencia
                    </label>

                    <input
                      name="tipo_licencia"
                      value={form.tipo_licencia}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Microsoft 365 Business Standard"
                    />

                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Fecha de compra
                    </label>

                    <input
                      type="date"
                      name="fecha_compra"
                      value={form.fecha_compra}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Fecha de expiración
                    </label>

                    <input
                      type="date"
                      name="fecha_expira"
                      value={form.fecha_expira}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                </div>

              </div>


              {/* BOTONES */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={saving}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : editingCuenta
                    ? "Guardar cambios"
                    : "Crear cuenta"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}