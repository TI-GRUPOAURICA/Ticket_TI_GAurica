import { useEffect, useState } from "react";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import Tickets from "./pages/Tickets";

import Layout from "./components/Layout";

import PortalUsuario from "./pages/PortalUsuario";

import Reportes from "./pages/Reportes";

import Inventario from "./pages/Inventario";

import SeguimientoTicket from "./pages/SeguimientoTicket";

import ColaboradorHome from "./pages/ColaboradoresHome";

import Evaluacion from "./pages/Evaluacion";

import EquiposCelulares from "./pages/EquiposCelulares";

// NUEVO: Página de cuentas de correo
import CuentasCorreo from "./pages/CuentasCorreo";

import Radios from "./pages/radios";

import Microsoft365 from "./pages/Microsoft365";
import Impresoras from "./pages/Impresoras";
import Permisos from "./pages/Permisos";
import { loginRequest } from "./Config/authConfig";
import { configurarProveedorTokenMicrosoft } from "./lib/supabase";

export default function App() {

  // ----------------------------------------------------------
  // MSAL — Microsoft Authentication Library
  // ----------------------------------------------------------

  const { accounts, instance } = useMsal();

  const isAuthenticated = useIsAuthenticated();

  const ruta = window.location.pathname;

  if (ruta === "/evaluacion") {
    return <Evaluacion />;
  }

  // ----------------------------------------------------------
  // ESTADOS DE NAVEGACIÓN
  // ----------------------------------------------------------

  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [viendoPortal, setViendoPortal] =
    useState(false);

  const [viendoSeguimiento, setViendoSeguimiento] = useState(false);
  const [accesoEmpresa, setAccesoEmpresa] = useState(null);
  const [cargandoAcceso, setCargandoAcceso] = useState(true);

  configurarProveedorTokenMicrosoft(async () => {
      if (!accounts[0]) return null;
      const token = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      return token.accessToken;
  });

  useEffect(() => {
    if (!isAuthenticated || !accounts[0]) { setAccesoEmpresa(null); setCargandoAcceso(false); return; }
    let cancelado = false;
    (async () => {
      setCargandoAcceso(true);
      try {
        const token = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-access`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token.accessToken}` },
          body: JSON.stringify({ action: "me" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo validar el acceso.");
        if (!cancelado) setAccesoEmpresa(data.usuario || null);
      } catch (error) {
        console.error("No se pudo validar el acceso por empresa:", error);
        if (!cancelado) setAccesoEmpresa(null);
      } finally { if (!cancelado) setCargandoAcceso(false); }
    })();
    return () => { cancelado = true; };
  }, [isAuthenticated, accounts, instance]);

  // ----------------------------------------------------------
  // DATOS DEL USUARIO AUTENTICADO
  // ----------------------------------------------------------

  const userEmail =
    accesoEmpresa?.correo || accounts[0]?.username || "";

  const colaboradorAutenticado = accesoEmpresa?.colaborador || null;
  const userName =
    colaboradorAutenticado?.colaborador || accounts[0]?.name || "";

  const esAdmin = accesoEmpresa?.rol === "admin_global";
  const esTiEmpresa = accesoEmpresa?.rol === "ti_empresa" && accesoEmpresa?.activo;

  // ----------------------------------------------------------
  // CERRAR SESIÓN
  // ----------------------------------------------------------

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  // ----------------------------------------------------------
  // RENDERIZADO DE PÁGINAS DEL PANEL ADMIN
  // ----------------------------------------------------------

  const renderPage = () => {

    switch (currentPage) {

      case "dashboard":

        return (
          <Dashboard
            onNavigate={setCurrentPage}
          />
        );

      case "tickets":

        return (
          <Tickets
            adminNombre={userName}
            adminCorreo={userEmail}
          />
        );

      case "reportes":

        return <Reportes />;

      case "inventario":

        return <Inventario />;

      // NUEVO: Equipos celulares
      case "equipos-celulares":

        return <EquiposCelulares />;

      // NUEVO: Cuentas de correo
      case "cuentas-correo":

        return <CuentasCorreo />;
        case "radios":
  return <Radios />;
          case "impresoras":
        return <Impresoras />;

          case "microsoft-365":
        return <Microsoft365 esAdminGlobal={esAdmin} />;
      case "permisos":
        return esAdmin ? <Permisos /> : <Dashboard onNavigate={setCurrentPage} />;

      default:

        return (
          <Dashboard
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  // ----------------------------------------------------------
  // PRIORIDAD 1: Portal de registro de tickets
  // ----------------------------------------------------------

  if (viendoPortal) {

    return (
      <PortalUsuario
        onVolver={() =>
          setViendoPortal(false)
        }
        userEmail={colaboradorAutenticado?.correo || userEmail}
        userName={userName}
        initialCollaborator={colaboradorAutenticado}
      />
    );

  }

  // ----------------------------------------------------------
  // PRIORIDAD 2: Seguimiento de ticket
  // ----------------------------------------------------------

  if (viendoSeguimiento) {

    return (
      <SeguimientoTicket
        onVolver={() =>
          setViendoSeguimiento(false)
        }
      />
    );

  }

  // ----------------------------------------------------------
  // PRIORIDAD 3: Vista de administrador
  // ----------------------------------------------------------

  if (esAdmin || esTiEmpresa) {

    return (
      <Layout
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLogout={handleLogout}
        esAdminGlobal={esAdmin}
      >

        {renderPage()}

      </Layout>
    );

  }

  // ----------------------------------------------------------
  // PRIORIDAD 4: Sin sesión de Microsoft
  // ----------------------------------------------------------
  if (!isAuthenticated) return <Login />;

  if (cargandoAcceso) return <div className="flex min-h-screen items-center justify-center text-slate-600">Validando acceso…</div>;

  if (!accesoEmpresa?.activo) return <div className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-xl font-bold">Acceso no configurado</h1><p className="mt-2 text-slate-600">Tu cuenta inició sesión, pero todavía no tiene permisos para esta plataforma. Contacta al administrador de TI.</p><button onClick={handleLogout} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-white">Cerrar sesión</button></div></div>;

  // ----------------------------------------------------------
  // PRIORIDAD 6: Colaborador autenticado
  // ----------------------------------------------------------

  return (

    <ColaboradorHome

      user={{
        name: userName,
        email: userEmail,
        company: accesoEmpresa?.empresa
      }}

      onRegistrarTicket={() =>
        setViendoPortal(true)
      }

      onSeguimiento={() =>
        setViendoSeguimiento(true)
      }

      onLogout={handleLogout}

    />

  );
}
