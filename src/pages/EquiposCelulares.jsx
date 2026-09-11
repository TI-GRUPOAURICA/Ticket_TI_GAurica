import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function EquiposCelulares() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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
  // OBTENER EQUIPOS
  // =========================================================

  const cargarEquipos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("equipos_celulares")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error cargando equipos:", error);
      alert("No se pudieron cargar los equipos.");
    } else {
      setEquipos(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  // =========================================================
  // MANEJAR INPUTS
  // =========================================================

  const cambiarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // =========================================================
  // LIMPIAR FORMULARIO
  // =========================================================

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
  // ABRIR AGREGAR
  // =========================================================

  const abrirAgregar = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  // =========================================================
  // ABRIR EDITAR
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
    setMostrarFormulario(true);
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
      alert("Ingresa el personal asignado.");
      return;
    }

    if (!formulario.telefono.trim()) {
      alert("Ingresa el teléfono.");
      return;
    }

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

    let error;

    if (editando) {
      const resultado = await supabase
        .from("equipos_celulares")
        .update(datos)
        .eq("id", editando);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("equipos_celulares")
        .insert([datos]);

      error = resultado.error;
    }

    if (error) {
      console.error(error);
      alert("Ocurrió un error al guardar el equipo.");
      return;
    }

    setMostrarFormulario(false);
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
      alert("No se pudo eliminar el equipo.");
      return;
    }

    if (expandido === id) {
      setExpandido(null);
    }

    await cargarEquipos();
  };

  // =========================================================
  // FILTRO
  // =========================================================

  const equiposFiltrados = equipos.filter((equipo) => {
    const texto = busqueda.toLowerCase();

    return (
      (equipo.empresa || "").toLowerCase().includes(texto) ||
      (equipo.sede || "").toLowerCase().includes(texto) ||
      (equipo.personal_asignado || "")
        .toLowerCase()
        .includes(texto) ||
      (equipo.telefono || "").toLowerCase().includes(texto) ||
      (equipo.marca || "").toLowerCase().includes(texto) ||
      (equipo.modelo || "").toLowerCase().includes(texto) ||
      (equipo.imei || "").toLowerCase().includes(texto)
    );
  });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="equipos-container">

      {/* ENCABEZADO */}

      <div className="equipos-header">

        <div>
          <h2>Equipos celulares</h2>

          <p>
            Administración de celulares asignados
          </p>
        </div>

        <button
          className="btn-agregar"
          onClick={abrirAgregar}
        >
          + Agregar equipo
        </button>

      </div>

      {/* BUSCADOR */}

      <div className="buscador-container">

        <div className="buscador">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Buscar por empresa, usuario, teléfono, IMEI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {busqueda && (
            <button
              className="limpiar-busqueda"
              onClick={() => setBusqueda("")}
            >
              ×
            </button>
          )}

        </div>

        <div className="contador">
          {equiposFiltrados.length} equipos
        </div>

      </div>

      {/* TABLA */}

      <div className="equipos-lista">

        {loading ? (

          <div className="estado">
            Cargando equipos...
          </div>

        ) : equiposFiltrados.length === 0 ? (

          <div className="estado">

            <div className="estado-icono">
              📱
            </div>

            <h3>No hay equipos</h3>

            <p>
              No se encontraron celulares registrados.
            </p>

          </div>

        ) : (

          equiposFiltrados.map((equipo) => {

            const estaExpandido =
              expandido === equipo.id;

            return (

              <div
                className={`equipo-card ${
                  estaExpandido ? "expandido" : ""
                }`}
                key={equipo.id}
              >

                {/* FILA PRINCIPAL */}

                <div
                  className="equipo-fila"
                  onClick={() =>
                    setExpandido(
                      estaExpandido
                        ? null
                        : equipo.id
                    )
                  }
                >

                  {/* EMPRESA */}

                  <div className="equipo-col empresa-col">

                    <span className="col-label">
                      EMPRESA
                    </span>

                    <strong>
                      {equipo.empresa || "-"}
                    </strong>

                  </div>

                  {/* USUARIO */}

                  <div className="equipo-col usuario-col">

                    <span className="col-label">
                      USUARIO ASIGNADO
                    </span>

                    <div className="usuario-info">

                      <div className="avatar">
                        {(equipo.personal_asignado || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <strong>
                        {equipo.personal_asignado || "-"}
                      </strong>

                    </div>

                  </div>

                  {/* CELULAR */}

                  <div className="equipo-col celular-col">

                    <span className="col-label">
                      CELULAR
                    </span>

                    <div className="telefono">

                      <span className="telefono-icon">
                        📱
                      </span>

                      <strong>
                        {equipo.telefono || "-"}
                      </strong>

                    </div>

                  </div>

                  {/* ACCIONES */}

                  <div className="equipo-actions">

                    <button
                      className="btn-flecha"
                      onClick={(e) => {
                        e.stopPropagation();

                        setExpandido(
                          estaExpandido
                            ? null
                            : equipo.id
                        );
                      }}
                    >
                      {estaExpandido ? "⌃" : "›"}
                    </button>

                  </div>

                </div>

                {/* INFORMACIÓN EXPANDIDA */}

                {estaExpandido && (

                  <div className="equipo-detalles">

                    <div className="detalle-grid">

                      <Detalle
                        titulo="Empresa"
                        valor={equipo.empresa}
                      />

                      <Detalle
                        titulo="Sede"
                        valor={equipo.sede}
                      />

                      <Detalle
                        titulo="Personal asignado"
                        valor={equipo.personal_asignado}
                      />

                      <Detalle
                        titulo="Teléfono"
                        valor={equipo.telefono}
                      />

                      <Detalle
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
                        titulo="Marca"
                        valor={equipo.marca}
                      />

                      <Detalle
                        titulo="Modelo"
                        valor={equipo.modelo}
                      />

                      <Detalle
                        titulo="IMEI"
                        valor={equipo.imei}
                        completo
                      />

                    </div>

                    {/* OBSERVACIÓN */}

                    {equipo.observacion && (

                      <div className="observacion">

                        <span>
                          OBSERVACIÓN
                        </span>

                        <p>
                          {equipo.observacion}
                        </p>

                      </div>

                    )}

                    {/* BOTONES */}

                    <div className="detalle-footer">

                      <button
                        className="btn-editar"
                        onClick={() =>
                          abrirEditar(equipo)
                        }
                      >
                        ✎ Editar
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={() =>
                          eliminarEquipo(equipo.id)
                        }
                      >
                        🗑 Eliminar
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
          MODAL AGREGAR / EDITAR
      ===================================================== */}

      {mostrarFormulario && (

        <div
          className="modal-overlay"
          onClick={() =>
            setMostrarFormulario(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editando
                    ? "Editar equipo"
                    : "Agregar equipo"}
                </h2>

                <p>
                  Ingresa los datos del celular.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setMostrarFormulario(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={guardarEquipo}>

              <div className="form-grid">

                <Campo
                  label="Empresa"
                  value={formulario.empresa}
                  onChange={(v) =>
                    cambiarCampo("empresa", v)
                  }
                  placeholder="Ej. AURICA"
                />

                <Campo
                  label="Sede"
                  value={formulario.sede}
                  onChange={(v) =>
                    cambiarCampo("sede", v)
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
                  value={formulario.telefono}
                  onChange={(v) =>
                    cambiarCampo("telefono", v)
                  }
                  placeholder="Ej. 937123456"
                />

                <Campo
                  label="Plan"
                  value={formulario.plan}
                  onChange={(v) =>
                    cambiarCampo("plan", v)
                  }
                  placeholder="Ej. 39.90"
                  type="number"
                  step="0.01"
                />

                <Campo
                  label="Marca"
                  value={formulario.marca}
                  onChange={(v) =>
                    cambiarCampo("marca", v)
                  }
                  placeholder="Ej. REDMI"
                />

                <Campo
                  label="Modelo"
                  value={formulario.modelo}
                  onChange={(v) =>
                    cambiarCampo("modelo", v)
                  }
                  placeholder="Ej. A1"
                />

                <Campo
                  label="IMEI"
                  value={formulario.imei}
                  onChange={(v) =>
                    cambiarCampo("imei", v)
                  }
                  placeholder="Número IMEI"
                />

              </div>

              <div className="form-group">

                <label>
                  Observación
                </label>

                <textarea
                  value={formulario.observacion}
                  onChange={(e) =>
                    cambiarCampo(
                      "observacion",
                      e.target.value
                    )
                  }
                  placeholder="Observaciones del equipo..."
                  rows="3"
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() =>
                    setMostrarFormulario(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-guardar"
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

      {/* CSS */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .equipos-container {
          width: 100%;
          padding: 24px;
          color: #172033;
        }

        .equipos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .equipos-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
        }

        .equipos-header p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .btn-agregar {
          border: none;
          background: #16a34a;
          color: white;
          padding: 11px 18px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: .2s;
        }

        .btn-agregar:hover {
          background: #15803d;
        }

        .buscador-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 16px;
        }

        .buscador {
          position: relative;
          width: 100%;
          max-width: 520px;
        }

        .buscador span {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 20px;
        }

        .buscador input {
          width: 100%;
          height: 43px;
          border: 1px solid #dbe4f0;
          border-radius: 9px;
          padding: 0 40px;
          outline: none;
          font-size: 14px;
          background: white;
        }

        .buscador input:focus {
          border-color: #93c5fd;
        }

        .limpiar-busqueda {
          position: absolute;
          right: 10px;
          top: 8px;
          border: none;
          background: transparent;
          font-size: 22px;
          color: #64748b;
          cursor: pointer;
        }

        .contador {
          font-size: 13px;
          color: #64748b;
        }

        .equipos-lista {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .equipo-card {
          background: white;
          border: 1px solid #dbe5f0;
          border-radius: 13px;
          overflow: hidden;
          box-shadow: 0 2px 7px rgba(30, 64, 175, .05);
          transition: .2s;
        }

        .equipo-card:hover {
          border-color: #c4d5e9;
        }

        .equipo-card.expandido {
          border-color: #b8cce3;
        }

        .equipo-fila {
          min-height: 86px;
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr 55px;
          align-items: center;
          cursor: pointer;
        }

        .equipo-col {
          padding: 15px 22px;
          border-right: 1px solid #edf2f7;
        }

        .col-label {
          display: block;
          font-size: 10px;
          color: #8a97a8;
          font-weight: 700;
          letter-spacing: .6px;
          margin-bottom: 7px;
        }

        .equipo-col strong {
          font-size: 14px;
          color: #243047;
        }

        .usuario-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #edf5ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .telefono {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .telefono-icon {
          font-size: 16px;
        }

        .equipo-actions {
          display: flex;
          justify-content: center;
        }

        .btn-flecha {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #d9e3ef;
          background: white;
          color: #49617c;
          font-size: 23px;
          line-height: 1;
          cursor: pointer;
          transition: .2s;
        }

        .btn-flecha:hover {
          background: #f1f6fb;
        }

        .equipo-detalles {
          border-top: 1px solid #e7edf4;
          background: #f9fbfd;
          padding: 22px;
        }

        .detalle-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .detalle {
          background: white;
          border: 1px solid #e6edf5;
          border-radius: 9px;
          padding: 13px;
        }

        .detalle span {
          display: block;
          font-size: 10px;
          color: #8996a7;
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .detalle strong {
          display: block;
          font-size: 13px;
          color: #263449;
          word-break: break-word;
        }

        .observacion {
          margin-top: 15px;
          padding: 14px;
          border-radius: 9px;
          background: #fff;
          border: 1px solid #e6edf5;
        }

        .observacion span {
          display: block;
          font-size: 10px;
          color: #8996a7;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .observacion p {
          margin: 0;
          font-size: 13px;
          color: #263449;
        }

        .detalle-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
        }

        .btn-editar,
        .btn-eliminar {
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          background: white;
        }

        .btn-editar {
          border: 1px solid #cbd5e1;
          color: #334155;
        }

        .btn-eliminar {
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .estado {
          text-align: center;
          padding: 70px 20px;
          color: #64748b;
        }

        .estado-icono {
          font-size: 35px;
          margin-bottom: 10px;
        }

        .estado h3 {
          color: #334155;
          margin: 0 0 5px;
        }

        .estado p {
          margin: 0;
          font-size: 14px;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, .45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .modal {
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 22px 24px;
          border-bottom: 1px solid #edf2f7;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .modal-close {
          border: none;
          background: transparent;
          font-size: 28px;
          color: #64748b;
          cursor: pointer;
        }

        form {
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .form-group {
          margin-top: 17px;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          border: 1px solid #d5deea;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #60a5fa;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }

        .btn-cancelar,
        .btn-guardar {
          padding: 10px 17px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-cancelar {
          background: white;
          border: 1px solid #d5deea;
          color: #475569;
        }

        .btn-guardar {
          background: #16a34a;
          border: none;
          color: white;
        }

        @media (max-width: 900px) {

          .equipo-fila {
            grid-template-columns: 1fr 1fr 1fr 45px;
          }

          .detalle-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 650px) {

          .equipos-container {
            padding: 14px;
          }

          .equipos-header {
            align-items: flex-start;
            gap: 15px;
            flex-direction: column;
          }

          .equipo-fila {
            grid-template-columns: 1fr 45px;
          }

          .empresa-col,
          .usuario-col {
            border-right: none;
          }

          .celular-col {
            display: none;
          }

          .detalle-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
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

function Detalle({ titulo, valor }) {

  return (
    <div className="detalle">

      <span>
        {titulo}
      </span>

      <strong>
        {valor || "-"}
      </strong>

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
    <div className="form-group">

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