import { Ticket, ClipboardList } from "lucide-react";

const EMPRESA_LOGOS = {
  AURICA: "/grupoaurica-letrasazules.png",
  METALAB: "/icono metalab.svg",
  MINERALAB: "/icono mineralab.svg",
  GIANLU: "/Gianlu_imagotipo_principal.png",
  TERRIMETAL: "/Terrimetal_imagotipo_principal.png",
};

const EMPRESA_TEMAS = {
  AURICA: { primary: "#345D9D", light: "#EBF4FF", border: "#DBEAFE" },
  METALAB: { primary: "#B78C30", light: "#FFFBEB", border: "#FDE68A" },
  MINERALAB: { primary: "#5F504D", light: "#FDF6E3", border: "#E9D8A6" },
  GIANLU: { primary: "#C05621", light: "#FFF7ED", border: "#FED7AA" },
  TERRIMETAL: { primary: "#809971", light: "#F3F6F0", border: "#D5E0CE" },
};

export default function ColaboradorHome({
  user,
  onRegistrarTicket,
  onSeguimiento,
  onLogout,
}) {
  const empresa = user?.company?.toUpperCase() || "AURICA";
  const logo = EMPRESA_LOGOS[empresa] || EMPRESA_LOGOS.AURICA;
  const nombreEmpresa = empresa === "TERRIMETAL" ? "Terrimetal" : empresa;
  const tema = EMPRESA_TEMAS[empresa] || EMPRESA_TEMAS.AURICA;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f0f4f8" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt={nombreEmpresa} className="w-64 h-20 mx-auto object-contain mb-6" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: tema.primary }}>Hola {user?.name || "Colaborador"}</h1>
          <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>Gestiona tus solicitudes de soporte de forma rápida y sencilla.</p>
        </div>
        <div className="space-y-4">
          <button onClick={onRegistrarTicket} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: `1px solid ${tema.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><Ticket size={28} color={tema.primary} strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Registrar ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Reporta un problema o incidencia</p></div>
            </div>
          </button>
          <button onClick={onSeguimiento} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: `1px solid ${tema.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: tema.light }}><ClipboardList size={28} color={tema.primary} strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: tema.primary }}>Seguimiento ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Consulta el estado de tu solicitud</p></div>
            </div>
          </button>
        </div>
        <div className="text-center mt-6">
          <button onClick={onLogout} className="px-8 py-3 rounded-xl text-sm font-medium transition text-white" style={{ background: tema.primary, border: "none" }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}