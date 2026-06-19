import { Ticket, ClipboardList } from "lucide-react";

export default function ColaboradorHome({
  user,
  onRegistrarTicket,
  onSeguimiento,
  onLogout,
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#f0f4f8" }}
    >
      <div className="w-full max-w-md">

        {/* ENCABEZADO */}
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

          {/* ✅ Eliminado: párrafo "¿Qué deseas hacer hoy?" */}
        </div>

        {/* TARJETAS DE ACCIÓN */}
        <div className="space-y-4">

          {/* BOTÓN: Registrar ticket */}
          <button
            onClick={onRegistrarTicket}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-4">

              {/* ✅ Íconos alineados a la izquierda (eliminado justify-center) */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#EBF4FF" }}
              >
                <Ticket size={28} color="#345D9D" strokeWidth={2} />
              </div>

              <div>
                <h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>
                  Registrar ticket
                </h2>
                <p className="text-sm mt-1" style={{ color: "#718096" }}>
                  Reporta un problema o incidencia
                  {/* ✅ Eliminado: "tecnológica" al final */}
                </p>
              </div>

            </div>
          </button>

          {/* BOTÓN: Seguimiento de ticket */}
          <button
            onClick={onSeguimiento}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-4">

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#EAF2FB" }}
              >
                <ClipboardList size={28} color="#345D9D" strokeWidth={2} />
              </div>

              <div>
                <h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>
                  Seguimiento ticket
                </h2>
                <p className="text-sm mt-1" style={{ color: "#718096" }}>
                  Consulta el estado de tu solicitud
                  {/* ✅ Cambiado: "tus tickets registrados" → "tu solicitud" */}
                </p>
              </div>

            </div>
          </button>

        </div>

        {/* ✅ BOTÓN: Cerrar sesión — color cambiado a #345d9d */}
       <div className="text-center mt-6">
  <button
    onClick={onLogout}
    className="px-8 py-3 rounded-xl text-sm font-medium transition text-white"
    style={{
      background: "#345d9d",
      border: "none",
    }}
  >
    Cerrar sesión
  </button>
</div>

        {/* ✅ FOOTER eliminado */}

      </div>
    </div>
  );
}