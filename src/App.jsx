import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

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
import { ADMINS } from "./config/admins";

export default function App() {

const params = new URLSearchParams(
  window.location.search
);

const esAdminTest =
  params.get("admin") === "true";

const esUsuarioTest =
  params.get("user") === "true";



  const [session, setSession] = useState(null);

const user = {
  email: "stanley@grupoaurica.com"
};

const esAdmin =
  ADMINS.includes(user.email);

  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [viendoPortal, setViendoPortal] =
    useState(false);

  const [
    viendoSeguimiento,
    setViendoSeguimiento
  ] = useState(false);

  const [
    viendoColaboradorHome,
    setViendoColaboradorHome
  ] = useState(true);

  useEffect(() => {

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {

        setSession(session);

        setLoading(false);

      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(

      (_event, session) => {

        setSession(session);

        if (session) {

          setViendoColaboradorHome(false);

        }

      }

    );

    return () =>
      subscription.unsubscribe();

  }, []);



  // RENDER ADMIN
  const renderPage = () => {

    switch (currentPage) {

      case "dashboard":

        return (
          <Dashboard
            onNavigate={setCurrentPage}
          />
        );

      case "tickets":

        return <Tickets />;

      case "reportes":

        return <Reportes />;

      case "usuarios":

        return <Usuarios />;

      case "inventario":

        return <Inventario />;

      default:

        return (
          <Dashboard
            onNavigate={setCurrentPage}
          />
        );

    }

  };




  // LOADING
  if (loading) {

    return (

      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "#1e2840"
        }}
      >

        <p className="text-white text-lg">
          Cargando...
        </p>

      </div>

    );

  }

  // SIN SESION
  if (!session) {

    // PORTAL USUARIO
    if (viendoPortal) {

      return (

        <PortalUsuario
          onVolver={() =>
            setViendoPortal(false)
          }
        />

      );

    }

    // SEGUIMIENTO
    if (viendoSeguimiento) {

      return (

        <SeguimientoTicket
          onVolver={() =>
            setViendoSeguimiento(false)
          }
        />

      );

    }

    // HOME COLABORADOR
      if (esAdmin || esAdminTest)
         {

  return (

    <Layout
      onNavigate={setCurrentPage}
      currentPage={currentPage}
    >

      {renderPage()}

    </Layout>

  );

}
if (esUsuarioTest) {

  return (

    <ColaboradorHome

      user={{
        name: "Stanley"
      }}

      onRegistrarTicket={() =>
        setViendoPortal(true)
      }

      onSeguimiento={() =>
        setViendoSeguimiento(true)
      }

      onLogout={() => {

        window.location.href = "/";

      }}

    />

  );

}



return <Login />;
  }

  // RENDER ADMIN


  // PANEL ADMIN
  return (

    <Layout
      onNavigate={setCurrentPage}
      currentPage={currentPage}
    >

      {renderPage()}

    </Layout>

  );

}