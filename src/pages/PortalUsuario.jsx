import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import emailjs from "@emailjs/browser";
import React from "react";
import { CheckCircle2 } from "lucide-react";

const TEMAS = {
  "AURICA": {
    primary: "#345D9D",
    dark: "#345D9D",
    light: "#ebf4ff",
    border: "#bee3f8",
    text: "#1a365d",
    bg: "#f0f4f8",
    logo: "/icono aurica.svg",
    nombre: "Aurica SAC",
  },
  "MINERALAB": {
    primary: "#5F504D",
    dark: "#6b4f0f",
    light: "#fdf6e3",
    border: "#e9d8a6",
    text: "#4a3300",
    bg: "#faf6ee",
    logo: "/icono mineralab.svg",
    nombre: "Mineralab SAC",
  },
  "METALAB": {
    primary: "#B78C30",
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

const TEMA_DEFAULT = {
  primary: "#345D9D",
  dark: "#1a4f8a",
  light: "#ebf4ff",
  border: "#bee3f8",
  text: "#1a365d",
  bg: "#f0f4f8",
  logo: null,
  nombre: "",
};

export default function PortalUsuario({ onVolver, userEmail, userName }) {

  const [paso, setPaso] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [colaborador, setColaborador] = useState(null);
  const [tema, setTema] = useState(TEMA_DEFAULT);
  const [form, setForm] = useState({
    descripcion: "",
    anydesk: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [ticketNumero, setTicketNumero] = useState(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  useEffect(() => {
    cargarUsuarioAutomatico();
  }, []);

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

setForm((prev) => ({
  ...prev,
  anydesk: data.anydesk || "",
}));

setPaso(2);
setCargandoUsuario(false);
  };

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

  const seleccionarColaborador = async (c) => {
    setColaborador(c);
    setBusqueda(c.colaborador);
    setSugerencias([]);
    setTema(TEMAS[c.empresa] || TEMA_DEFAULT);
    setPaso(2);
  };

  const enviarTicket = async () => {
    if (!form.descripcion) {
      alert("Por favor completa el detalle de tu solicitud.");
      return;
    }
    setEnviando(true);

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        titulo: form.descripcion,
        descripcion: form.descripcion,
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

    if (error) { alert("Error al enviar ticket: " + error.message); setEnviando(false); return; }
    if (form.anydesk) {
  await supabase
    .from("colaboradores")
    .update({
      anydesk: form.anydesk,
    })
    .eq("id", colaborador.id);
}

   const emailParams = {
  ticket_id:          data.id,
  colaborador:        colaborador.colaborador,
  empresa:            colaborador.empresa,
  host:               colaborador.host,
  anydesk:            form.anydesk || "No especificado",
  name:               colaborador.colaborador,
  email:              colaborador.correo,
  icono:              "",
  titulo_email:       "Solicitud registrada",
  mensaje_intro:      "Consulta el estado de tu caso con el número de seguimiento",
  label_detalle:      "Descripción",
  detalle:            form.descripcion,
  mensaje_footer:     "Revisaremos tu solicitud y comenzaremos la atención lo antes posible.",
  link_encuesta_html: "",
  // 👇 Esta caja SOLO se manda aquí (al registrar), porque mensaje_intro no incluye el número.
  // En resolverTicket (Tickets.jsx) se manda vacía ("") porque el número ya va en mensaje_intro.
  ticket_box_html: `
    <div style="margin:0 0 28px 0;padding:24px;background:#f0f3f8;border-radius:12px;border:1px solid #dbe3ee;text-align:center;">
      <h2 style="margin:0;color:#345d9d;font-size:42px;font-weight:bold;">
        #${data.id}
      </h2>
      <p style="margin:8px 0 0 0;color:#345d9d;font-size:14px;font-weight:600;">
        Seguimiento de Ticket
      </p>
    </div>
  `,
};

  try {
  console.log("ESTO SE ESTA ENVIANDO:", emailParams.ticket_box_html);

  await emailjs.send(
    "service_wzdct0i",
    "template_cvjx59o",
    emailParams,
    "ema3sApQIaIKPzpnq"
  );

  await emailjs.send(
    "service_wzdct0i",
    "template_nj9wy5n",
    emailParams,
    "ema3sApQIaIKPzpnq"
  );

} catch (e) {
  console.error("EmailJS falló:", e);
}

try {

  console.log("DESTINO:", colaborador.correo);
  console.log("COLABORADOR COMPLETO:", colaborador);

  const brevoResult = await supabase.functions.invoke(
    "enviar-correo",
    {
      body: {
        tipo: "registro",
        ticket_id: data.id,
        colaborador: colaborador.colaborador,
        email: colaborador.correo,
        descripcion: form.descripcion,
        empresa: colaborador.empresa,
        host: colaborador.host,
        anydesk: form.anydesk || "No especificado",
        fecha: new Date().toLocaleString("es-PE"),
        categoria:"Soporte TI",
        titulo: form.descripcion
      }
    }
  );

  console.log("BREVO DATA:", brevoResult.data);
  console.log("BREVO ERROR:", brevoResult.error);

} catch (e) {
  console.error("Brevo falló:", e);
}

    setTicketNumero(data.id);
    setEnviado(true);
    setEnviando(false);
  };

  if (cargandoUsuario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f4f8" }}>
        <div className="text-center">
          <p style={{ color: "#345D9D", fontWeight: "600" }}>Cargando información...</p>
        </div>
      </div>
    );
  }

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
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#EEF4FB" }}
          >
            <CheckCircle2 size={44} color="#345D9D" strokeWidth={2.2} />
          </div>

          <h2 className="font-bold mb-2" style={{ color: "#345D9D", fontSize: "clamp(18px, 4vw, 24px)" }}>
            ¡Solicitud enviada!
          </h2>
          <p className="text-sm mb-1" style={{ color: "#718096" }}>Tu ticket fue registrado correctamente.</p>
          <p className="font-bold my-4" style={{ color: "#345D9D", fontSize: "clamp(16px, 3.5vw, 20px)" }}>
            Ticket #{ticketNumero}
          </p>
          <p className="text-sm mb-6" style={{ color: "#a0aec0" }}>Resolveremos tu caso a la brevedad.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onVolver}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm text-white transition"
              style={{ background: "#345d9d", border: "none" }}
            >
              Volver al inicio
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center transition-all duration-500"
      style={{ background: tema.bg, padding: "clamp(16px, 4vw, 32px)" }}
    >
      <div className="w-full" style={{ maxWidth: "min(100%, 520px)" }}>

        <div className="mb-3">
          <button
            onClick={onVolver}
            className="text-sm font-medium transition-all hover:translate-x-1"
            style={{ color: "#345D9D" }}
          >
            ← Volver
          </button>
        </div>

        <div
          className="bg-white rounded-2xl shadow-sm transition-all duration-500"
          style={{ border: `1px solid ${tema.border}`, padding: "clamp(16px, 4vw, 24px)" }}
        >

          {/* PASO 1 — Búsqueda manual */}
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
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />

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

          {/* PASO 2 — Formulario del ticket */}
          {paso === 2 && (
            <div className="space-y-4">

              <div className="text-center mb-4">
                <h2 className="font-bold" style={{ color: "#345D9D", fontSize: "clamp(20px, 5vw, 24px)" }}>
                  Hola {userName || colaborador?.colaborador || "Usuario"}
                </h2>
                <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>
                  Estamos listos para ayudarte
                </p>
              </div>

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

              {/* Descripción */}
              <div>
                <label className="block font-medium mb-1" style={{ color: "#305DA0", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                  Detalla tu solicitud 
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe el inconveniente que estás presentando..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff", fontSize: "clamp(13px, 3vw, 15px)" }}
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />
              </div>

              {/* AnyDesk */}
              <div>
                <label className="block font-medium mb-1" style={{ color: "#4a5568", fontSize: "clamp(11px, 2.5vw, 13px)" }}>
                  ID AnyDesk (opcional)
                </label>
                  <input
                    type="text"
                    value={form.anydesk}
                    disabled={!!colaborador?.anydesk}
                    onChange={(e) =>
                      setForm({ ...form, anydesk: e.target.value })
                    }
                    placeholder="Ej: 123 456 789"
                    className="w-full px-4 py-2.5 rounded-lg focus:outline-none transition"
                    style={{
                      border: "1.5px solid #cbd5e0",
                      color: "#2d3748",
                      background: colaborador?.anydesk ? "#f8fafc" : "#fff",
                      fontSize: "clamp(13px, 3vw, 15px)",
                      cursor: colaborador?.anydesk ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => {
                      if (!colaborador?.anydesk) {
                        e.target.style.border = `1.5px solid ${tema.primary}`;
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1.5px solid #cbd5e0";
                    }}
                  />
              </div>

              {/* Botón */}
              <div className="text-center">
                  <button
                    onClick={enviarTicket}
                    disabled={enviando}
                    className="rounded-lg font-semibold text-white transition disabled:opacity-50"
                    style={{
                      background: "#345d9d",
                      padding: "clamp(10px, 2.5vw, 14px) clamp(32px, 8vw, 48px)",
                      fontSize: "clamp(13px, 3vw, 15px)",
                    }}
                  >
                    {enviando ? "Enviando..." : "Enviar ticket"}
                  </button>
                </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}