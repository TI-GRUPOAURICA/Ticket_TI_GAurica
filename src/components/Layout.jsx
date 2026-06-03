import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Ticket,
  Laptop,
  FileSpreadsheet,
  Users
} from "lucide-react";
import { LogOut } from "lucide-react";

export default function Layout({
  children,
  onNavigate,
  currentPage,
  onLogout
}) {
const [menuOpen, setMenuOpen] = useState(
  window.innerWidth >= 768
);

useEffect(() => {
  const handleResize = () => {
    setMenuOpen(window.innerWidth >= 768);
  };

  window.addEventListener("resize", handleResize);

  return () =>
    window.removeEventListener(
      "resize",
      handleResize
    );
}, []);

 

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tickets", label: "Tickets", icon: Ticket },
    { id: "inventario", label: "Inventario", icon: Laptop },
    { id: "reportes", label: "Reportes", icon: FileSpreadsheet },
    { id: "usuarios", label: "Usuarios", icon: Users },
  ];

  return (

    <div
      className="flex min-h-screen"
      style={{
        background: "#eaf3ff"
      }}
    >

      {/* SIDEBAR */}
      <div
        className={`${
          menuOpen ? "w-60" : "w-16"
        } flex flex-col transition-all duration-300`}
        style={{
          background: "#345D9D",
          borderRight: "1px solid #3b82c420"
        }}
      >

        {/* LOGO */}
        <div
          className="p-4 flex items-center justify-between"
          style={{
            borderBottom: "1px solid #3b82c430"
          }}
        >

          {menuOpen ? (

            <div className="flex items-center gap-2">

              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff, #dbeafe)",
                  color: "#345D9D",
                }}
              >
                TI
              </div>

              <div>

                <p className="font-bold text-white text-sm tracking-wide">
                  Tickets TI
                </p>

                <p
                  className="text-xs"
                  style={{ color: "#dbeafe" }}
                >
                  Grupo Aurica
                </p>

              </div>

            </div>

          ) : (

            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm mx-auto"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff, #dbeafe)",
                color: "#345D9D",
              }}
            >
              TI
            </div>

          )}

          {/* BOTON MENU */}
          {window.innerWidth >= 768 && (
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="transition text-sm ml-1"
                    style={{ color: "#dbeafe" }}
                  >
                    {menuOpen ? "◀" : "▶"}
                  </button>
                )}

        </div>

        {/* MENU */}
        <nav className="flex-1 py-4 space-y-1 px-2">

          {menuItems.map((item) => (

            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={
                currentPage === item.id
                  ? {
                      background: "#ffffff25",
                      color: "#ffffff",
                      border: "1px solid #ffffff40",
                    }
                  : {
                      color: "#dbeafe",
                      border: "1px solid transparent",
                    }
              }
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = "#ffffff15";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#dbeafe";
                }
              }}
            >

             <span>
                    <item.icon
                      size={20}
                      strokeWidth={2}
                    />
                  </span>

              {menuOpen && (
                <span className="font-medium">
                  {item.label}
                </span>
              )}

            </button>

          ))}

        </nav>

        {/* LOGOUT */}
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
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "#ffffff15";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#dbeafe";
              e.currentTarget.style.background = "transparent";
            }}
          >

                    <LogOut
                    size={20}
                    strokeWidth={2}
                  />

            {menuOpen && (
              <span>
                Cerrar sesión
              </span>
            )}

          </button>

        </div>

      </div>

      {/* CONTENIDO */}
      <div
        className="flex-1 overflow-auto"
        style={{
          background: "#eaf3ff"
        }}
      >

        {children}

      </div>

    </div>
  );
}