import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Pencil,
  Trash2,
  X,
  Building2,
  MapPin,
  User,
  Phone,
  CreditCard,
  Tag,
  Hash,
  MessageSquare,
  FileSpreadsheet,
  Filter,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

export default function EquiposCelulares() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");

  const [expandido, setExpandido] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    empresa: "",
    sede: "",
    personal_asignado: "",
    telefono: "",
    plan: "",
    marca: "",
    modelo: "",
    observacion: "",
    imei: "",
  });

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("equipos_celulares")
      .select("*")
      .order("empresa", { ascending: true })
      .order("personal_asignado", { ascending: true });

    if (error) {
      console.error("Error cargando equipos:", error);
      alert("No se pudieron cargar los equipos celulares.");
    } else {
      setEquipos(data || []);
    }

    setCargando(false);
  };

  // =========================================================
  // OPCIONES DE LOS FILTROS
  // =========================================================

  const empresas = useMemo(() => {
    return [...new Set(
      equipos
        .map((equipo) => equipo.empresa)
        .filter(Boolean)
    )].sort();
  }, [equipos]);

  const sedes = useMemo(() => {
    return [...new Set(
      equipos
        .map((equipo) => equipo.sede)
        .filter(Boolean)
    )].sort();
  }, [equipos]);

  const planes = useMemo(() => {
    return [...new Set(
      equipos
        .map((equipo) => equipo.plan)
        .filter((plan) => plan !== null && plan !== undefined && plan !== "")
    )].sort((a, b) => Number(a) - Number(b));
  }, [equipos]);

  // =========================================================
  // FILTRADO
  // =========================================================

  const equiposFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return equipos.filter((equipo) => {
      const coincideBusqueda =
        !texto ||
        String(equipo.empresa || "").toLowerCase().includes(texto) ||
        String(equipo.sede || "").toLowerCase().includes(texto) ||
        String(equipo.personal_asignado || "").toLowerCase().includes(texto) ||
        String(equipo.telefono || "").toLowerCase().includes(texto) ||
        String(equipo.marca || "").toLowerCase().includes(texto) ||
        String(equipo.modelo || "").toLowerCase().includes(texto) ||
        String(equipo.imei || "").toLowerCase().includes(texto);

      const coincideEmpresa =
        !filtroEmpresa ||
        String(equipo.empresa || "") === filtroEmpresa;

      const coincideSede =
        !filtroSede ||
        String(equipo.sede || "") === filtroSede;

      const coincidePlan =
        !filtroPlan ||
        String(equipo.plan || "") === String(filtroPlan);

      return (
        coincideBusqueda &&
        coincideEmpresa &&
        coincideSede &&
        coincidePlan
      );
    });
  }, [
    equipos,
    busqueda,
    filtroEmpresa,
    filtroSede,
    filtroPlan,
  ]);

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEmpresa("");
    setFiltroSede("");
    setFiltroPlan("");
  };

  // =========================================================
  // REPORTE EXCEL
  // =========================================================

  const generarReporte = () => {
    if (equiposFiltrados.length === 0) {
      alert("No hay equipos que coincidan con los filtros seleccionados.");
      return;
    }

    const datosReporte = equiposFiltrados.map((equipo) => ({
      Empresa: equipo.empresa || "",
      Sede: equipo.sede || "",
      "Personal asignado": equipo.personal_asignado || "",
      Teléfono: equipo.telefono || "",
      Plan: equipo.plan ?? "",
      Marca: equipo.marca || "",
      Modelo: equipo.modelo || "",
      Observación: equipo.observacion || "",
      IMEI: equipo.imei || "",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosReporte);

    // Ancho de columnas
    hoja["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 28 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 40 },
      { wch: 22 },
    ];

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Equipos celulares"
    );

    const fecha = new Date();

    const fechaTexto =
      `${fecha.getFullYear()}-` +
      `${String(fecha.getMonth() + 1).padStart(2, "0")}-` +
      `${String(fecha.getDate()).padStart(2, "0")}`;

    XLSX.writeFile(
      libro,
      `Reporte_Equipos_Celulares_${fechaTexto}.xlsx`
    );
  };

  // =========================================================
  // FORMULARIO
  // =========================================================

  const abrirNuevo = () => {
    setEditando(null);

    setFormulario({
      empresa: "",
      sede: "",
      personal_asignado: "",
      telefono: "",
      plan: "",
      marca: "",
      modelo: "",
      observacion: "",
      imei: "",
    });

    setMostrarModal(true);
  };

  const abrirEditar = (equipo) => {
    setEditando(equipo);

    setFormulario({
      empresa: equipo.empresa || "",
      sede: equipo.sede || "",
      personal_asignado: equipo.personal_asignado || "",
      telefono: equipo.telefono || "",
      plan: equipo.plan ?? "",
      marca: equipo.marca || "",
      modelo: equipo.modelo || "",
      observacion: equipo.observacion || "",
      imei: equipo.imei || "",
    });

    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
  };

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // =========================================================
  // GUARDAR
  // =========================================================

  const guardarEquipo = async (e) => {
    e.preventDefault();

    const datos = {
      empresa: formulario.empresa.trim(),
      sede: formulario.sede.trim(),
      personal_asignado: formulario.personal_asignado.trim(),
      telefono: formulario.telefono.trim(),
      plan:
        formulario.plan === ""
          ? null
          : Number(formulario.plan),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      observacion: formulario.observacion.trim(),
      imei: formulario.imei.trim(),
    };

    if (editando) {
      const { error } = await supabase
        .from("equipos_celulares")
        .update(datos)
        .eq("id", editando.id);

      if (error) {
        console.error(error);
        alert("No se pudo actualizar el equipo.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("equipos_celulares")
        .insert([datos]);

      if (error) {
        console.error(error);
        alert("No se pudo registrar el equipo.");
        return;
      }
    }

    cerrarModal();
    cargarEquipos();
  };

  // =========================================================
  // ELIMINAR
  // =========================================================

  const eliminarEquipo = async (equipo) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el equipo de ${equipo.personal_asignado || "este usuario"}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("equipos_celulares")
      .delete()
      .eq("id", equipo.id);

    if (error) {
      console.error(error);
      alert("No se pudo eliminar el equipo.");
      return;
    }

    if (expandido === equipo.id) {
      setExpandido(null);
    }

    cargarEquipos();
  };

  const alternarExpandido = (id) => {
    setExpandido((actual) =>
      actual === id ? null : id
    );
  };

  // =========================================================
  // COMPONENTE CAMPO DETALLE
  // =========================================================

  const CampoDetalle = ({
    icono: Icono,
    etiqueta,
    valor,
  }) => (
    <div className="campo-detalle">
      <div className="campo-icono">
        <Icono size={17} />
      </div>

      <div>
        <div className="campo-etiqueta">
          {etiqueta}
        </div>

        <div className="campo-valor">
          {valor !== null &&
          valor !== undefined &&
          String(valor).trim() !== ""
            ? valor
            : "—"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="equipos-container">

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="equipos-header">
        <div>
          <div className="titulo-seccion">
            <Smartphone size={28} />
            <div>
              <h1>Equipos celulares</h1>
              <p>
                Administración de celulares asignados al personal
              </p>
            </div>
          </div>
        </div>

        <button
          className="boton-nuevo"
          onClick={abrirNuevo}
        >
          <Plus size={19} />
          Nuevo equipo
        </button>
      </div>

      {/* =====================================================
          BÚSQUEDA Y FILTROS
      ===================================================== */}

      <div className="panel-filtros">

        <div className="fila-filtros">

          {/* BÚSQUEDA */}

          <div className="campo-busqueda">
            <Search size={19} />

            <input
              type="text"
              placeholder="Buscar por empresa, usuario, teléfono, IMEI..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
            />
          </div>

          {/* EMPRESA */}

          <div className="select-filtro">
            <Building2 size={18} />

            <select
              value={filtroEmpresa}
              onChange={(e) =>
                setFiltroEmpresa(e.target.value)
              }
            >
              <option value="">
                Todas las empresas
              </option>

              {empresas.map((empresa) => (
                <option
                  key={empresa}
                  value={empresa}
                >
                  {empresa}
                </option>
              ))}
            </select>
          </div>

          {/* SEDE */}

          <div className="select-filtro">
            <MapPin size={18} />

            <select
              value={filtroSede}
              onChange={(e) =>
                setFiltroSede(e.target.value)
              }
            >
              <option value="">
                Todas las sedes
              </option>

              {sedes.map((sede) => (
                <option
                  key={sede}
                  value={sede}
                >
                  {sede}
                </option>
              ))}
            </select>
          </div>

          {/* PLAN */}

          <div className="select-filtro">
            <CreditCard size={18} />

            <select
              value={filtroPlan}
              onChange={(e) =>
                setFiltroPlan(e.target.value)
              }
            >
              <option value="">
                Todos los planes
              </option>

              {planes.map((plan) => (
                <option
                  key={String(plan)}
                  value={String(plan)}
                >
                  S/ {Number(plan).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* SEGUNDA FILA */}

        <div className="barra-filtros">

          <div className="resultado-filtros">
            <Filter size={17} />

            <span>
              Mostrando{" "}
              <strong>
                {equiposFiltrados.length}
              </strong>{" "}
              de{" "}
              <strong>
                {equipos.length}
              </strong>{" "}
              equipos
            </span>
          </div>

          <div className="acciones-filtros">

            <button
              className="boton-limpiar"
              onClick={limpiarFiltros}
            >
              <RotateCcw size={17} />
              Limpiar filtros
            </button>

            <button
              className="boton-reporte"
              onClick={generarReporte}
            >
              <FileSpreadsheet size={18} />
              Generar reporte
            </button>

          </div>

        </div>
      </div>

      {/* =====================================================
          LISTA
      ===================================================== */}

      <div className="lista-equipos">

        {cargando ? (
          <div className="estado-vacio">
            Cargando equipos...
          </div>
        ) : equiposFiltrados.length === 0 ? (
          <div className="estado-vacio">
            <Smartphone size={42} />

            <h3>
              No se encontraron equipos
            </h3>

            <p>
              Prueba cambiando los filtros o registra
              un nuevo equipo.
            </p>
          </div>
        ) : (
          equiposFiltrados.map((equipo) => {

            const abierto =
              expandido === equipo.id;

            return (
              <div
                className={`equipo-card ${
                  abierto ? "equipo-abierto" : ""
                }`}
                key={equipo.id}
              >

                {/* =================================================
                    FILA PRINCIPAL
                ================================================= */}

                <div className="equipo-fila">

                  {/* EMPRESA */}

                  <div className="dato-principal">
                    <div className="dato-icono empresa">
                      <Building2 size={19} />
                    </div>

                    <div>
                      <span>EMPRESA</span>
                      <strong>
                        {equipo.empresa || "—"}
                      </strong>
                    </div>
                  </div>

                  {/* USUARIO */}

                  <div className="dato-principal">
                    <div className="dato-icono usuario">
                      <User size={19} />
                    </div>

                    <div>
                      <span>USUARIO ASIGNADO</span>
                      <strong>
                        {equipo.personal_asignado || "—"}
                      </strong>
                    </div>
                  </div>

                  {/* CELULAR */}

                  <div className="dato-principal">
                    <div className="dato-icono telefono">
                      <Phone size={19} />
                    </div>

                    <div>
                      <span>CELULAR</span>
                      <strong>
                        {equipo.telefono || "—"}
                      </strong>
                    </div>
                  </div>

                  {/* ACCIONES */}

                  <div className="acciones-card">

                    <button
                      className="boton-expandir"
                      title={
                        abierto
                          ? "Ocultar detalles"
                          : "Ver detalles"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarExpandido(equipo.id);
                      }}
                    >
                      {abierto ? (
                        <ChevronUp size={21} />
                      ) : (
                        <ChevronDown size={21} />
                      )}
                    </button>

                    <button
                      className="boton-editar"
                      title="Editar"
                      onClick={() =>
                        abrirEditar(equipo)
                      }
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      className="boton-eliminar"
                      title="Eliminar"
                      onClick={() =>
                        eliminarEquipo(equipo)
                      }
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>

                {/* =================================================
                    DETALLES EXPANDIDOS
                ================================================= */}

                {abierto && (
                  <div className="detalles-equipo">

                    <div className="detalles-grid">

                      <CampoDetalle
                        icono={Building2}
                        etiqueta="Empresa"
                        valor={equipo.empresa}
                      />

                      <CampoDetalle
                        icono={MapPin}
                        etiqueta="Sede"
                        valor={equipo.sede}
                      />

                      <CampoDetalle
                        icono={User}
                        etiqueta="Personal asignado"
                        valor={equipo.personal_asignado}
                      />

                      <CampoDetalle
                        icono={Phone}
                        etiqueta="Teléfono"
                        valor={equipo.telefono}
                      />

                      <CampoDetalle
                        icono={CreditCard}
                        etiqueta="Plan"
                        valor={
                          equipo.plan !== null &&
                          equipo.plan !== undefined &&
                          equipo.plan !== ""
                            ? `S/ ${Number(
                                equipo.plan
                              ).toFixed(2)}`
                            : "—"
                        }
                      />

                      <CampoDetalle
                        icono={Tag}
                        etiqueta="Marca"
                        valor={equipo.marca}
                      />

                      <CampoDetalle
                        icono={Smartphone}
                        etiqueta="Modelo"
                        valor={equipo.modelo}
                      />

                      <CampoDetalle
                        icono={Hash}
                        etiqueta="IMEI"
                        valor={equipo.imei}
                      />

                    </div>

                    <div className="observacion-box">

                      <div className="observacion-icono">
                        <MessageSquare size={18} />
                      </div>

                      <div>
                        <div className="campo-etiqueta">
                          OBSERVACIÓN
                        </div>

                        <div className="observacion-texto">
                          {equipo.observacion ||
                            "Sin observaciones"}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {mostrarModal && (
        <div
          className="modal-overlay"
          onClick={cerrarModal}
        >
          <div
            className="modal-contenido"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  {editando
                    ? "Editar equipo"
                    : "Nuevo equipo"}
                </h2>

                <p>
                  {editando
                    ? "Modifica los datos del equipo."
                    : "Registra un nuevo celular."}
                </p>
              </div>

              <button
                className="boton-cerrar-modal"
                onClick={cerrarModal}
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={guardarEquipo}>

              <div className="form-grid">

                <div className="form-grupo">
                  <label>Empresa</label>

                  <input
                    type="text"
                    value={formulario.empresa}
                    onChange={(e) =>
                      cambiarCampo(
                        "empresa",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="form-grupo">
                  <label>Sede</label>

                  <input
                    type="text"
                    value={formulario.sede}
                    onChange={(e) =>
                      cambiarCampo(
                        "sede",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>Personal asignado</label>

                  <input
                    type="text"
                    value={
                      formulario.personal_asignado
                    }
                    onChange={(e) =>
                      cambiarCampo(
                        "personal_asignado",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>Teléfono</label>

                  <input
                    type="text"
                    value={formulario.telefono}
                    onChange={(e) =>
                      cambiarCampo(
                        "telefono",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>Plan</label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formulario.plan}
                    onChange={(e) =>
                      cambiarCampo(
                        "plan",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>Marca</label>

                  <input
                    type="text"
                    value={formulario.marca}
                    onChange={(e) =>
                      cambiarCampo(
                        "marca",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>Modelo</label>

                  <input
                    type="text"
                    value={formulario.modelo}
                    onChange={(e) =>
                      cambiarCampo(
                        "modelo",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo">
                  <label>IMEI</label>

                  <input
                    type="text"
                    value={formulario.imei}
                    onChange={(e) =>
                      cambiarCampo(
                        "imei",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-grupo form-grupo-completo">
                  <label>Observación</label>

                  <textarea
                    rows="4"
                    value={formulario.observacion}
                    onChange={(e) =>
                      cambiarCampo(
                        "observacion",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="boton-guardar"
                >
                  {editando
                    ? "Guardar cambios"
                    : "Registrar equipo"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =====================================================
          ESTILOS
      ===================================================== */}

      <style>{`

        .equipos-container {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .equipos-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 20px;
        }

        .titulo-seccion {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .titulo-seccion > svg {
          color: #345D9D;
        }

        .titulo-seccion h1 {
          margin: 0;
          color: #1f2937;
          font-size: 26px;
          font-weight: 700;
        }

        .titulo-seccion p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .boton-nuevo {
          border: none;
          background: #345D9D;
          color: white;
          padding: 11px 17px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .boton-nuevo:hover {
          background: #294b80;
          transform: translateY(-1px);
        }

        /* FILTROS */

        .panel-filtros {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .fila-filtros {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1fr;
          gap: 10px;
        }

        .campo-busqueda,
        .select-filtro {
          height: 44px;
          border: 1px solid #d9dee7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          background: #fff;
          color: #6b7280;
          transition: 0.2s;
        }

        .campo-busqueda:focus-within,
        .select-filtro:focus-within {
          border-color: #345D9D;
          box-shadow: 0 0 0 3px rgba(52, 93, 157, 0.10);
        }

        .campo-busqueda input {
          border: none;
          outline: none;
          width: 100%;
          margin-left: 9px;
          font-size: 14px;
          color: #1f2937;
        }

        .select-filtro {
          gap: 8px;
        }

        .select-filtro select {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
        }

        .barra-filtros {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #eef0f3;
        }

        .resultado-filtros {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #6b7280;
          font-size: 13px;
        }

        .resultado-filtros svg {
          color: #345D9D;
        }

        .acciones-filtros {
          display: flex;
          gap: 9px;
        }

        .boton-limpiar,
        .boton-reporte {
          height: 38px;
          border-radius: 8px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .boton-limpiar {
          background: white;
          color: #4b5563;
          border: 1px solid #d9dee7;
        }

        .boton-limpiar:hover {
          background: #f8fafc;
        }

        .boton-reporte {
          background: #217346;
          color: white;
          border: 1px solid #217346;
        }

        .boton-reporte:hover {
          background: #195c37;
        }

        /* LISTA */

        .lista-equipos {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

       .equipo-card {
  background: white;
  border: 1px solid #e3e7ed;
  border-radius: 11px;
  overflow: hidden;
  box-shadow: 0 2px 7px rgba(15, 23, 42, 0.035);
  transition: 
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

        .equipo-card:hover {
  background: #eef4ff;
  border-color: #7fa4d8;
  box-shadow: 0 4px 14px rgba(52, 93, 157, 0.12);
  transform: translateY(-1px);
}
  .equipo-card {
  position: relative;
}

.equipo-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  transition: background 0.2s ease;
}

.equipo-card:hover::before {
  background: #345D9D;
}

        .equipo-abierto {
          border-color: #b8c8df;
        }

        .equipo-fila {
          min-height: 88px;
          display: grid;
          grid-template-columns: 1fr 1.4fr 1fr auto;
          align-items: center;
          gap: 18px;
          padding: 14px 16px;
        }

        .dato-principal {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .dato-principal > div:last-child {
          min-width: 0;
        }

        .dato-icono {
          min-width: 40px;
          width: 40px;
          height: 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dato-icono.empresa {
          background: #eef4ff;
          color: #345D9D;
        }

        .dato-icono.usuario {
          background: #f1f5f9;
          color: #475569;
        }

        .dato-icono.telefono {
          background: #edf8f1;
          color: #26734d;
        }

        .dato-principal span {
          display: block;
          color: #8a94a3;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .dato-principal strong {
          display: block;
          color: #273142;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .acciones-card {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .boton-expandir,
        .boton-editar,
        .boton-eliminar {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .boton-expandir {
          border: 1px solid #dce2ea;
          background: white;
          color: #345D9D;
        }

        .boton-expandir:hover {
          background: #eef4ff;
        }

        .boton-editar {
          border: 1px solid #dce2ea;
          background: white;
          color: #526174;
        }

        .boton-editar:hover {
          background: #f3f6fa;
        }

        .boton-eliminar {
          border: 1px solid #ead6d6;
          background: white;
          color: #b64c4c;
        }

        .boton-eliminar:hover {
          background: #fff1f1;
        }

        /* DETALLES */

        .detalles-equipo {
          background: #f8fafc;
          border-top: 1px solid #e6eaf0;
          padding: 20px;
        }

        .detalles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 13px;
        }

        .campo-detalle {
          background: white;
          border: 1px solid #e7ebf0;
          border-radius: 9px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .campo-icono {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 8px;
          background: #eef4ff;
          color: #345D9D;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .campo-etiqueta {
          color: #8a94a3;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
        }

        .campo-valor {
          color: #263242;
          font-size: 13px;
          font-weight: 600;
          word-break: break-word;
        }

        .observacion-box {
          background: white;
          border: 1px solid #e7ebf0;
          border-radius: 9px;
          padding: 13px;
          margin-top: 13px;
          display: flex;
          gap: 11px;
        }

        .observacion-icono {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 8px;
          background: #fff7e8;
          color: #b7791f;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .observacion-texto {
          color: #374151;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ESTADO */

        .estado-vacio {
          min-height: 250px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          text-align: center;
        }

        .estado-vacio h3 {
          color: #374151;
          margin: 12px 0 5px;
        }

        .estado-vacio p {
          margin: 0;
          font-size: 13px;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .modal-contenido {
          width: 100%;
          max-width: 760px;
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 13px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 21px 23px;
          border-bottom: 1px solid #e8ebef;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 20px;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #8a94a3;
          font-size: 13px;
        }

        .boton-cerrar-modal {
          width: 36px;
          height: 36px;
          border: none;
          background: #f3f4f6;
          color: #5f6b7a;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .boton-cerrar-modal:hover {
          background: #e5e7eb;
        }

        .modal-contenido form {
          padding: 21px 23px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-grupo {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-grupo-completo {
          grid-column: 1 / -1;
        }

        .form-grupo label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .form-grupo input,
        .form-grupo textarea {
          border: 1px solid #d7dde5;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #1f2937;
          resize: vertical;
        }

        .form-grupo input:focus,
        .form-grupo textarea:focus {
          border-color: #345D9D;
          box-shadow: 0 0 0 3px rgba(52, 93, 157, 0.10);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #e8ebef;
        }

        .boton-cancelar,
        .boton-guardar {
          border-radius: 8px;
          padding: 10px 17px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .boton-cancelar {
          background: white;
          border: 1px solid #d7dde5;
          color: #4b5563;
        }

        .boton-guardar {
          background: #345D9D;
          border: 1px solid #345D9D;
          color: white;
        }

        .boton-guardar:hover {
          background: #294b80;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .fila-filtros {
            grid-template-columns: 1fr 1fr;
          }

          .detalles-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .equipo-fila {
            grid-template-columns: 1fr 1fr;
          }

          .acciones-card {
            justify-content: flex-end;
          }
        }

        @media (max-width: 700px) {
          .equipos-header {
            flex-direction: column;
            align-items: stretch;
          }

          .boton-nuevo {
            justify-content: center;
          }

          .fila-filtros {
            grid-template-columns: 1fr;
          }

          .barra-filtros {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .acciones-filtros {
            justify-content: stretch;
          }

          .acciones-filtros button {
            flex: 1;
            justify-content: center;
          }

          .equipo-fila {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .acciones-card {
            justify-content: flex-end;
          }

          .detalles-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-grupo-completo {
            grid-column: auto;
          }

          .modal-contenido {
            max-height: 95vh;
          }
        }

      `}</style>
    </div>
  );
}