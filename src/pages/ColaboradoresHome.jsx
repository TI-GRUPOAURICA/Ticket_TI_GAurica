import { Ticket, ClipboardList } from "lucide-react";

const EMPRESA_LOGOS = {
  AURICA: "/grupoaurica-letrasazules.png",
  METALAB: "/icono metalab.svg",
  MINERALAB: "/icono mineralab.svg",
  GIANLU: "/Gianlu_imagotipo_principal.png",
  TERRIMETAL: "/Terrimetal_imagotipo_principal.png",
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f0f4f8" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt={nombreEmpresa} className="w-64 h-20 mx-auto object-contain mb-6" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#345D9D" }}>Hola {user?.name || "Colaborador"}</h1>
          <p style={{ color: "#718096", fontSize: "14px", marginTop: "4px" }}>Gestiona tus solicitudes de soporte de forma rápida y sencilla.</p>
        </div>
        <div className="space-y-4">
          <button onClick={onRegistrarTicket} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: "1px solid #dbeafe", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#EBF4FF" }}><Ticket size={28} color="#345D9D" strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>Registrar ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Reporta un problema o incidencia</p></div>
            </div>
          </button>
          <button onClick={onSeguimiento} className="w-full bg-white rounded-2xl p-5 text-left transition hover:scale-[1.01]" style={{ border: "1px solid #dbeafe", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#EAF2FB" }}><ClipboardList size={28} color="#345D9D" strokeWidth={2} /></div>
              <div><h2 className="font-semibold text-lg" style={{ color: "#345D9D" }}>Seguimiento ticket</h2><p className="text-sm mt-1" style={{ color: "#718096" }}>Consulta el estado de tu solicitud</p></div>
            </div>
          </button>
        </div>
        <div className="text-center mt-6">
          <button onClick={onLogout} className="px-8 py-3 rounded-xl text-sm font-medium transition text-white" style={{ background: "#345d9d", border: "none" }}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}