import { useState } from "react";
import { supabase } from "../lib/supabase";
import emailjs from "@emailjs/browser";

const TEMAS = {
  "AURICA SAC": {
    primary: "#2B6CB0",
    dark: "#1a4f8a",
    light: "#ebf4ff",
    border: "#bee3f8",
    text: "#1a365d",
    bg: "#f0f4f8",
    logo: "/icono aurica.svg",
    nombre: "Aurica SAC",
  },
  "MINERALAB SAC": {
    primary: "#8B6914",
    dark: "#6b4f0f",
    light: "#fdf6e3",
    border: "#e9d8a6",
    text: "#4a3300",
    bg: "#faf6ee",
    logo: "/icono mineralab.svg",
    nombre: "Mineralab SAC",
  },
  "METALAB SAC": {
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
    logo: null,
    nombre: "Gianlu",
  },
};

const TEMA_DEFAULT = {
  primary: "#2B6CB0",
  dark: "#1a4f8a",
  light: "#ebf4ff",
  border: "#bee3f8",
  text: "#1a365d",
  bg: "#f0f4f8",
  logo: null,
  nombre: "",
};

export default function PortalUsuario({ onVolver }) {
  const [paso, setPaso] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [colaborador, setColaborador] = useState(null);
  const [tema, setTema] = useState(TEMA_DEFAULT);
  const [form, setForm] = useState({
    titulo: "", descripcion: "", categoria_id: "", anydesk: "",
  });
  const [categorias, setCategorias] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [ticketNumero, setTicketNumero] = useState(null);

  const buscarColaborador = async (texto) => {
    setBusqueda(texto);
    if (texto.length < 2) { setSugerencias([]); return; }
    const { data } = await supabase.from("colaboradores").select("*").ilike("colaborador", `%${texto}%`).limit(5);
    if (data) setSugerencias(data);
  };

  const seleccionarColaborador = async (c) => {
    setColaborador(c);
    setBusqueda(c.colaborador);
    setSugerencias([]);
    const temaEmpresa = TEMAS[c.empresa] || TEMA_DEFAULT;
    setTema(temaEmpresa);
    const { data } = await supabase.from("categorias").select("*");
    if (data) setCategorias(data);
    setPaso(2);
  };

  const enviarTicket = async () => {
    if (!form.titulo || !form.descripcion || !form.categoria_id) {
      alert("Por favor completa título, descripción y categoría.");
      return;
    }
    setEnviando(true);

    const { data, error } = await supabase.from("tickets").insert({
      titulo: form.titulo,
      descripcion: form.descripcion,
      categoria_id: parseInt(form.categoria_id),
      prioridad: "medio",
      anydesk: form.anydesk || null,
      hostname: colaborador.host,
      estado: "abierto",
      usuario_id: null,
      nombre_colaborador: colaborador.colaborador,
      empresa: colaborador.empresa,
    }).select().single();

    if (error) { alert("Error al enviar ticket: " + error.message); setEnviando(false); return; }

    try {
      await emailjs.send(
        "service_wzdct0i",
        "template_cvjx59o",
        {
          ticket_id: data.id,
          colaborador: colaborador.colaborador,
          empresa: colaborador.empresa,
          host: colaborador.host,
          titulo: form.titulo,
          descripcion: form.descripcion,
          anydesk: form.anydesk || "No especificado",
          name: colaborador.colaborador,
          email: "soporte@auricasac.com",
        },
        "ema3sApQIaIKPzpnq"
      );
    } catch (e) {
      console.error("Error enviando correo:", e);
    }

    setTicketNumero(data.id);
    setEnviado(true);
    setEnviando(false);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-500"
        style={{ background: tema.bg }}>
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-md w-full"
          style={{ border: `1px solid ${tema.border}` }}>
          {tema.logo && (
            <img src={tema.logo} alt={tema.nombre} className="h-10 mx-auto mb-4 object-contain" />
          )}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: tema.light }}>✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: tema.text }}>¡Ticket Enviado!</h2>
          <p className="text-sm mb-1" style={{ color: "#718096" }}>Tu solicitud fue registrada correctamente.</p>
          <p className="text-lg font-bold my-4" style={{ color: tema.primary }}>Ticket #{ticketNumero}</p>
          <p className="text-sm mb-8" style={{ color: "#a0aec0" }}>El equipo de TI atenderá tu solicitud a la brevedad.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setEnviado(false); setPaso(1); setBusqueda(""); setColaborador(null);
                setTema(TEMA_DEFAULT);
                setForm({ titulo: "", descripcion: "", categoria_id: "", anydesk: "" });
              }}
              className="px-6 py-2 rounded-lg font-semibold text-sm text-white transition"
              style={{ background: `linear-gradient(135deg, ${tema.dark}, ${tema.primary})` }}
            >
              Registrar otro
            </button>
            <button
              onClick={onVolver}
              className="px-6 py-2 rounded-lg font-semibold text-sm transition"
              style={{ border: `1.5px solid ${tema.primary}`, color: tema.primary, background: "transparent" }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-500"
      style={{ background: tema.bg }}>
      <div className="w-full max-w-lg">

        <div className="text-center mb-8 relative">
          <button
            onClick={onVolver}
            className="absolute left-0 top-1 text-sm flex items-center gap-1 transition"
            style={{ color: "#718096" }}
            onMouseOver={(e) => e.currentTarget.style.color = tema.primary}
            onMouseOut={(e) => e.currentTarget.style.color = "#718096"}
          >
            ← Volver
          </button>

          {tema.logo ? (
            <img src={tema.logo} alt={tema.nombre}
              className="h-12 mx-auto mb-3 object-contain transition-all duration-500" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${tema.dark}, ${tema.primary})` }}>
              🎫
            </div>
          )}

          <h1 className="text-2xl font-bold transition-all duration-500" style={{ color: tema.text }}>
            Soporte TI
          </h1>
          <p className="text-sm mt-1" style={{ color: "#718096" }}>
            {tema.nombre ? `${tema.nombre} — Reporta tu problema aquí` : "Grupo Aurica — Reporta tu problema aquí"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm transition-all duration-500"
          style={{ border: `1px solid ${tema.border}` }}>

          {paso === 1 && (
            <div>
              <h2 className="font-semibold mb-1" style={{ color: "#2d3748" }}>¿Quién eres?</h2>
              <p className="text-xs mb-4" style={{ color: "#718096" }}>Escribe tu nombre para continuar</p>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => buscarColaborador(e.target.value)}
                  placeholder="Escribe tu nombre..."
                  className="w-full text-sm px-4 py-3 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff" }}
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />
                {sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-lg"
                    style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                    {sugerencias.map((s) => {
                      const t = TEMAS[s.empresa] || TEMA_DEFAULT;
                      return (
                        <button key={s.id} onClick={() => seleccionarColaborador(s)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition flex items-center gap-3">
                          {t.logo && (
                            <img src={t.logo} alt={s.empresa} className="h-5 w-auto object-contain flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium" style={{ color: "#2d3748" }}>{s.colaborador}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#a0aec0" }}>{s.empresa} · {s.host}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg p-3 flex items-center justify-between transition-all duration-500"
                style={{ background: tema.light, border: `1px solid ${tema.border}` }}>
                <div className="flex items-center gap-3">
                  {tema.logo && (
                    <img src={tema.logo} alt={tema.nombre} className="h-6 w-auto object-contain" />
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: tema.text }}>{colaborador.colaborador}</p>
                    <p className="text-xs mt-0.5" style={{ color: tema.primary }}>{colaborador.empresa} · {colaborador.host}</p>
                  </div>
                </div>
                <button onClick={() => { setPaso(1); setTema(TEMA_DEFAULT); }}
                  className="text-xs" style={{ color: "#718096" }}>
                  Cambiar
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4a5568" }}>Título del problema *</label>
                <input type="text" value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: No puedo conectarme a internet"
                  className="w-full text-sm px-4 py-2 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff" }}
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4a5568" }}>Descripción detallada *</label>
                <textarea value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={3} className="w-full text-sm px-4 py-2 rounded-lg focus:outline-none resize-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff" }}
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4a5568" }}>Categoría *</label>
                <select value={form.categoria_id}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className="w-full text-sm px-4 py-2 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#4a5568" }}>ID AnyDesk (opcional)</label>
                <input type="text" value={form.anydesk}
                  onChange={(e) => setForm({ ...form, anydesk: e.target.value })}
                  placeholder="Ej: 123 456 789"
                  className="w-full text-sm px-4 py-2 rounded-lg focus:outline-none transition"
                  style={{ border: "1.5px solid #cbd5e0", color: "#2d3748", background: "#fff" }}
                  onFocus={(e) => e.target.style.border = `1.5px solid ${tema.primary}`}
                  onBlur={(e) => e.target.style.border = "1.5px solid #cbd5e0"}
                />
              </div>

              <button onClick={enviarTicket} disabled={enviando}
                className="w-full py-3 rounded-lg font-semibold text-sm text-white transition disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${tema.dark}, ${tema.primary})` }}>
                {enviando ? "Enviando..." : "Enviar Ticket 🚀"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#a0aec0" }}>
          Grupo Aurica · Aurica · Mineralab · Metalab
        </p>
      </div>
    </div>
  );
}