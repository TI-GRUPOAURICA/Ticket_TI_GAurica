import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Ticket,
  Laptop,
  Smartphone,
  FileSpreadsheet,
  Users,
  LogOut,
  Mail,
  Cloud
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

export default function Layout({
  children,
  onNavigate,
  currentPage,
  onLogout
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
  const menuItems = [
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
      id: "reportes",
      label: "Reportes",
      icon: FileSpreadsheet
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: Users
    },
    {
      id: "cuentas-correo",
      label: "Cuentas de correo",
      icon: Mail
    },
    {
      id: "microsoft-365",
      label: "Microsoft 365",
      icon: Cloud
    }
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
          className="rounded-xl px-6 py-4 mb-6"
          style={{
            background: "#345D9D"
          }}
        >
          <h1
            className="text-2xl font-bold text-white"
          >
            Portal de soporte TI
          </h1>

          <p className="text-white">
            Sistema de tickets
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}