import { useState } from "react";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Usuarios from "./pages/Usuarios";
import Layout from "./components/Layout";
import PortalUsuario from "./pages/PortalUsuario";
import Reportes from "./pages/Reportes";
import Inventario from "./pages/Inventario";
import SeguimientoTicket from "./pages/SeguimientoTicket";
import ColaboradorHome from "./pages/ColaboradoresHome";
import { ADMINS } from "./Config/admins";
import Evaluacion from "./pages/Evaluacion";

// NUEVO: Página de cuentas de correo
import CuentasCorreo from "./pages/CuentasCorreo";

export default function App() {
  // ----------------------------------------------------------
  // MSAL — Microsoft Authentication Library
  // ----------------------------------------------------------
  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // ----------------------------------------------------------
  // PARÁMETROS DE URL
  // ----------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const ruta = window.location.pathname;

  if (ruta === "/evaluacion") {
    return <Evaluacion />;
  }

  const esAdminTest = params.get("admin") === "true";
  const esUsuarioTest = params.get("user") === "true";

  // ----------------------------------------------------------
  // ESTADOS DE NAVEGACIÓN
  // ----------------------------------------------------------
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viendoPortal, setViendoPortal] = useState(false);
  const [viendoSeguimiento, setViendoSeguimiento] = useState(false);

  // ----------------------------------------------------------
  // DATOS DEL USUARIO AUTENTICADO
  // ----------------------------------------------------------
  const userEmail = accounts[0]?.username || "";
  const userName = accounts[0]?.name || "";

  const esAdmin = ADMINS.includes(userEmail);

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
        return <Dashboard onNavigate={setCurrentPage} />;

      case "tickets":
        return (
          <Tickets
            adminNombre={userName}
            adminCorreo={userEmail}
          />
        );

      case "reportes":
        return <Reportes />;

      case "usuarios":
        return <Usuarios />;

      case "inventario":
        return <Inventario />;

      // NUEVO
      case "cuentas-correo":
        return <CuentasCorreo />;

      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // ----------------------------------------------------------
  // PRIORIDAD 1: Portal de registro de tickets
  // ----------------------------------------------------------
  if (viendoPortal) {
    return (
      <PortalUsuario
        onVolver={() => setViendoPortal(false)}
        userEmail={userEmail}
        userName={userName}
      />
    );
  }

  // ----------------------------------------------------------
  // PRIORIDAD 2: Seguimiento de ticket
  // ----------------------------------------------------------
  if (viendoSeguimiento) {
    return (
      <SeguimientoTicket
        onVolver={() => setViendoSeguimiento(false)}
      />
    );
  }

  // ----------------------------------------------------------
  // PRIORIDAD 3: Vista de administrador
  // ----------------------------------------------------------
  if (esAdmin) {
    return (
      <Layout
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    );
  }

  // ----------------------------------------------------------
  // PRIORIDAD 4: Modo colaborador de prueba
  // ----------------------------------------------------------
  if (esUsuarioTest) {
    return (
      <ColaboradorHome
        user={{ name: "Stanley" }}
        onRegistrarTicket={() => setViendoPortal(true)}
        onSeguimiento={() => setViendoSeguimiento(true)}
        onLogout={() => (window.location.href = "/")}
      />
    );
  }

  // ----------------------------------------------------------
  // PRIORIDAD 5: Sin sesión de Microsoft
  // ----------------------------------------------------------
  if (!isAuthenticated) {
    return <Login />;
  }

  // ----------------------------------------------------------
  // PRIORIDAD 6: Colaborador autenticado
  // ----------------------------------------------------------
  return (
    <ColaboradorHome
      user={{
        name: userName,
        email: userEmail
      }}
      onRegistrarTicket={() => setViendoPortal(true)}
      onSeguimiento={() => setViendoSeguimiento(true)}
      onLogout={handleLogout}
    />
  );
}