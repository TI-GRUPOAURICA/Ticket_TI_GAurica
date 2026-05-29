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

export default function App() {

  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const params = new URLSearchParams(window.location.search);
  const esAdminTest = params.get("admin") === "true";
  const esUsuarioTest = params.get("user") === "true";

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viendoPortal, setViendoPortal] = useState(false);
  const [viendoSeguimiento, setViendoSeguimiento] = useState(false);

  // Usuario de Microsoft
  const userEmail = accounts[0]?.username || "";
  const userName = accounts[0]?.name || "";
  const esAdmin = ADMINS.includes(userEmail);

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard onNavigate={setCurrentPage} />;
      case "tickets": return <Tickets />;
      case "reportes": return <Reportes />;
      case "usuarios": return <Usuarios />;
      case "inventario": return <Inventario />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // PORTAL USUARIO
  if (viendoPortal) {
              if (viendoPortal) {
  return (
    <PortalUsuario
      onVolver={() => setViendoPortal(false)}
      userEmail={userEmail}
      userName={userName}
    />
  );
}




  }

  // SEGUIMIENTO
  if (viendoSeguimiento) {
    return <SeguimientoTicket onVolver={() => setViendoSeguimiento(false)} />;
  }

  // TEST PARAMS (desarrollo)
  if (esAdminTest) {
    return (
      <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
        {renderPage()}
      </Layout>
    );
  }

  if (esUsuarioTest) {
    return (
      <ColaboradorHome
        user={{ name: "Stanley" }}
        onRegistrarTicket={() => setViendoPortal(true)}
        onSeguimiento={() => setViendoSeguimiento(true)}
        onLogout={() => window.location.href = "/"}
      />
    );
  }

  // SIN SESION MICROSOFT
  if (!isAuthenticated) {
    return <Login />;
  }

  // ADMIN
  if (esAdmin) {
    return (
      <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
        {renderPage()}
      </Layout>
    );
  }

  // COLABORADOR
  return (
    <ColaboradorHome
      user={{ name: userName, email: userEmail }}
      onRegistrarTicket={() => setViendoPortal(true)}
      onSeguimiento={() => setViendoSeguimiento(true)}
      onLogout={handleLogout}
    />
  );
}