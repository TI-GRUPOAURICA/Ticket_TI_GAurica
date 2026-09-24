import { useMemo, useState } from "react";
import {
  Cloud,
  Users,
  KeyRound,
  Package,
  AppWindow,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Mail,
  Building2,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

// Datos temporales. Más adelante serán reemplazados por Microsoft Graph.
const usuariosDemo = [
  {
    id: 1,
    nombre: "Admin Alencor",
    correo: "admin@alencorsrl.com",
    empresa: "ALENCOR SRL",
    licencia: "Exchange Online",
    estado: "Activo",
    tipo: "Administrador",
  },
  {
    id: 2,
    nombre: "Marco Izagaza",
    correo: "marco.izagaza@aurica.com",
    empresa: "GRUPO AURICA",
    licencia: "Microsoft 365 Business Standard",
    estado: "Activo",
    tipo: "Usuario",
  },
  {
    id: 3,
    nombre: "Carlos Mendoza",
    correo: "carlos.mendoza@aurica.com",
    empresa: "GRUPO AURICA",
    licencia: "Microsoft 365 Business Basic",
    estado: "Activo",
    tipo: "Usuario",
  },
  {
    id: 4,
    nombre: "Soporte TI",
    correo: "soporte@aurica.com",
    empresa: "GRUPO AURICA",
    licencia: "Microsoft 365 Business Standard",
    estado: "Bloqueado",
    tipo: "Usuario",
  },
];

const licenciasIniciales = [];

export default function Microsoft365() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [busqueda, setBusqueda] = useState("");
  const [empresa, setEmpresa] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
const [licencias, setLicencias] = useState(licenciasIniciales);
const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);
const [errorMicrosoft, setErrorMicrosoft] = useState("");

  const usuariosFiltrados = useMemo(() => {
    return usuariosDemo.filter((usuario) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        !texto ||
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto) ||
        usuario.licencia.toLowerCase().includes(texto);

      const coincideEmpresa =
        empresa === "Todas" || usuario.empresa === empresa;

      const coincideEstado =
        estado === "Todos" || usuario.estado === estado;

      return coincideBusqueda && coincideEmpresa && coincideEstado;
    });
  }, [busqueda, empresa, estado]);

 const sincronizar = async () => {
  setLoading(true);
  setErrorMicrosoft("");

  try {
    const response = await fetch(
      "https://kugmjzhaxdzyuizjtvjh.supabase.co/functions/v1/sync-microsoft365",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.error || "No se pudieron obtener las licencias de Microsoft 365"
      );
    }

    const licenciasFormateadas = (data.licencias || []).map(
      (licencia, index) => ({
        id: licencia.skuId || index,
        nombre: licencia.skuPartNumber,
        asignadas: licencia.asignadas || 0,
        disponibles: licencia.disponibles || 0,
        total: licencia.capacidad || 0,
        estado:
          (licencia.disponibles || 0) > 0
            ? "Disponible"
            : "Completa",
      })
    );

    setLicencias(licenciasFormateadas);
    setUltimaSincronizacion(new Date());
  } catch (error) {
    console.error("Error sincronizando Microsoft 365:", error);
    setErrorMicrosoft(
      error.message || "Ocurrió un error al sincronizar Microsoft 365"
    );
  } finally {
    setLoading(false);
  }
};

  const tabs = [
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "licencias", label: "Licencias", icon: KeyRound },
    { id: "suscripciones", label: "Suscripciones", icon: Package },
    { id: "aplicaciones", label: "Aplicaciones", icon: AppWindow },
  ];

  return (
    <div className="w-full min-h-full">
      {/* Encabezado */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Microsoft 365
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administración y consulta del tenant de Microsoft 365
            </p>
          </div>

          <button
            onClick={sincronizar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#3763a5] text-white text-sm font-semibold hover:bg-[#2f5792] disabled:opacity-60 transition"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Cloud size={19} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Microsoft 365
            </p>
            <p className="text-xs text-slate-500">
              Datos de demostración · integración pendiente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
          <CheckCircle2 size={16} />
          Conexión preparada
        </div>
      </div>
          {/* Estado de conexión */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        ...
      </div>

      {/* KPIs */}


      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Usuarios"
          value="85"
          detail="Usuarios del tenant"
        />
        <StatCard
          icon={KeyRound}
          title="Licencias asignadas"
          value="74"
          detail="Licencias en uso"
        />
        <StatCard
          icon={Package}
          title="Licencias disponibles"
          value="23"
          detail="Licencias sin asignar"
        />
        <StatCard
          icon={AppWindow}
          title="Aplicaciones"
          value="18"
          detail="Aplicaciones registradas"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-[#3763a5] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Usuarios */}
        {activeTab === "usuarios" && (
          <div className="p-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_190px_170px] gap-3 mb-4">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar usuario, correo o licencia..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>

              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="h-11 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] text-sm bg-white"
              >
                <option value="Todas">Todas las empresas</option>
                <option value="ALENCOR SRL">ALENCOR SRL</option>
                <option value="GRUPO AURICA">GRUPO AURICA</option>
              </select>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-11 px-3 rounded-lg border border-slate-200 outline-none focus:border-[#3763a5] text-sm bg-white"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Bloqueado">Bloqueados</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr className="text-left text-[#3763a5]">
                    <th className="px-4 py-3 font-bold">Usuario</th>
                    <th className="px-4 py-3 font-bold">Empresa</th>
                    <th className="px-4 py-3 font-bold">Licencia</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 font-bold text-right">Detalle</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="border-t border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users size={17} className="text-[#3763a5]" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {usuario.nombre}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} />
                              {usuario.correo}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-400" />
                          {usuario.empresa}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                          {usuario.licencia}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {usuario.estado === "Activo" ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 font-semibold text-xs">
                            <CheckCircle2 size={15} />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold text-xs">
                            <XCircle size={15} />
                            Bloqueado
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setSelectedUser(usuario)}
                          className="inline-flex items-center gap-1 text-[#3763a5] hover:underline font-semibold text-xs"
                        >
                          Ver detalle
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
              <span>
                Mostrando {usuariosFiltrados.length} de {usuariosDemo.length} usuarios
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Última sincronización: {ultimaSincronizacion ? ultimaSincronizacion.toLocaleString() : "—"}   
              </span>
            </div>
          </div>
        )}

        {/* Licencias */}
        {activeTab === "licencias" && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {licencias.map((licencia) => {
                const porcentaje =
                licencia.total > 0
                  ? Math.round((licencia.asignadas / licencia.total) * 100)
                  : 0;

              return (
                <div
                  key={licencia.id}
                  className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <KeyRound size={19} className="text-[#3763a5]" />
                    </div>
                    <span className="text-xs font-semibold text-green-600">
                      {licencia.estado}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 mt-4">
                    {licencia.nombre}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <MiniStat label="Total" value={licencia.total} />
                    <MiniStat label="Asignadas" value={licencia.asignadas} />
                    <MiniStat label="Disponibles" value={licencia.disponibles} />
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Uso</span>
                      <span>{porcentaje}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3763a5] rounded-full"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Suscripciones */}
        {activeTab === "suscripciones" && (
          <EmptyModule
            icon={Package}
            title="Suscripciones"
            description="Aquí mostraremos las suscripciones contratadas en el tenant."
          />
        )}

        {/* Aplicaciones */}
        {activeTab === "aplicaciones" && (
          <EmptyModule
            icon={AppWindow}
            title="Aplicaciones"
            description="Aquí mostraremos las aplicaciones y servicios empresariales."
          />
        )}
      </div>

      {/* Modal detalle */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#3763a5] text-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                  <Users size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedUser.nombre}</h2>
                  <p className="text-blue-100 text-sm">
                    Usuario de Microsoft 365
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <DetailRow
                icon={Mail}
                label="Correo"
                value={selectedUser.correo}
              />
              <DetailRow
                icon={Building2}
                label="Empresa"
                value={selectedUser.empresa}
              />
              <DetailRow
                icon={KeyRound}
                label="Licencia"
                value={selectedUser.licencia}
              />
              <DetailRow
                icon={ShieldCheck}
                label="Tipo"
                value={selectedUser.tipo}
              />
              <DetailRow
                icon={selectedUser.estado === "Activo" ? CheckCircle2 : AlertCircle}
                label="Estado"
                value={selectedUser.estado}
              />

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full mt-2 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, detail }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={19} className="text-[#3763a5]" />
        </div>
        <span className="text-2xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="font-semibold text-slate-700 mt-3">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon size={16} className="text-[#3763a5]" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function EmptyModule({ icon: Icon, title, description }) {
  return (
    <div className="p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon size={25} className="text-[#3763a5]" />
      </div>
      <h3 className="font-bold text-slate-800 mt-4">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}