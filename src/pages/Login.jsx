import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../Config/authConfig";

// =============================================================
// COMPONENTE: Login
// Pantalla de inicio de sesión del portal de soporte TI.
// Autentica a los usuarios mediante Microsoft 365 (Azure AD)
// usando la librería MSAL (Microsoft Authentication Library).
//
// No recibe props — usa el hook useMsal() para gestionar
// el estado de autenticación de Microsoft.
// =============================================================
export default function Login() {

  // ----------------------------------------------------------
  // MSAL — Microsoft Authentication Library
  // instance  → objeto principal para ejecutar acciones de auth
  // inProgress → indica si hay una operación MSAL en curso
  //              (evita lanzar dos logins al mismo tiempo)
  // ----------------------------------------------------------
  const { instance, inProgress } = useMsal();

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [loading, setLoading] = useState(false); // Muestra "Conectando..." mientras se redirige
  const [error, setError] = useState("");         // Mensaje de error si el login falla

  // ----------------------------------------------------------
  // HANDLER: Iniciar sesión con Microsoft
  // Verifica que no haya otra operación MSAL activa, luego
  // lanza el flujo de autenticación por redirección (redirect).
  // Si ocurre un error, lo muestra en pantalla.
  // ----------------------------------------------------------
  const handleMicrosoftLogin = async () => {
    try {
      if (inProgress !== InteractionStatus.None) {
        console.log("MSAL en progreso:", inProgress);
        return;
      }
      setLoading(true);
      setError("");
      console.log("Iniciando redirect...");
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.log("ERROR COMPLETO:", err);
      setError("Error: " + err.message);
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // Layout dividido en dos paneles:
  //   - Izquierdo (solo desktop): branding corporativo azul
  //   - Derecho: formulario de login con botón Microsoft 365
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen flex" style={{ background: "#f0f4f8" }}>

      {/* --------------------------------------------------------
          PANEL IZQUIERDO — Solo visible en desktop (lg+)
          Fondo azul corporativo con logo blanco, descripción
          del sistema y copyright al pie.
      -------------------------------------------------------- */}
      <div
        className="hidden lg:flex flex-col w-2/5 p-12 relative"
        style={{ background: "linear-gradient(160deg, #345D9D, #345D9D)" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">

          {/* Logo en blanco usando filtro CSS */}
          <img
            src="/Grupo-Aurica-version_alterna_blanco.png"
            alt="Grupo Aurica"
            className="w-[420px] object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          
          <img
            src="/4xempresasaurica.png"
            alt="Empresas del Grupo"
            className="w-[180px] object-contain -mt-14"
          />
          <div>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.75)" }}>
              Soporte TI — Sistema de tickets
            </p>
          </div>

          {/* Separador decorativo */}
          <div className="w-12 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />

          <p className="text-xs px-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            Plataforma interna para el seguimiento y resolución de incidencias tecnológicas.
          </p>

        </div>

        {/* Copyright fijo al pie del panel izquierdo */}
        <p
          className="text-xs text-center absolute bottom-8 left-0 right-0"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          © 2025 Grupo Aurica — Todos los derechos reservados
        </p>
      </div>

      {/* --------------------------------------------------------
          PANEL DERECHO — Formulario de login
          Ocupa todo el ancho en mobile y el resto en desktop.
      -------------------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* -------------------------------------------------------
              ENCABEZADO MOBILE — Solo visible en pantallas pequeñas
              Muestra el logo a color y el subtítulo del sistema.
          ------------------------------------------------------- */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/grupoaurica-letrasazules.png"
              alt="Grupo Aurica"
              className="w-56 mx-auto mb-4 object-contain"
            />
            <p className="text-sm" style={{ color: "#64748b" }}>
              Soporte TI — Sistema de tickets
            </p>
          </div>

          {/* Título y subtítulo del formulario */}
          <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: "#345D9D" }}>
            Portal de Soporte TI
          </h2>
          <p className="text-sm mb-8 text-center" style={{ color: "#718096" }}>
            Inicia sesión con tu cuenta corporativa
          </p>

          {/* -------------------------------------------------------
              MENSAJE DE ERROR
              Se muestra solo cuando el login falla.
              Contiene el mensaje devuelto por MSAL.
          ------------------------------------------------------- */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Separador visual con etiqueta "Microsoft 365" */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
            <span className="text-xs" style={{ color: "#94a3b8" }}>Microsoft 365</span>
            <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
          </div>

          {/* -------------------------------------------------------
              BOTÓN: Iniciar sesión con Microsoft 365
              Llama a handleMicrosoftLogin al hacer clic.
              Se deshabilita si ya hay un proceso MSAL en curso
              o si loading está activo (para evitar doble clic).
          ------------------------------------------------------- */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={loading || inProgress !== InteractionStatus.None}
            className="w-full py-3 rounded-lg font-semibold text-sm text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #345D9D, #345D9D)" }}
          >
            {loading ? "Conectando..." : "Iniciar sesión con Microsoft 365"}
          </button>

          {/* Footer con identidad del grupo empresarial */}
          <p className="text-center text-xs mt-8" style={{ color: "#a0aec0" }}>
            Grupo Aurica · Aurica · Mineralab · Metalab · Gianlu
          </p>

        </div>
      </div>

    </div>
  );
}