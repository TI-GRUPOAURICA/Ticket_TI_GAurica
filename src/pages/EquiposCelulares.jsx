import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
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
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function EquiposCelulares() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
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

  // =========================================================
  // CARGAR EQUIPOS
  // =========================================================

  const cargarEquipos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("equipos_celulares")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando equipos:", error);
      alert("Error al cargar los equipos.");
      setEquipos([]);
    } else {
      setEquipos(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  // =========================================================
  // BUSQUEDA
  // =========================================================

  const equiposFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return equipos;

    return equipos.filter((equipo) => {
      return (
        String(equipo.empresa || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.sede || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.personal_asignado || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.telefono || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.marca || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.modelo || "")
          .toLowerCase()
          .includes(texto) ||

        String(equipo.imei || "")
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [equipos, busqueda]);

  // =========================================================
  // FORMULARIO
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const limpiarFormulario = () => {
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

    setEditando(null);
  };

  // =========================================================
  // NUEVO EQUIPO
  // =========================================================

  const abrirNuevo = () => {
    limpiarFormulario();
    setMostrarModal(true);
  };

  // =========================================================
  // EDITAR EQUIPO
  // =========================================================

  const abrirEditar = (equipo) => {
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

    setEditando(equipo.id);
    setMostrarModal(true);
  };

  // =========================================================
  // GUARDAR
  // =========================================================

  const guardarEquipo = async (e) => {
    e.preventDefault();

    if (!formulario.empresa.trim()) {
      alert("Ingresa la empresa.");
      return;
    }

    if (!formulario.personal_asignado.trim()) {
      alert("Ingresa el usuario asignado.");
      return;
    }

    if (!formulario.telefono.trim()) {
      alert("Ingresa el número de celular.");
      return;
    }

    const datos = {
      empresa: formulario.empresa.trim(),
      sede: formulario.sede.trim(),
      personal_asignado:
        formulario.personal_asignado.trim(),
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

    let resultado;

    if (editando) {
      resultado = await supabase
        .from("equipos_celulares")
        .update(datos)
        .eq("id", editando);
    } else {
      resultado = await supabase
        .from("equipos_celulares")
        .insert([datos]);
    }

    if (resultado.error) {
      console.error(
        "Error guardando equipo:",
        resultado.error
      );

      alert(
        `No se pudo guardar el equipo: ${resultado.error.message}`
      );

      return;
    }

    setMostrarModal(false);
    limpiarFormulario();

    await cargarEquipos();
  };

  // =========================================================
  // ELIMINAR
  // =========================================================

  const eliminarEquipo = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este equipo?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("equipos_celulares")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(
        `No se pudo eliminar: ${error.message}`
      );
      return;
    }

    if (expandido === id) {
      setExpandido(null);
    }

    await cargarEquipos();
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
  // RENDER
  // =========================================================

  return (
    <div className="equipos-page">

      {/* =====================================================
          CABECERA
      ===================================================== */}

      <div className="equipos-titulo">

        <div>
          <h1>Equipos celulares</h1>

          <p>
            Gestión de celulares asignados al personal
          </p>
        </div>

        <button
          className="boton-agregar-equipo"
          onClick={abrirNuevo}
        >
          <Plus size={18} />
          Agregar equipo
        </button>

      </div>

      {/* =====================================================
          BUSCADOR
      ===================================================== */}

      <div className="equipos-toolbar">

        <div className="equipos-buscador">

          <Search size={19} />

          <input
            type="text"
            placeholder="Buscar empresa, usuario, celular, IMEI..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          {busqueda && (
            <button
              className="limpiar-busqueda"
              onClick={() => setBusqueda("")}
            >
              <X size={17} />
            </button>
          )}

        </div>

        <span className="cantidad-equipos">
          {equiposFiltrados.length} equipos
        </span>

      </div>

      {/* =====================================================
          LISTA
      ===================================================== */}

      <div className="lista-equipos">

        {loading ? (

          <div className="estado-equipos">
            <Smartphone size={35} />
            <p>Cargando equipos...</p>
          </div>

        ) : equiposFiltrados.length === 0 ? (

          <div className="estado-equipos">

            <Smartphone size={42} />

            <h3>
              No hay equipos registrados
            </h3>

            <p>
              Agrega un equipo para comenzar.
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

                <div
                  className="equipo-fila"
                  onClick={() =>
                    alternarExpandido(equipo.id)
                  }
                >

                  {/* EMPRESA */}

                  <div className="equipo-empresa">

                    <span className="etiqueta">
                      EMPRESA
                    </span>

                    <div className="empresa-contenido">

                      <Building2 size={17} />

                      <strong>
                        {equipo.empresa || "-"}
                      </strong>

                    </div>

                  </div>

                  {/* USUARIO */}

                  <div className="equipo-usuario">

                    <span className="etiqueta">
                      USUARIO ASIGNADO
                    </span>

                    <div className="usuario-contenido">

                      <div className="avatar-usuario">
                        {(
                          equipo.personal_asignado ||
                          "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <strong>
                        {equipo.personal_asignado ||
                          "-"}
                      </strong>

                    </div>

                  </div>

                  {/* CELULAR */}

                  <div className="equipo-celular">

                    <span className="etiqueta">
                      CELULAR
                    </span>

                    <div className="celular-contenido">

                      <Smartphone size={18} />

                      <strong>
                        {equipo.telefono || "-"}
                      </strong>

                    </div>

                  </div>

                  {/* FLECHA */}

                  <button
                    className="boton-expandir"
                    onClick={(e) => {
                      e.stopPropagation();

                      alternarExpandido(
                        equipo.id
                      );
                    }}
                  >
                    {abierto ? (
                      <ChevronDown size={21} />
                    ) : (
                      <ChevronRight size={21} />
                    )}
                  </button>

                </div>

                {/* =================================================
                    DETALLES
                ================================================= */}

                {abierto && (

                  <div className="equipo-detalles">

                    <div className="detalles-grid">

                      <Detalle
                        icono={<Building2 size={17} />}
                        titulo="Empresa"
                        valor={equipo.empresa}
                      />

                      <Detalle
                        icono={<MapPin size={17} />}
                        titulo="Sede"
                        valor={equipo.sede}
                      />

                      <Detalle
                        icono={<User size={17} />}
                        titulo="Personal asignado"
                        valor={
                          equipo.personal_asignado
                        }
                      />

                      <Detalle
                        icono={<Phone size={17} />}
                        titulo="Teléfono"
                        valor={equipo.telefono}
                      />

                      <Detalle
                        icono={<CreditCard size={17} />}
                        titulo="Plan"
                        valor={
                          equipo.plan !== null &&
                          equipo.plan !== undefined
                            ? `S/ ${Number(
                                equipo.plan
                              ).toFixed(2)}`
                            : "-"
                        }
                      />

                      <Detalle
                        icono={<Tag size={17} />}
                        titulo="Marca"
                        valor={equipo.marca}
                      />

                      <Detalle
                        icono={<Smartphone size={17} />}
                        titulo="Modelo"
                        valor={equipo.modelo}
                      />

                      <Detalle
                        icono={<Hash size={17} />}
                        titulo="IMEI"
                        valor={equipo.imei}
                      />

                    </div>

                    {/* OBSERVACION */}

                    {equipo.observacion && (

                      <div className="observacion-equipo">

                        <div className="observacion-titulo">

                          <MessageSquare size={17} />

                          <span>
                            Observación
                          </span>

                        </div>

                        <p>
                          {equipo.observacion}
                        </p>

                      </div>

                    )}

                    {/* ACCIONES */}

                    <div className="acciones-equipo">

                      <button
                        className="boton-editar"
                        onClick={() =>
                          abrirEditar(equipo)
                        }
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        className="boton-eliminar"
                        onClick={() =>
                          eliminarEquipo(
                            equipo.id
                          )
                        }
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>

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
          className="modal-fondo"
          onClick={() =>
            setMostrarModal(false)
          }
        >

          <div
            className="modal-equipo"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-cabecera">

              <div>

                <h2>
                  {editando
                    ? "Editar equipo"
                    : "Agregar equipo"}
                </h2>

                <p>
                  Completa la información del celular.
                </p>

              </div>

              <button
                className="modal-cerrar"
                onClick={() =>
                  setMostrarModal(false)
                }
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={guardarEquipo}>

              <div className="formulario-grid">

                <Campo
                  label="Empresa"
                  value={formulario.empresa}
                  onChange={(v) =>
                    cambiarCampo(
                      "empresa",
                      v
                    )
                  }
                  placeholder="Ej. AURICA"
                />

                <Campo
                  label="Sede"
                  value={formulario.sede}
                  onChange={(v) =>
                    cambiarCampo(
                      "sede",
                      v
                    )
                  }
                  placeholder="Ej. LIMA"
                />

                <Campo
                  label="Personal asignado"
                  value={
                    formulario.personal_asignado
                  }
                  onChange={(v) =>
                    cambiarCampo(
                      "personal_asignado",
                      v
                    )
                  }
                  placeholder="Nombre del usuario"
                />

                <Campo
                  label="Teléfono"
                  value={
                    formulario.telefono
                  }
                  onChange={(v) =>
                    cambiarCampo(
                      "telefono",
                      v
                    )
                  }
                  placeholder="Ej. 937123456"
                />

                <Campo
                  label="Plan"
                  value={formulario.plan}
                  onChange={(v) =>
                    cambiarCampo(
                      "plan",
                      v
                    )
                  }
                  placeholder="Ej. 39.90"
                  type="number"
                  step="0.01"
                />

                <Campo
                  label="Marca"
                  value={formulario.marca}
                  onChange={(v) =>
                    cambiarCampo(
                      "marca",
                      v
                    )
                  }
                  placeholder="Ej. REDMI"
                />

                <Campo
                  label="Modelo"
                  value={formulario.modelo}
                  onChange={(v) =>
                    cambiarCampo(
                      "modelo",
                      v
                    )
                  }
                  placeholder="Ej. A1"
                />

                <Campo
                  label="IMEI"
                  value={formulario.imei}
                  onChange={(v) =>
                    cambiarCampo(
                      "imei",
                      v
                    )
                  }
                  placeholder="Número IMEI"
                />

              </div>

              <div className="campo-completo">

                <label>
                  Observación
                </label>

                <textarea
                  rows="3"
                  value={
                    formulario.observacion
                  }
                  onChange={(e) =>
                    cambiarCampo(
                      "observacion",
                      e.target.value
                    )
                  }
                  placeholder="Escribe una observación..."
                />

              </div>

              <div className="modal-acciones">

                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={() =>
                    setMostrarModal(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="boton-guardar"
                >
                  {editando
                    ? "Guardar cambios"
                    : "Agregar equipo"}
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

        .equipos-page {
          width: 100%;
          padding: 24px;
        }

        .equipos-titulo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .equipos-titulo h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #172033;
        }

        .equipos-titulo p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .boton-agregar-equipo {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: #16a34a;
          color: white;
          padding: 11px 17px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .boton-agregar-equipo:hover {
          background: #15803d;
        }

        .equipos-toolbar {
          background: white;
          border: 1px solid #dbe5f0;
          border-radius: 13px;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .equipos-buscador {
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          color: #94a3b8;
        }

        .equipos-buscador > svg {
          position: absolute;
          left: 12px;
        }

        .equipos-buscador input {
          width: 100%;
          height: 42px;
          border: 1px solid #dce6f2;
          border-radius: 8px;
          padding: 0 42px;
          font-size: 14px;
          outline: none;
          color: #263449;
        }

        .equipos-buscador input:focus {
          border-color: #8db5e8;
        }

        .limpiar-busqueda {
          position: absolute;
          right: 9px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .cantidad-equipos {
          white-space: nowrap;
          color: #64748b;
          font-size: 13px;
        }

        .lista-equipos {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .equipo-card {
          background: white;
          border: 1px solid #dbe5f0;
          border-radius: 13px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(30, 64, 175, .04);
          transition: .2s;
        }

        .equipo-card:hover {
          border-color: #c4d5e9;
        }

        .equipo-abierto {
          border-color: #aac4e2;
        }

        .equipo-fila {
          min-height: 86px;
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr 58px;
          align-items: center;
          cursor: pointer;
        }

        .equipo-empresa,
        .equipo-usuario,
        .equipo-celular {
          padding: 14px 20px;
          border-right: 1px solid #edf2f7;
        }

        .etiqueta {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .6px;
          margin-bottom: 7px;
        }

        .empresa-contenido,
        .celular-contenido,
        .usuario-contenido {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .empresa-contenido svg,
        .celular-contenido svg {
          color: #416da7;
        }

        .equipo-fila strong {
          color: #263449;
          font-size: 14px;
        }

        .avatar-usuario {
          width: 32px;
          height: 32px;
          min-width: 32px;
          border-radius: 50%;
          background: #edf5ff;
          color: #3165a3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .boton-expandir {
          width: 35px;
          height: 35px;
          border: 1px solid #d8e3ef;
          border-radius: 50%;
          background: white;
          color: #526b88;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: auto;
        }

        .boton-expandir:hover {
          background: #f4f8fc;
        }

        .equipo-detalles {
          border-top: 1px solid #e5edf5;
          background: #f8fafc;
          padding: 20px;
        }

        .detalles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .detalle-item {
          background: white;
          border: 1px solid #e3eaf2;
          border-radius: 9px;
          padding: 13px;
        }

        .detalle-cabecera {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #6b7d92;
          margin-bottom: 7px;
        }

        .detalle-cabecera span {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .detalle-valor {
          font-size: 13px;
          font-weight: 600;
          color: #263449;
          word-break: break-word;
        }

        .observacion-equipo {
          margin-top: 12px;
          padding: 14px;
          background: white;
          border: 1px solid #e3eaf2;
          border-radius: 9px;
        }

        .observacion-titulo {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #6b7d92;
          margin-bottom: 7px;
        }

        .observacion-titulo span {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .observacion-equipo p {
          margin: 0;
          color: #334155;
          font-size: 13px;
        }

        .acciones-equipo {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 15px;
        }

        .boton-editar,
        .boton-eliminar {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 8px;
          background: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .boton-editar {
          border: 1px solid #cbd5e1;
          color: #334155;
        }

        .boton-eliminar {
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .estado-equipos {
          background: white;
          border: 1px solid #dbe5f0;
          border-radius: 13px;
          padding: 70px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .estado-equipos h3 {
          margin: 12px 0 5px;
          color: #334155;
          font-size: 16px;
        }

        .estado-equipos p {
          margin: 0;
          font-size: 14px;
        }

        /* =========================
           MODAL
        ========================= */

        .modal-fondo {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, .45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .modal-equipo {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 25px 70px rgba(0,0,0,.2);
        }

        .modal-cabecera {
          padding: 21px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf2f7;
        }

        .modal-cabecera h2 {
          margin: 0;
          font-size: 20px;
          color: #172033;
        }

        .modal-cabecera p {
          margin: 5px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .modal-cerrar {
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .modal-equipo form {
          padding: 24px;
        }

        .formulario-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .campo-formulario {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .campo-formulario label,
        .campo-completo label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .campo-formulario input,
        .campo-completo textarea {
          width: 100%;
          border: 1px solid #d5deea;
          border-radius: 8px;
          padding: 10px 12px;
          font-family: inherit;
          font-size: 14px;
          outline: none;
        }

        .campo-formulario input {
          height: 42px;
        }

        .campo-formulario input:focus,
        .campo-completo textarea:focus {
          border-color: #75a9df;
        }

        .campo-completo {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .modal-acciones {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .boton-cancelar,
        .boton-guardar {
          padding: 10px 17px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .boton-cancelar {
          background: white;
          border: 1px solid #d5deea;
          color: #475569;
        }

        .boton-guardar {
          background: #16a34a;
          border: none;
          color: white;
        }

        @media (max-width: 900px) {

          .detalles-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .equipo-fila {
            grid-template-columns: 1fr 1.2fr 1fr 50px;
          }

        }

        @media (max-width: 650px) {

          .equipos-page {
            padding: 15px;
          }

          .equipos-titulo {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .equipos-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .cantidad-equipos {
            align-self: flex-end;
          }

          .equipo-fila {
            grid-template-columns: 1fr 45px;
          }

          .equipo-celular {
            display: none;
          }

          .equipo-empresa,
          .equipo-usuario {
            border-right: none;
          }

          .detalles-grid {
            grid-template-columns: 1fr;
          }

          .formulario-grid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>
    </div>
  );
}


// =========================================================
// COMPONENTE DETALLE
// =========================================================

function Detalle({
  icono,
  titulo,
  valor,
}) {
  return (
    <div className="detalle-item">

      <div className="detalle-cabecera">

        {icono}

        <span>
          {titulo}
        </span>

      </div>

      <div className="detalle-valor">
        {valor || "-"}
      </div>

    </div>
  );
}


// =========================================================
// COMPONENTE CAMPO
// =========================================================

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}) {
  return (
    <div className="campo-formulario">

      <label>
        {label}
      </label>

      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

    </div>
  );
}