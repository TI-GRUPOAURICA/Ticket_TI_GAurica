import { Ticket, ClipboardList } from "lucide-react";
 
// =============================================================
// COMPONENTE: ColaboradorHome
// Pantalla principal que ve el colaborador tras iniciar sesión.
// Muestra su nombre, dos opciones de acción y un botón de salida.
//
// Props:
//   user              → objeto del usuario autenticado (contiene .name)
//   onRegistrarTicket → función que abre el portal para crear un ticket
//   onSeguimiento     → función que abre el seguimiento de tickets
//   onLogout          → función que cierra la sesión del usuario
// =============================================================
export default function ColaboradorHome({
  user,
  onRegistrarTicket,
  onSeguimiento,
  onLogout,
}) {
  return (
 
    // ----------------------------------------------------------
    // FONDO Y CONTENEDOR PRINCIPAL
    // Centra todo el contenido vertical y horizontalmente
    // con el color de fondo corporativo del sistema.
    // ----------------------------------------------------------
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#f0f4f8" }}
    >
      <div className="w-full max-w-md">
 
        {/* --------------------------------------------------------
            ENCABEZADO
            Muestra el logo del Grupo Aurica y saluda al colaborador
            usando su nombre obtenido del objeto `user`.
            Si no hay nombre disponible, muestra "Colaborador".
        -------------------------------------------------------- */}
        <div className="text-center mb-10">
 
          <img
            src="/grupoaurica-letrasazules.png"
            alt="Grupo Aurica"
            className="w-64 mx-auto object-contain mb-6"
          />
 
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "#345D9D" }}
          >
            Hola {user?.name || "Colaborador"}
          </h1>
 
          <p className="text-sm" style={{ color: "#718096" }}>
            ¿Qué deseas hacer hoy?
          </p>
 
        </div>
 
        {/* --------------------------------------------------------
            TARJETAS DE ACCIÓN
            Dos botones en forma de card que dirigen al colaborador
            a las dos funciones principales del portal:
            registrar un ticket nuevo o revisar sus tickets existentes.
        -------------------------------------------------------- */}
        <div className="space-y-4">
 
          {/* -------------------------------------------------------
              BOTÓN: Registrar ticket
              Llama a onRegistrarTicket al hacer clic.
              Permite al colaborador reportar un problema de TI.
          ------------------------------------------------------- */}
          <button
            onClick={onRegistrarTicket}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-center gap-4">
 
              {/* Ícono de ticket con fondo azul claro */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#EBF4FF" }}
              >
                <Ticket size={28} color="#345D9D" strokeWidth={2} />
              </div>
 
              <div>
                <h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>
                  Registrar ticket
                </h2>
                <p className="text-sm mt-1" style={{ color: "#718096" }}>
                  Reporta un problema o incidencia tecnológica
                </p>
              </div>
 
            </div>
          </button>
 
          {/* -------------------------------------------------------
              BOTÓN: Seguimiento de ticket
              Llama a onSeguimiento al hacer clic.
              Permite al colaborador consultar el estado de sus tickets.
          ------------------------------------------------------- */}
          <button
            onClick={onSeguimiento}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-center gap-4">
 
              {/* Ícono de lista con fondo azul claro */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#EAF2FB" }}
              >
                <ClipboardList size={28} color="#345D9D" strokeWidth={2} />
              </div>
 
              <div>
                <h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>
                  Seguimiento ticket
                </h2>
                <p className="text-sm mt-1" style={{ color: "#718096" }}>
                  Consulta el estado de tus tickets registrados
                </p>
              </div>
 
            </div>
          </button>
 
        </div>
 
        {/* --------------------------------------------------------
            BOTÓN: Cerrar sesión
            Llama a onLogout para desautenticar al colaborador
            y redirigirlo a la pantalla de login.
        -------------------------------------------------------- */}
        <button
          onClick={onLogout}
          className="w-full mt-6 py-3 rounded-xl text-sm font-medium transition"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#64748b",
          }}
        >
          Cerrar sesión
        </button>
 
        {/* --------------------------------------------------------
            FOOTER
            Identidad del grupo empresarial al pie de la pantalla.
        -------------------------------------------------------- */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "#a0aec0" }}
        >
          Grupo Aurica · Aurica · Mineralab · Metalab · Gianlu
        </p>
 
      </div>
    </div>
  );
}
 