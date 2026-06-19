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
// =============================================================
// COMPONENTE RAÍZ: App
// Punto de entrada de la aplicación. Controla toda la lógica
// de navegación y autenticación. Decide qué pantalla mostrar
// según el estado del usuario:
//   1. Si está viendo el portal de tickets → PortalUsuario
//   2. Si está viendo seguimiento          → SeguimientoTicket
//   3. Si es admin (por email en ADMINS)   → Layout + panel admin
//   4. Si no está autenticado en Microsoft → Login
//   5. Si es colaborador normal            → ColaboradorHome
// =============================================================
export default function App() {

  // ----------------------------------------------------------
  // MSAL — Microsoft Authentication Library
  // accounts        → lista de cuentas Microsoft activas
  // instance        → objeto para ejecutar acciones de auth (logout)
  // isAuthenticated → true si hay sesión Microsoft activa
  // ----------------------------------------------------------
  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // ----------------------------------------------------------
  // PARÁMETROS DE URL (solo para desarrollo/testing)
  // Permiten simular roles sin pasar por Microsoft:
  //   ?admin=true  → fuerza vista de administrador
  //   ?user=true   → fuerza vista de colaborador
  // ----------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const ruta = window.location.pathname;

if (ruta === "/evaluacion") {
  return <Evaluacion />;
}
  const esAdminTest   = params.get("admin") === "true";
  const esUsuarioTest = params.get("user")  === "true";

  // ----------------------------------------------------------
  // ESTADOS DE NAVEGACIÓN
  // currentPage       → página activa dentro del panel admin
  // viendoPortal      → muestra PortalUsuario sobre cualquier otra vista
  // viendoSeguimiento → muestra SeguimientoTicket sobre cualquier otra vista
  // ----------------------------------------------------------
  const [currentPage, setCurrentPage]             = useState("dashboard");
  const [viendoPortal, setViendoPortal]           = useState(false);
  const [viendoSeguimiento, setViendoSeguimiento] = useState(false);

  // ----------------------------------------------------------
  // DATOS DEL USUARIO AUTENTICADO
  // Se extraen del primer account de MSAL.
  // esAdmin verifica si el email está en la lista ADMINS.
  // ----------------------------------------------------------
  const userEmail = accounts[0]?.username || "";
  const userName  = accounts[0]?.name     || "";
  const esAdmin   = ADMINS.includes(userEmail);

  // ----------------------------------------------------------
  // CERRAR SESIÓN
  // Llama a logoutRedirect de MSAL para cerrar la sesión
  // de Microsoft y redirigir al usuario a la pantalla de login.
  // ----------------------------------------------------------
  const handleLogout = () => {
    instance.logoutRedirect();
  };

  // ----------------------------------------------------------
  // RENDERIZADO DE PÁGINAS DEL PANEL ADMIN
  // Switch que retorna el componente correspondiente según
  // currentPage. Solo se usa dentro del Layout de administrador.
  // ----------------------------------------------------------
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":  return <Dashboard onNavigate={setCurrentPage} />;
      case "tickets":    return <Tickets adminNombre={userName} adminCorreo={userEmail} />;
      case "reportes":   return <Reportes />;
      case "usuarios":   return <Usuarios />;
      case "inventario": return <Inventario />;
      default:           return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // ----------------------------------------------------------
  // PRIORIDAD 1: Portal de registro de tickets
  // Si el colaborador hizo clic en "Registrar ticket",
  // se muestra PortalUsuario por encima de todo lo demás.
  // onVolver regresa al estado anterior apagando la bandera.
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
  // Si el colaborador hizo clic en "Seguimiento ticket",
  // se muestra SeguimientoTicket por encima de todo lo demás.
  // ----------------------------------------------------------
  if (viendoSeguimiento) {
    return <SeguimientoTicket onVolver={() => setViendoSeguimiento(false)} />;
  }

  // ----------------------------------------------------------
  // PRIORIDAD 3: Vista de administrador (usuario en lista ADMINS)
  // Muestra el Layout con el menú lateral y la página activa.
  // Se pasan onLogout y currentPage para controlar la navegación.
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
  // PRIORIDAD 4: Modo colaborador de prueba (?user=true en URL)
  // Solo para desarrollo. Muestra ColaboradorHome con nombre fijo.
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
  // Si no hay autenticación activa, muestra la pantalla de Login.
  // ----------------------------------------------------------
  if (!isAuthenticated) {
    return <Login />;
  }

  // ----------------------------------------------------------
  // PRIORIDAD 6: Colaborador autenticado (no admin)
  // Usuario con sesión Microsoft pero sin acceso al panel admin.
  // Ve ColaboradorHome con sus opciones: registrar ticket y seguimiento.
  // ----------------------------------------------------------
  return (
    <ColaboradorHome
      user={{ name: userName, email: userEmail }}
      onRegistrarTicket={() => setViendoPortal(true)}
      onSeguimiento={() => setViendoSeguimiento(true)}
      onLogout={handleLogout}
    />
  );
}