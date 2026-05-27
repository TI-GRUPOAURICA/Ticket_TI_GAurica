import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({
  onRegistrarTicket,
  onSeguimiento
}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {

    setLoading(true);
    setError("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {

      setError("No tienes permisos de administrador");

      await supabase.auth.signOut();

      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (

    <div
      className="min-h-screen flex"
      style={{ background: "#f0f4f8" }}
    >

      {/* PANEL IZQUIERDO */}
      <div
        className="hidden lg:flex flex-col w-2/5 p-12 relative"
        style={{
          background:
            "linear-gradient(160deg, #1a4f8a, #2B6CB0)"
        }}
      >

        <div
          className="flex-1 flex flex-col items-center justify-center text-center gap-6"
        >

          <img
            src="/Grupo-Aurica-version_alterna_blanco.png"
            alt="Grupo Aurica"
            className="w-[420px] object-contain"
            style={{
              filter: "brightness(0) invert(1)"
            }}
          />

          <div>

            <p
              className="text-lg"
              style={{
                color: "rgba(255,255,255,0.75)"
              }}
            >
              Soporte TI — Sistema de tickets
            </p>

          </div>

          <div
            className="w-12 h-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.3)"
            }}
          />

          <p
            className="text-xs px-4"
            style={{
              color: "rgba(255,255,255,0.5)"
            }}
          >
            Plataforma interna para el seguimiento y resolución de incidencias tecnológicas.
          </p>

        </div>

        {/* FOOTER */}
        <p
          className="text-xs text-center absolute bottom-8 left-0 right-0"
          style={{
            color: "rgba(255,255,255,0.3)"
          }}
        >
          © 2025 Grupo Aurica — Todos los derechos reservados
        </p>

      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          {/* MOBILE */}
          <div className="lg:hidden text-center mb-8">

            <img
              src="/Grupo-Aurica-version_alterna_blanco.png"
              alt="Grupo Aurica"
              className="w-56 mx-auto mb-4 object-contain"
            />

            <p
              className="text-sm"
              style={{ color: "#64748b" }}
            >
              Soporte TI — Sistema de tickets
            </p>

          </div>

          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: "#1a365d" }}
          >
            Panel Administrativo
          </h2>

          <p
            className="text-sm mb-8"
            style={{ color: "#718096" }}
          >
            Ingresa tus credenciales para acceder
          </p>

          {error && (

            <div
              className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-200"
            >
              {error}
            </div>

          )}

          <div className="space-y-5">

            {/* EMAIL */}
            <div>

              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#2d3748" }}
              >
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleLogin()
                }
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition"
                style={{
                  border: "1.5px solid #cbd5e0",
                  background: "#fff",
                  color: "#2d3748"
                }}
                placeholder="soporte@grupoaurica.com"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#2d3748" }}
              >
                Contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleLogin()
                }
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition"
                style={{
                  border: "1.5px solid #cbd5e0",
                  background: "#fff",
                  color: "#2d3748"
                }}
                placeholder="••••••••"
              />

            </div>

            {/* LOGIN */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, #1a4f8a, #2B6CB0)"
              }}
            >

              {loading
                ? "Ingresando..."
                : "Ingresar al panel"}

            </button>

          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 my-7">

            <div
              className="flex-1 h-px"
              style={{ background: "#e2e8f0" }}
            />

            <span
              className="text-xs"
              style={{ color: "#94a3b8" }}
            >
              Opciones colaborador
            </span>

            <div
              className="flex-1 h-px"
              style={{ background: "#e2e8f0" }}
            />

          </div>

          {/* BOTONES */}
          <div className="space-y-3">

            {/* REGISTRAR */}
            <button
              onClick={onRegistrarTicket}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition"
              style={{
                border: "1.5px solid #2B6CB0",
                color: "#2B6CB0",
                background: "#ffffff"
              }}
            >
              🎟️ Registrar ticket
            </button>

            {/* SEGUIMIENTO */}
            <button
              onClick={onSeguimiento}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition"
              style={{
                background:
                  "linear-gradient(135deg, #2563eb, #3b82f6)"
              }}
            >
              🔎 Seguimiento de ticket
            </button>

          </div>

          {/* FOOTER */}
          <p
            className="text-center text-xs mt-8"
            style={{ color: "#a0aec0" }}
          >
            Grupo Aurica · Aurica · Mineralab · Metalab · Gianlu
          </p>

        </div>

      </div>

    </div>
  );
}