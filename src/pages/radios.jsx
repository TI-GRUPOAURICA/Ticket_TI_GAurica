import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Radio,
  Pencil,
  Trash2,
  X,
  Building2,
  MapPin,
  User,
  Tag,
  Hash,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  RadioTower,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

export default function Radios() {
  const [radios, setRadios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");

  const [expandido, setExpandido] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    usuario: "",
    empresa: "",
    sede: "",
    marca: "",
    modelo: "",
    numero_serie: "",
  });

  useEffect(() => {
    cargarRadios();
  }, []);

  // =========================================================
  // CARGAR RADIOS
  // =========================================================

  const cargarRadios = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from("radios")
      .select("*")
      .order("empresa", { ascending: true })
      .order("usuario", { ascending: true });

    if (error) {
      console.error("Error cargando radios:", error);
      alert("No se pudieron cargar las radios.");
    } else {
      setRadios(data || []);
    }

    setCargando(false);
  };

  // =========================================================
  // OPCIONES DE FILTROS
  // =========================================================

  const empresas = useMemo(() => {
    return [...new Set(
      radios
        .map((radio) => radio.empresa)
        .filter(Boolean)
    )].sort();
  }, [radios]);

  const sedes = useMemo(() => {
    return [...new Set(
      radios
        .map((radio) => radio.sede)
        .filter(Boolean)
    )].sort();
  }, [radios]);

  const marcas = useMemo(() => {
    return [...new Set(
      radios
        .map((radio) => radio.marca)
        .filter(Boolean)
    )].sort();
  }, [radios]);

  // =========================================================
  // FILTRAR
  // =========================================================

  const radiosFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return radios.filter((radio) => {
      const coincideBusqueda =
        !texto ||
        String(radio.usuario || "")
          .toLowerCase()
          .includes(texto) ||
        String(radio.empresa || "")
          .toLowerCase()
          .includes(texto) ||
        String(radio.sede || "")
          .toLowerCase()
          .includes(texto) ||
        String(radio.marca || "")
          .toLowerCase()
          .includes(texto) ||
        String(radio.modelo || "")
          .toLowerCase()
          .includes(texto) ||
        String(radio.numero_serie || "")
          .toLowerCase()
          .includes(texto);

      const coincideEmpresa =
        !filtroEmpresa ||
        String(radio.empresa || "") === filtroEmpresa;

      const coincideSede =
        !filtroSede ||
        String(radio.sede || "") === filtroSede;

      const coincideMarca =
        !filtroMarca ||
        String(radio.marca || "") === filtroMarca;

      return (
        coincideBusqueda &&
        coincideEmpresa &&
        coincideSede &&
        coincideMarca
      );
    });
  }, [
    radios,
    busqueda,
    filtroEmpresa,
    filtroSede,
    filtroMarca,
  ]);

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEmpresa("");
    setFiltroSede("");
    setFiltroMarca("");
  };

  // =========================================================
  // REPORTE EXCEL
  // =========================================================

  const generarReporte = () => {
    if (radiosFiltradas.length === 0) {
      alert(
        "No hay radios que coincidan con los filtros seleccionados."
      );
      return;
    }

    const datosReporte = radiosFiltradas.map((radio) => ({
      Usuario: radio.usuario || "",
      Empresa: radio.empresa || "",
      Sede: radio.sede || "",
      Marca: radio.marca || "",
      Modelo: radio.modelo || "",
      "Número de serie": radio.numero_serie || "",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosReporte);

    hoja["!cols"] = [
      { wch: 28 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 25 },
    ];

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Radios"
    );

    const fecha = new Date();

    const fechaTexto =
      `${fecha.getFullYear()}-` +
      `${String(fecha.getMonth() + 1).padStart(2, "0")}-` +
      `${String(fecha.getDate()).padStart(2, "0")}`;

    XLSX.writeFile(
      libro,
      `Reporte_Radios_${fechaTexto}.xlsx`
    );
  };

  // =========================================================
  // NUEVA RADIO
  // =========================================================

  const abrirNueva = () => {
    setEditando(null);

    setFormulario({
      usuario: "",
      empresa: "",
      sede: "",
      marca: "",
      modelo: "",
      numero_serie: "",
    });

    setMostrarModal(true);
  };

  // =========================================================
  // EDITAR RADIO
  // =========================================================

  const abrirEditar = (radio) => {
    setEditando(radio);

    setFormulario({
      usuario: radio.usuario || "",
      empresa: radio.empresa || "",
      sede: radio.sede || "",
      marca: radio.marca || "",
      modelo: radio.modelo || "",
      numero_serie: radio.numero_serie || "",
    });

    setMostrarModal(true);
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
  };

  // =========================================================
  // CAMBIAR FORMULARIO
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // =========================================================
  // GUARDAR RADIO
  // =========================================================

  const guardarRadio = async (e) => {
    e.preventDefault();

    const datos = {
      usuario: formulario.usuario.trim(),
      empresa: formulario.empresa.trim(),
      sede: formulario.sede.trim(),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      numero_serie: formulario.numero_serie.trim(),
    };

    if (editando) {
      const { error } = await supabase
        .from("radios")
        .update(datos)
        .eq("id", editando.id);

      if (error) {
        console.error(error);
        alert("No se pudo actualizar la radio.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("radios")
        .insert([datos]);

      if (error) {
        console.error(error);
        alert("No se pudo registrar la radio.");
        return;
      }
    }

    cerrarModal();
    cargarRadios();
  };

  // =========================================================
  // ELIMINAR
  // =========================================================

  const eliminarRadio = async (radio) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la radio de ${
        radio.usuario || "este usuario"
      }?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("radios")
      .delete()
      .eq("id", radio.id);

    if (error) {
      console.error(error);
      alert("No se pudo eliminar la radio.");
      return;
    }

    if (expandido === radio.id) {
      setExpandido(null);
    }

    cargarRadios();
  };

  // =========================================================
  // EXPANDIR
  // =========================================================

  const alternarExpandido = (id) => {
    setExpandido((actual) =>
      actual === id ? null : id
    );
  };

  // =========================================================
  // CAMPO DETALLE
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
    <div className="radios-container">

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <div className="radios-header">

        <div className="titulo-seccion">
          <RadioTower size={28} />

          <div>
            <h1>Radios</h1>

            <p>
              Administración de radios asignadas al personal
            </p>
          </div>
        </div>

        <button
          className="boton-nuevo"
          onClick={abrirNueva}
        >
          <Plus size={19} />
          Nueva radio
        </button>

      </div>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <div className="panel-filtros">

        <div className="fila-filtros">

          {/* BUSCAR */}

          <div className="campo-busqueda">

            <Search size={19} />

            <input
              type="text"
              placeholder="Buscar usuario, empresa, modelo, serie..."
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

          {/* MARCA */}

          <div className="select-filtro">

            <Tag size={18} />

            <select
              value={filtroMarca}
              onChange={(e) =>
                setFiltroMarca(e.target.value)
              }
            >
              <option value="">
                Todas las marcas
              </option>

              {marcas.map((marca) => (
                <option
                  key={marca}
                  value={marca}
                >
                  {marca}
                </option>
              ))}

            </select>

          </div>

        </div>

        <div className="barra-filtros">

          <div className="resultado-filtros">

            <Filter size={17} />

            <span>
              Mostrando{" "}
              <strong>
                {radiosFiltradas.length}
              </strong>{" "}
              de{" "}
              <strong>
                {radios.length}
              </strong>{" "}
              radios
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

      <div className="lista-radios">

        {cargando ? (

          <div className="estado-vacio">
            Cargando radios...
          </div>

        ) : radiosFiltradas.length === 0 ? (

          <div className="estado-vacio">

            <Radio size={42} />

            <h3>
              No hay radios registradas
            </h3>

            <p>
              Presiona "Nueva radio" para registrar
              la primera.
            </p>

          </div>

        ) : (

          radiosFiltradas.map((radio) => {

            const abierto =
              expandido === radio.id;

            return (
              <div
                className={`radio-card ${
                  abierto ? "radio-abierto" : ""
                }`}
                key={radio.id}
              >

                {/* =================================================
                    FILA PRINCIPAL
                ================================================= */}

                <div className="radio-fila">

                  {/* EMPRESA */}

                  <div className="dato-principal">

                    <div className="dato-icono empresa">
                      <Building2 size={19} />
                    </div>

                    <div>
                      <span>EMPRESA</span>

                      <strong>
                        {radio.empresa || "—"}
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
                        {radio.usuario || "—"}
                      </strong>
                    </div>

                  </div>

                  {/* SEDE */}

                  <div className="dato-principal">

                    <div className="dato-icono sede">
                      <MapPin size={19} />
                    </div>

                    <div>
                      <span>SEDE</span>

                      <strong>
                        {radio.sede || "—"}
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

                        alternarExpandido(
                          radio.id
                        );
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
                        abrirEditar(radio)
                      }
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      className="boton-eliminar"
                      title="Eliminar"
                      onClick={() =>
                        eliminarRadio(radio)
                      }
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>

                {/* =================================================
                    DETALLES
                ================================================= */}

                {abierto && (

                  <div className="detalles-radio">

                    <div className="detalles-grid">

                      <CampoDetalle
                        icono={User}
                        etiqueta="Usuario"
                        valor={radio.usuario}
                      />

                      <CampoDetalle
                        icono={Building2}
                        etiqueta="Empresa"
                        valor={radio.empresa}
                      />

                      <CampoDetalle
                        icono={MapPin}
                        etiqueta="Sede"
                        valor={radio.sede}
                      />

                      <CampoDetalle
                        icono={Tag}
                        etiqueta="Marca"
                        valor={radio.marca}
                      />

                      <CampoDetalle
                        icono={Radio}
                        etiqueta="Modelo"
                        valor={radio.modelo}
                      />

                      <CampoDetalle
                        icono={Hash}
                        etiqueta="Número de serie"
                        valor={radio.numero_serie}
                      />

                    </div>

                  </div>

                )}

              </div>
            );
          })
        )}

      </div>

      {/* =====================================================
          MODAL NUEVA / EDITAR RADIO
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
                    ? "Editar radio"
                    : "Nueva radio"}
                </h2>

                <p>
                  {editando
                    ? "Modifica los datos de la radio."
                    : "Registra una nueva radio."}
                </p>

              </div>

              <button
                className="boton-cerrar-modal"
                onClick={cerrarModal}
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={guardarRadio}>

              <div className="form-grid">

                <div className="form-grupo">

                  <label>
                    Usuario
                  </label>

                  <input
                    type="text"
                    value={formulario.usuario}
                    onChange={(e) =>
                      cambiarCampo(
                        "usuario",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="form-grupo">

                  <label>
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
                    required
                  />

                </div>

                <div className="form-grupo">

                  <label>
                    Sede
                  </label>

                  <input
                    type="text"
                    value={formulario.sede}
                    onChange={(e) =>
                      cambiarCampo(
                        "sede",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="form-grupo">

                  <label>
                    Marca
                  </label>

                  <input
                    type="text"
                    value={formulario.marca}
                    onChange={(e) =>
                      cambiarCampo(
                        "marca",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="form-grupo">

                  <label>
                    Modelo
                  </label>

                  <input
                    type="text"
                    value={formulario.modelo}
                    onChange={(e) =>
                      cambiarCampo(
                        "modelo",
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="form-grupo">

                  <label>
                    Número de serie
                  </label>

                  <input
                    type="text"
                    value={
                      formulario.numero_serie
                    }
                    onChange={(e) =>
                      cambiarCampo(
                        "numero_serie",
                        e.target.value
                      )
                    }
                    required
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
                    : "Registrar radio"}
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

        .radios-container {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .radios-header {
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

        .lista-radios {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .radio-card {
          position: relative;
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

        .radio-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: transparent;
          transition: background 0.2s ease;
        }

        .radio-card:hover {
          background: #eef4ff;
          border-color: #7fa4d8;
          box-shadow: 0 4px 14px rgba(52, 93, 157, 0.12);
          transform: translateY(-1px);
        }

        .radio-card:hover::before {
          background: #345D9D;
        }

        .radio-abierto {
          border-color: #b8c8df;
        }

        .radio-fila {
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

        .dato-icono.sede {
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

        .detalles-radio {
          background: #f8fafc;
          border-top: 1px solid #e6eaf0;
          padding: 20px;
        }

        .detalles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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

        /* ESTADO VACÍO */

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
          max-width: 700px;
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

        .form-grupo label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .form-grupo input {
          border: 1px solid #d7dde5;
          border-radius: 8px;
          padding: 10px 11px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #1f2937;
        }

        .form-grupo input:focus {
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

          .radio-fila {
            grid-template-columns: 1fr 1fr;
          }

          .acciones-card {
            justify-content: flex-end;
          }

        }

        @media (max-width: 700px) {

          .radios-header {
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

          .radio-fila {
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

          .modal-contenido {
            max-height: 95vh;
          }

        }

      `}</style>

    </div>
  );
}