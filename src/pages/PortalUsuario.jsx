 JSX
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import emailjs from "@emailjs/browser";
 
// =============================================================
// TEMAS POR EMPRESA
// Cada empresa tiene su propia paleta de colores, logo y nombre.
// Se aplica dinámicamente según el colaborador que inicia sesión.
// =============================================================
const TEMAS = {
  "AURICA": {
    primary: "#305da0",
    dark: "#1a4f8a",
    light: "#ebf4ff",
    border: "#bee3f8",
    text: "#1a365d",
    bg: "#f0f4f8",
    logo: "/icono aurica.svg",
    nombre: "Aurica SAC",
  },
  "MINERALAB": {
    primary: "#8B6914",
    dark: "#6b4f0f",
    light: "#fdf6e3",
    border: "#e9d8a6",
    text: "#4a3300",
    bg: "#faf6ee",
    logo: "/icono mineralab.svg",
    nombre: "Mineralab SAC",
  },
  "METALAB": {
    primary: "#B8860B",
    dark: "#8B6508",
    light: "#fffbeb",
    border: "#fde68a",
    text: "#452c00",
    bg: "#fefce8",
    logo: "/icono metalab.svg",
    nombre: "Metalab SAC",
  },
  "GIANLU": {
    primary: "#C05621",
    dark: "#9C4221",
    light: "#fff7ed",
    border: "#fed7aa",
    text: "#431407",
    bg: "#fef9f5",
    logo: "/Gianlu_imagotipo_principal.png",
    nombre: "Gianlu",
  },
};
 
// Tema por defecto cuando no se encuentra empresa del colaborador
const TEMA_DEFAULT = {
  primary: "#305da0",
  dark: "#1a4f8a",
  light: "#ebf4ff",
  border: "#bee3f8",
  text: "#1a365d",
  bg: "#f0f4f8",
  logo: null,
  nombre: "",
};
 
// =============================================================
// COMPONENTE PRINCIPAL: PortalUsuario
// Permite a un colaborador registrar un ticket de soporte TI.
// Recibe: onVolver (función), userEmail y userName (strings).
// =============================================================
export default function PortalUsuario({ onVolver, userEmail, userName }) {
 
  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // Controlan el flujo de pasos, datos del formulario y UI.
  // ----------------------------------------------------------
  const [paso, setPaso] = useState(1);                          // Paso actual del flujo (1: buscar, 2: formulario)
  const [busqueda, setBusqueda] = useState("");                 // Texto del input de búsqueda de colaborador
  const [sugerencias, setSugerencias] = useState([]);           // Lista de sugerencias al buscar por nombre
  const [colaborador, setColaborador] = useState(null);         // Datos del colaborador seleccionado
  const [tema, setTema] = useState(TEMA_DEFAULT);               // Tema visual activo según empresa
  const [form, setForm] = useState({                            // Datos del formulario del ticket
    descripcion: "",
    categoria_id: "",
    anydesk: "",
  });
  const [categorias, setCategorias] = useState([]);             // Lista de categorías cargadas desde Supabase
  const [enviando, setEnviando] = useState(false);              // Estado de carga al enviar el ticket
  const [enviado, setEnviado] = useState(false);                // Indica si el ticket fue enviado exitosamente
  const [ticketNumero, setTicketNumero] = useState(null);       // ID del ticket generado
  const [cargandoUsuario, setCargandoUsuario] = useState(true); // Muestra pantalla de carga inicial
 
  // ----------------------------------------------------------
  // EFECTO INICIAL
  // Al montar el componente, intenta cargar automáticamente
  // el colaborador usando el email autenticado (userEmail).
  // ----------------------------------------------------------
  useEffect(() => {
    cargarUsuarioAutomatico();
  }, []);
 
  // ----------------------------------------------------------
  // CARGA AUTOMÁTICA DEL COLABORADOR
  // Busca en Supabase el colaborador cuyo correo coincide
  // con el email del usuario autenticado. Si lo encuentra,
  // salta directamente al Paso 2 (formulario del ticket).
  // ----------------------------------------------------------
  const cargarUsuarioAutomatico = async () => {
    if (!userEmail) return;
 
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .eq("correo", userEmail)
      .single();
 
    if (error || !data) {
      console.log("Usuario no encontrado:", userEmail);
      setCargandoUsuario(false);
      return;
    }
 
    setColaborador(data);
    setTema(TEMAS[data.empresa] || TEMA_DEFAULT);
 
    const { data: cats } = await supabase.from("categorias").select("*");
    if (cats) setCategorias(cats);
 
    setPaso(2);
    setCargandoUsuario(false);
  };
 
  // ----------------------------------------------------------
  // BÚSQUEDA MANUAL DE COLABORADOR (Paso 1)
  // Se activa cuando el usuario escribe en el campo de nombre.
  // Busca coincidencias en la tabla "colaboradores" de Supabase.
  // ----------------------------------------------------------
  const buscarColaborador = async (texto) => {
    setBusqueda(texto);
    if (texto.length < 2) { setSugerencias([]); return; }
    const { data } = await supabase
      .from("colaboradores")
      .select("*")
      .ilike("colaborador", `%${texto}%`)
      .limit(5);
    if (data) setSugerencias(data);
  };
 
  // ----------------------------------------------------------
  // SELECCIÓN DE COLABORADOR DESDE SUGERENCIAS
  // Al elegir un colaborador de la lista, carga su tema visual
  // y las categorías disponibles, luego avanza al Paso 2.
  // ----------------------------------------------------------
  const seleccionarColaborador = async (c) => {
    setColaborador(c);
    setBusqueda(c.colaborador);
    setSugerencias([]);
    setTema(TEMAS[c.empresa] || TEMA_DEFAULT);
    const { data } = await supabase.from("categorias").select("*");
    if (data) setCategorias(data);
    setPaso(2);
  };
 
  // ----------------------------------------------------------
  // ENVÍO DEL TICKET
  // Valida los campos obligatorios, inserta el ticket en
  // Supabase y envía dos correos via EmailJS:
  //   1. Notificación al equipo de TI.
  //   2. Confirmación al colaborador.
  // ----------------------------------------------------------
  const enviarTicket = async () => {
    if (!form.descripcion || !form.categoria_id) {
      alert("Por favor completa el detalle del problema y la categoría.");
      return;
    }
    setEnviando(true);
 
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        titulo: form.descripcion,
        descripcion: form.descripcion,
        categoria_id: parseInt(form.categoria_id),
        prioridad: "medio",
        anydesk: form.anydesk || null,
        hostname: colaborador.host,
        estado: "abierto",
        usuario_id: null,
        nombre_colaborador: colaborador.colaborador,
        empresa: colaborador.empresa,
      })
      .select()
      .single();
 
    if (error) {
      alert("Error al enviar ticket: " + error.message);
      setEnviando(false);
      return;
    }
 
    // Parámetros compartidos para los dos correos de EmailJS
    const emailParams = {
      ticket_id: data.id,
      colaborador: colaborador.colaborador,
      empresa: colaborador.empresa,
      host: colaborador.host,
      titulo: form.descripcion,
      descripcion: form.descripcion,
      anydesk: form.anydesk || "No especificado",
      name: colaborador.colaborador,
      email: colaborador.correo,
    };
 
    try {
      // Correo 1: Notificación interna al equipo de TI
      await emailjs.send("service_wzdct0i", "template_cvjx59o", emailParams, "ema3sApQIaIKPzpnq");
      // Correo 2: Confirmación al colaborador
      await emailjs.send("service_wzdct0i", "template_nj9wy5n", emailParams, "ema3sApQIaIKPzpnq");
    } catch (e) {
      console.error("Error enviando correo:", e);
    }
 
    setTicketNumero(data.id);
    setEnviado(true);
    setEnviando(false);
  };
 
  // ----------------------------------------------------------
  // PANTALLA DE CARGA INICIAL
  // Se muestra mientras se consulta el colaborador por email.
  // ----------------------------------------------------------
  if (cargandoUsuario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f4f8" }}>
        <p style={{ color: "#2B6CB0", fontWeight: "600" }}>Cargando información...</p>
      </div>
    );
  }
 
  // ----------------------------------------------------------
  // PANTALLA DE ÉXITO
  // Se muestra tras enviar el ticket correctamente.
  // Ofrece opciones para registrar otro ticket o volver al inicio.
  // ----------------------------------------------------------
  if (enviado) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 transition-all duration-500"
        style={{ background: tema.bg }}
      >
        <div
          className="bg-white rounded-2xl shadow-sm w-full mx-4 md:mx-auto md:max-w-md"
          style={{ border: `1px solid ${tema.border}`, padding: "clamp(24px, 5vw, 40px)" }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: tema.light }}
            >✅</div>
            <h2 className="font-bold mb-2" style={{ color: tema.text, fontSize: "clamp(18px, 4vw, 24px)" }}>
              ¡Ticket Enviado!
            </h2>
            <p className="text-sm mb-1" style={{ color: "#718096" }}>Tu solicitud fue registrada correctamente.</p>
            <p className="font-bold my-4" style={{ color: tema.primary, fontSize: "clamp(16px, 3.5vw, 20px)" }}>
              Ticket #{ticketNumero}
            </p>
            <p className="text-sm mb-6" style={{ color: "#a0aec0" }}>El equipo de TI atenderá tu solicitud a la brevedad.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setEnviado(false);
                  setPaso(1);
                  setBusqueda("");
                  setColaborador(null);
                  setTema(TEMA_DEFAULT);
                  setForm({ descripcion: "", categoria_id: "", anydesk: "" });
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm text-white transition"
                style={{ background: `linear-gradient(135deg, ${tema.dark}, ${tema.primary})` }}
              >
                Registrar otro
              </button>
              <button
                onClick={onVolver}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm transition"
                style={{ border: `1.5px solid ${tema.primary}`, color: tema.primary, background: "transparent" }}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  // ----------------------------------------------------------
  // VISTA PRINCIPAL DEL PORTAL
  // Estructura: botón Volver (fuera de la card) + card con
  // Paso 1 (búsqueda) o Paso 2 (formulario) + footer.
  // ----------------------------------------------------------
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center transition-all duration-500"
      style={{ background: tema.bg, padding: "clamp(16px, 4vw, 32px)" }}
    >
      {/* Contenedor principal con ancho máximo */}
      <div className="w-full" style={{ maxWidth: "min(100%, 520px)" }}>
 
        {/* --------------------------------------------------
            BOTÓN VOLVER — fuera de la card, encima de ella.
            Alineado a la izquierda del contenedor.
        -------------------------------------------------- */}
        <div className="mb-3">
          <button
            onClick={onVolver}
            className="text-sm font-medium transition-all hover:translate-x-[-2px]"
            style={{ color: "#305DA0" }}
          >
            ← Volver
          </button>
        </div>
 
        {/* --------------------------------------------------
            CARD PRINCIPAL
            Contiene el Paso 1 y el Paso 2 condicionalmente.
        -------------------------------------------------- */}
        <div
          className="bg-white rounded-2xl shadow-sm transition-all duration-500"
          style={{ border: `1px solid ${tema.border}`, padding: "clamp(16px, 4vw, 24px)" }}
        >
 
          {/* ------------------------------------------------
              PASO 1 — Búsqueda manual de colaborador
              Solo se muestra si el usuario no fue identificado
              automáticamente por su correo electrónico.
          ------------------------------------------------ */}
          {paso === 1 && (
            <div>
              <h2 className="font-semibold mb-1" style={{ color: "#2d3748", fontSize: "clamp(14px, 3.5vw, 16px)" }}>
                Por favor digita tu nombre
              </h2>
              <p className="mb-4" style={{ color: "#718096", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                Ingresa tu nombre completo para registrar el ticket
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => buscarColaborador(e.target.value)}
                  placeholder="Escribe tu nombre..."
                  className="w-full px-4 rounded-lg focus:outline-none transition"
                  style={{
                    border: "1.5px solid #cbd5e0",
                    color: "#2d3748",
                    background: "#fff",
                    fontSize: "clamp(13px, 3vw, 15px)",
                    padding: "clamp(10px, 2.5vw, 14px) 16px",
                  }}
                  onFocus={(e) => (e.target.style.border = `1.5px solid ${tema.primary}`)}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #cbd5e0")}
                />
 
                {/* Lista desplegable de sugerencias */}
                {sugerencias.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-lg"
                    style={{ background: "#fff", border: "1px solid #e2e8f0" }}
                  >
                    {sugerencias.map((s) => {
                      const t = TEMAS[s.empresa] || TEMA_DEFAULT;
                      return (
                        <button
                          key={s.id}
                          onClick={() => seleccionarColaborador(s)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
                          style={{ fontSize: "clamp(12px, 3vw, 14px)" }}
                        >
                          {t.logo && (
                            <img
                              src={t.logo}
                              alt={s.empresa}
                              className={`w-auto object-contain flex-shrink-0 ${s.empresa === "GIANLU" ? "h-16" : "h-5"}`}
                            />
                          )}
                          <div>
                            <p className="font-medium" style={{ color: "#2d3748" }}>{s.colaborador}</p>
                            <p style={{ color: "#a0aec0", fontSize: "clamp(10px, 2.5vw, 12px)", marginTop: "2px" }}>
                              {s.empresa} · {s.host}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {/* ------------------------------------------------
              PASO 2 — Formulario del ticket
              Se muestra una vez identificado el colaborador.
              Incluye: saludo, info del colaborador, descripción
              del problema, categoría, AnyDesk y botón de envío.
          ------------------------------------------------ */}
          {paso === 2 && (
            <div className="space-y-4">
 
              {/* Saludo personalizado con nombre del usuario */}
              <div className="text-center mb-4">
                <h2 className="font-bold" style={{ color: tema.text, fontSize: "clamp(20px, 5vw, 24px)" }}>
                  Hola, {userName || colaborador?.colaborador || "Usuario"}
                </h2>
                <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>
                  Estamos listos para ayudarte
                </p>
              </div>
 
              {/* Tarjeta de identificación del colaborador (empresa + host) */}
              <div
                className="rounded-lg p-3 flex items-center justify-between transition-all duration-500"
                style={{ background: tema.light, border: `1px solid ${tema.border}` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {tema.logo && (
                    <img src={tema.logo} alt={tema.nombre} className="h-12 w-auto object-contain flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: tema.text, fontSize: "clamp(12px, 3vw, 14px)" }}>
                      {colaborador.colaborador}
                    </p>
                    <p className="truncate" style={{ color: tema.primary, fontSize: "clamp(10px, 2.5vw, 12px)", marginTop: "2px" }}>
                      {colaborador.empresa} · {colaborador.host}
                    </p>
                  </div>
                </div>
              </div>
 
              {/* Campo: descripción del problema (obligatorio) */}
              <div>
                <label className="block font-medium mb-1" style={{ color: "#4a5568", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                  Detalla tu problema *
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe el inconveniente que estás presentando..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff", fontSize: "clamp(13px, 3vw, 15px)" }}
                  onFocus={(e) => (e.target.style.border = `1.5px solid ${tema.primary}`)}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #cbd5e0")}
                />
              </div>
 
              {/* Campo: categoría del ticket (obligatorio) */}
              <div>
                <label className="block font-medium mb-1" style={{ color: "#4a5568", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                  Categoría *
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff", fontSize: "clamp(13px, 3vw, 15px)" }}
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
 
              {/* Campo: ID de AnyDesk (opcional, para soporte remoto) */}
              <div>
                <label className="block font-medium mb-1" style={{ color: "#4a5568", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                  ID AnyDesk (opcional)
                </label>
                <input
                  type="text"
                  value={form.anydesk}
                  onChange={(e) => setForm({ ...form, anydesk: e.target.value })}
                  placeholder="Ej: 123 456 789"
                  className="w-full px-4 py-2.5 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff", fontSize: "clamp(13px, 3vw, 15px)" }}
                  onFocus={(e) => (e.target.style.border = `1.5px solid ${tema.primary}`)}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #cbd5e0")}
                />
              </div>
 
              {/* Botón de envío — deshabilitado mientras se procesa */}
              <button
                onClick={enviarTicket}
                disabled={enviando}
                className="w-full rounded-lg font-semibold text-white transition disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${tema.dark}, ${tema.primary})`,
                  padding: "clamp(10px, 2.5vw, 14px)",
                  fontSize: "clamp(13px, 3vw, 15px)",
                }}
              >
                {enviando ? "Enviando..." : "Enviar Ticket"}
              </button>
            </div>
          )}
        </div>
 
        {/* --------------------------------------------------
            FOOTER — Identidad del grupo empresarial.
        -------------------------------------------------- */}
        <p className="text-center mt-4" style={{ color: "#a0aec0", fontSize: "clamp(10px, 2.5vw, 12px)" }}>
          Grupo Aurica · Aurica SAC · Mineralab SAC · Metalab SAC · Gianlu
        </p>
 
      </div>
    </div>
  );
}
 