import AsistenteIA from "../pages/AsistenteIA";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import {
  LayoutDashboard,
  Ticket,
  FileSignature,
  Laptop,
  Smartphone,
  FileSpreadsheet,
  Users,
  LogOut,
  Cloud,
  Printer,
  Bell,
  X,
} from "lucide-react";

/* =========================================================
   ÍCONO PERSONALIZADO DE WALKIE-TALKIE
   ========================================================= */
const WalkieTalkieIcon = ({
  size = 24,
  strokeWidth = 2
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Antena */}
      <path d="M15.5 5L17.5 1.5" />

      {/* Perilla superior */}
      <path d="M10 4V2.5H13.5V4" />

      {/* Cuerpo del walkie-talkie */}
      <rect
        x="7"
        y="4"
        width="9"
        height="18"
        rx="2"
      />

      {/* Pantalla */}
      <rect
        x="9"
        y="7"
        width="5"
        height="3"
        rx="0.5"
      />

      {/* Altavoz */}
      <path d="M9 12H14" />
      <path d="M9 14H14" />
      <path d="M9 16H14" />

      {/* Botón */}
      <circle
        cx="11.5"
        cy="19"
        r="1"
      />
    </svg>
  );
};

const CORREO_ALERTAS_TICKETS = "soporte@auricasac.com";

function AlertasTicketsNuevos({ correo, onNavigate }) {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    if (String(correo || "").trim().toLowerCase() !== CORREO_ALERTAS_TICKETS) return;
    let cancelado = false;
    let intervalo;
    let ultimoId = null;
    let consultando = false;

    const revisar = async (inicial = false) => {
      if (consultando || cancelado) return;
      consultando = true;
      try {
        let consulta = supabase.from("tickets")
          .select("id, nombre_colaborador, empresa, titulo")
          .order("id", { ascending: !inicial })
          .limit(inicial ? 1 : 20);
        if (!inicial && ultimoId !== null) consulta = consulta.gt("id", ultimoId).order("id", { ascending: true });
        const { data, error } = await consulta;
        if (error) throw error;
        if (cancelado) return;
        if (inicial) {
          if (data?.length) ultimoId = data[0].id;
          return;
        }
        if (!data?.length) return;
        ultimoId = data[data.length - 1].id;
        setAlertas((actuales) => [...actuales, ...data.map((ticket) => ({
          id: ticket.id,
          nombre: ticket.nombre_colaborador || "Colaborador",
          empresa: ticket.empresa || "",
          titulo: ticket.titulo || "Solicitud de soporte",
        }))].slice(-4));
      } catch (error) {
        console.error("No se pudieron consultar los avisos de tickets:", error);
      } finally {
        consultando = false;
      }
    };

    const iniciar = async () => {
      await revisar(true);
      if (!cancelado) intervalo = window.setInterval(() => revisar(false), 12000);
    };
    iniciar();
    return () => {
      cancelado = true;
      if (intervalo) window.clearInterval(intervalo);
    };
  }, [correo]);

  if (String(correo || "").trim().toLowerCase() !== CORREO_ALERTAS_TICKETS || !alertas.length) return null;
  return (
    <div className="fixed right-4 top-4 z-[150] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {alertas.map((alerta) => (
        <div key={alerta.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-lg bg-[#345D9D]/10 p-2 text-[#345D9D]"><Bell size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Nuevo ticket #{alerta.id}</p>
              <p className="mt-1 text-sm text-slate-600">{alerta.nombre}{alerta.empresa ? ` · ${alerta.empresa}` : ""}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{alerta.titulo}</p>
              <button onClick={() => { setAlertas((actuales) => actuales.filter((item) => item.id !== alerta.id)); onNavigate("tickets"); }} className="mt-3 rounded-lg bg-[#345D9D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d528c]">Ver tickets</button>
            </div>
            <button onClick={() => setAlertas((actuales) => actuales.filter((item) => item.id !== alerta.id))} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar alerta"><X size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
export default function Layout({
  children,
  onNavigate,
  currentPage,
  onLogout,
  esAdminGlobal = false,
  soloActas = false,
  adminEmail = ""
}) {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* =========================================================
     MENÚ
     ========================================================= */
  const menuItems = soloActas
    ? [{ id: "actas", label: "Actas", icon: FileSignature }]
    : [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard
        },
        {
          id: "tickets",
          label: "Tickets",
          icon: Ticket
        },
        {
          id: "inventario",
          label: "Inventario",
          icon: Laptop
        },
        {
          id: "equipos-celulares",
          label: "Equipos celulares",
          icon: Smartphone
        },
        {
          id: "radios",
          label: "Radios",
          icon: WalkieTalkieIcon
        },
        {
          id: "impresoras",
          label: "Impresoras",
          icon: Printer
        },
        {
          id: "reportes",
          label: "Reportes",
          icon: FileSpreadsheet
        },
        {
          id: "microsoft-365",
          label: "Microsoft 365",
          icon: Cloud
        },
        ...(esAdminGlobal ? [
          { id: "actas", label: "Actas", icon: FileSignature },
          { id: "permisos", label: "Permisos", icon: Users }
        ] : [])
      ];

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "#eaf3ff"
      }}
    >

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: isMobile ? "64px" : "240px",
          background: "#345D9D",
          borderRight: "1px solid #3b82c420",
          position: "sticky",
          top: 0,
          height: "100vh"
        }}
      >

        {/* ===================================================
            LOGO
            =================================================== */}
        <div
          className="flex items-center justify-center"
          style={{
            borderBottom: "1px solid #3b82c430"
          }}
        >
          {isMobile ? (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff, #dbeafe)",
                color: "#345D9D"
              }}
            >
              TI
            </div>
          ) : (
            <div
              className="flex justify-center items-center w-full py-0"
            >
              <img
                src="/Grupo-Aurica-version_alterna_blanco.png"
                alt="Grupo Aurica"
                className="h-32 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* ===================================================
            MENÚ
            =================================================== */}
        <nav
          className="flex-1 py-0 space-y-1 px-2"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                onNavigate(item.id)
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={
                currentPage === item.id
                  ? {
                      background: "#ffffff25",
                      color: "#ffffff",
                      border: "1px solid #ffffff40"
                    }
                  : {
                      color: "#dbeafe",
                      border: "1px solid transparent"
                    }
              }
              onMouseEnter={(e) => {
                if (
                  currentPage !== item.id
                ) {
                  e.currentTarget.style.background =
                    "#ffffff15";

                  e.currentTarget.style.color =
                    "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  currentPage !== item.id
                ) {
                  e.currentTarget.style.background =
                    "transparent";

                  e.currentTarget.style.color =
                    "#dbeafe";
                }
              }}
            >
              <span>
                <item.icon
                  size={20}
                  strokeWidth={2}
                />
              </span>

              {!isMobile && (
                <span className="font-medium">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ===================================================
            CERRAR SESIÓN
            =================================================== */}
        <div
          className="p-2"
          style={{
            borderTop: "1px solid #60a5fa50"
          }}
        >
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition"
            style={{
              color: "#dbeafe",
              border: "1px solid transparent"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color =
                "#ffffff";

              e.currentTarget.style.background =
                "#ffffff15";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                "#dbeafe";

              e.currentTarget.style.background =
                "transparent";
            }}
          >
            <LogOut
              size={20}
              strokeWidth={2}
            />

            {!isMobile && (
              <span>
                Cerrar sesión
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          CONTENIDO
          ===================================================== */}
      <div
        className="flex-1 overflow-auto p-6"
        style={{
          background: "#f0f3f8"
        }}
      >
        <div
          className="rounded-xl px-6 py-4 mb-6 flex items-center justify-between gap-4"
          style={{
            background: "#345D9D"
          }}
        >
          <div className="min-w-0">
          <h1
            className="text-2xl font-bold text-white"
          >
            Portal de soporte TI
          </h1>

          <p className="text-white">
            Sistema de tickets
          </p>
          </div>
          <img
            src="/5empresas.png"
            alt="Logos de las cinco empresas del Grupo Aurica"
            className="hidden sm:block h-[54px] w-[220px] shrink-0 rounded-lg bg-white object-cover shadow-sm"
          />
        </div>
        {children}
        <AsistenteIA />
      </div>
      <AlertasTicketsNuevos correo={adminEmail} onNavigate={onNavigate} />
    </div>
  );
}
