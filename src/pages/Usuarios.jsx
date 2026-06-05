import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// =============================================================
// COMPONENTE: Usuarios
// Pantalla de gestión de usuarios del panel de administración.
// Permite ver todos los usuarios registrados, buscarlos por
// nombre o correo, y crear nuevos usuarios mediante un modal.
//
// No recibe props — consume Supabase directamente.
// =============================================================
export default function Usuarios() {

  // ----------------------------------------------------------
  // ESTADOS DEL COMPONENTE
  // ----------------------------------------------------------
  const [usuarios, setUsuarios]       = useState([]);       // Lista de usuarios cargada desde Supabase
  const [loading, setLoading]         = useState(true);     // Estado de carga inicial de la tabla
  const [busqueda, setBusqueda]       = useState("");        // Texto del input de búsqueda en tiempo real
  const [modalAbierto, setModalAbierto] = useState(false);  // Controla si el modal de creación está visible
  const [nuevoUsuario, setNuevoUsuario] = useState({        // Datos del formulario del nuevo usuario
    full_name: "",
    email: "",
    password: "",
    role: "usuario",
  });
  const [creando, setCreando]   = useState(false);  // Bloquea el botón mientras se procesa la creación
  const [mensaje, setMensaje]   = useState("");     // Mensaje de éxito o error tras intentar crear usuario

  // ----------------------------------------------------------
  // EFECTO INICIAL
  // Carga la lista de usuarios al montar el componente.
  // ----------------------------------------------------------
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // ----------------------------------------------------------
  // CARGAR USUARIOS
  // Obtiene todos los perfiles desde la tabla "profiles"
  // ordenados del más reciente al más antiguo.
  // ----------------------------------------------------------
  const fetchUsuarios = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setUsuarios(data);
    setLoading(false);
  };

  // ----------------------------------------------------------
  // CREAR USUARIO
  // Valida que todos los campos estén completos, luego llama
  // a supabase.auth.signUp para registrar el usuario en Auth.
  // Los datos adicionales (nombre y rol) se guardan en metadata.
  // Si tiene éxito muestra confirmación, limpia el form y
  // cierra el modal tras 1.5 segundos recargando la lista.
  // ----------------------------------------------------------
  const crearUsuario = async () => {
    if (!nuevoUsuario.full_name || !nuevoUsuario.email || !nuevoUsuario.password) {
      setMensaje("Por favor completa todos los campos.");
      return;
    }

    setCreando(true);
    setMensaje("");

    const { error } = await supabase.auth.signUp({
      email:    nuevoUsuario.email,
      password: nuevoUsuario.password,
      options: {
        data: {
          full_name: nuevoUsuario.full_name,
          role:      nuevoUsuario.role,
        },
      },
    });

    if (error) {
      setMensaje("Error: " + error.message);
      setCreando(false);
      return;
    }

    setMensaje("✅ Usuario creado correctamente.");
    setNuevoUsuario({ full_name: "", email: "", password: "", role: "usuario" });
    setCreando(false);

    // Cierra el modal y recarga la lista después de 1.5 segundos
    setTimeout(() => {
      setModalAbierto(false);
      setMensaje("");
      fetchUsuarios();
    }, 1500);
  };

  // ----------------------------------------------------------
  // FILTRADO EN TIEMPO REAL
  // Filtra la lista localmente por nombre o correo sin
  // realizar una nueva consulta a Supabase.
  // ----------------------------------------------------------
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ----------------------------------------------------------
  // CONFIGURACIÓN VISUAL DE ROLES
  // Define el texto y colores del badge según el rol del usuario.
  // ----------------------------------------------------------
  const roleConfig = {
    admin:   { label: "Admin",   color: "#345D9D", bg: "#dbeafe" },
    usuario: { label: "Usuario", color: "#64748b", bg: "#f1f5f9" },
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* --------------------------------------------------------
          ENCABEZADO
          Título, descripción y botón para abrir el modal
          de creación de nuevo usuario.
      -------------------------------------------------------- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight" style={{color:"#345D9D"}}>Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #345D9D, #345D9D)", color: "#ffffff" }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* --------------------------------------------------------
          BUSCADOR
          Filtra la tabla en tiempo real por nombre o correo.
          Solo afecta la lista en memoria, no hace nuevas consultas.
      -------------------------------------------------------- */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-80 text-sm px-4 py-3 rounded-xl focus:outline-none"
          style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
        />
      </div>

      {/* --------------------------------------------------------
          TABLA DE USUARIOS
          Muestra los usuarios filtrados con 4 columnas:
          Nombre (con avatar inicial) · Correo · Rol · Registrado
      -------------------------------------------------------- */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#ffffff", border: "1px solid #dbeafe" }}>
        <table className="w-full text-sm">

          {/* Cabecera de la tabla */}
          <thead>
            <tr style={{ borderBottom: "1px solid #dbeafe", background: "#eff6ff" }}>
              {["Nombre", "Correo", "Rol", "Registrado"].map((col) => (
                <th key={col} className="text-left px-6 py-4 font-semibold" style={{ color: "#345D9D" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>

            {/* Estado: cargando */}
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Cargando...</td>
              </tr>

            /* Estado: sin resultados para el filtro activo */
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay usuarios.</td>
              </tr>

            /* Estado: lista de usuarios */
            ) : (
              usuariosFiltrados.map((u, i) => (
                <tr
                  key={u.id}
                  className="transition"
                  style={{ borderTop: i > 0 ? "1px solid #eff6ff" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fbff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >

                  {/* Nombre con avatar generado desde la inicial del nombre */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "#dbeafe", color: "#24599a" }}
                      >
                        {u.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-800 font-medium">{u.full_name}</span>
                    </div>
                  </td>

                  {/* Correo electrónico */}
                  <td className="px-6 py-4" style={{ color: "#64748b" }}>{u.email}</td>

                  {/* Rol con badge de color según roleConfig */}
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ color: roleConfig[u.role]?.color, background: roleConfig[u.role]?.bg }}
                    >
                      {roleConfig[u.role]?.label}
                    </span>
                  </td>

                  {/* Fecha de registro formateada en español peruano */}
                  <td className="px-6 py-4 text-xs" style={{ color: "#64748b" }}>
                    {new Date(u.created_at).toLocaleDateString("es-PE")}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --------------------------------------------------------
          MODAL: Crear nuevo usuario
          Aparece centrado con fondo oscuro y blur al hacer clic
          en "+ Nuevo Usuario". Contiene un formulario con:
          nombre, correo, contraseña y selector de rol.
          Muestra un mensaje de éxito o error tras el intento.
          Se cierra automáticamente tras crear el usuario,
          o manualmente con el botón ✕.
      -------------------------------------------------------- */}
      {modalAbierto && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "#00000060", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-xl"
            style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
          >

            {/* Encabezado del modal con botón de cierre */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Nuevo Usuario</h2>
              <button
                onClick={() => { setModalAbierto(false); setMensaje(""); }}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Formulario de creación */}
            <div className="space-y-4">

              {/* Campo: nombre completo */}
              <div>
                <label className="block text-xs mb-1 text-slate-500">Nombre completo</label>
                <input
                  type="text"
                  value={nuevoUsuario.full_name}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, full_name: e.target.value })}
                  className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none"
                  style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
                  placeholder="Juan Pérez"
                />
              </div>

              {/* Campo: correo electrónico */}
              <div>
                <label className="block text-xs mb-1 text-slate-500">Correo electrónico</label>
                <input
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                  className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none"
                  style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
                  placeholder="juan@aurica.com"
                />
              </div>

              {/* Campo: contraseña */}
              <div>
                <label className="block text-xs mb-1 text-slate-500">Contraseña</label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                  className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none"
                  style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
                  placeholder="••••••••"
                />
              </div>

              {/* Campo: rol del usuario (usuario o admin) */}
              <div>
                <label className="block text-xs mb-1 text-slate-500">Rol</label>
                <select
                  value={nuevoUsuario.role}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, role: e.target.value })}
                  className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none"
                  style={{ background: "#ffffff", border: "1px solid #dbeafe", color: "#1e293b" }}
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Mensaje de éxito (verde) o error (rojo) según el resultado */}
              {mensaje && (
                <p className="text-sm" style={{ color: mensaje.includes("✅") ? "#22c55e" : "#ef4444" }}>
                  {mensaje}
                </p>
              )}

              {/* Botón de envío — deshabilitado mientras se procesa */}
              <button
                onClick={crearUsuario}
                disabled={creando}
                className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #345D9D, #345D9D)", color: "#ffffff" }}
              >
                {creando ? "Creando..." : "Crear Usuario"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}