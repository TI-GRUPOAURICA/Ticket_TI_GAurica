import { Ticket, ClipboardList} from "lucide-react";

export default function ColaboradorHome({
  user,
  onRegistrarTicket,
  onSeguimiento,
  onLogout
}) {

  return (

    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "#f0f4f8"
      }}
    >

      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-10">

          <img
            src="/grupoaurica-letrasazules.png"
            alt="Grupo Aurica"
            className="w-64 mx-auto object-contain mb-6"
          />

          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: "#305da0"
            }}
          >
            Hola {user?.name || "Colaborador"} 
          </h1>

          <p
            className="text-sm"
            style={{
              color: "#718096"
            }}
          >
            ¿Qué deseas hacer hoy?
          </p>

        </div>

        {/* CARD BOTONES */}
        <div className="space-y-4">

          {/* REGISTRAR */}
          <button
            onClick={onRegistrarTicket}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.04)"
            }}
          >

          <div className="flex items-center justify-center gap-4">
              <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "#EBF4FF"
                    }}
                  >
                    <Ticket
                      size={28}
                      color="#2B6CB0"
                      strokeWidth={2}
                    />
                  </div>

              <div>

                <h2
                  className="font-semibold text-lg"
                  style={{
                    color: "#305da0"
                  }}
                >
                  Registrar ticket
                </h2>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: "#718096"
                  }}
                >
                  Reporta un problema o incidencia tecnológica
                </p>

              </div>

            </div>

          </button>

          {/* SEGUIMIENTO */}
          <button
            onClick={onSeguimiento}
            className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]"
            style={{
              border: "1px solid #dbeafe",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.04)"
            }}
          >

            <div className="flex items-center gap-4">

            <div
  className="w-14 h-14 rounded-2xl flex items-center justify-center"
  style={{
    background: "#EAF2FB"
  }}
>
  <ClipboardList
    size={28}
    color="#305DA0"
    strokeWidth={2}
  />
</div>

              <div>

                <h2
                  className="font-semibold text-lg"
                  style={{
                    color: "#305da0"
                  }}
                >
                  Seguimiento ticket
                </h2>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: "#718096"
                  }}
                >
                  Consulta el estado de tus tickets registrados
                </p>

              </div>

            </div>

          </button>

        </div>

        {/* CERRAR SESION */}
        <button
          onClick={onLogout}
          className="w-full mt-6 py-3 rounded-xl text-sm font-medium transition"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#64748b"
          }}
        >
          Cerrar sesión
        </button>

        {/* FOOTER */}
        <p
          className="text-center text-xs mt-8"
          style={{
            color: "#a0aec0"
          }}
        >
          Grupo Aurica · Aurica · Mineralab · Metalab · Gianlu
        </p>

      </div>

    </div>
  );
}