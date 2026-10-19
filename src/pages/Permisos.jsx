import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Building2, Globe2, Mail, Pencil, ShieldCheck, Trash2, UserRoundPlus, UsersRound } from "lucide-react";
import { loginRequest } from "../Config/authConfig";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-access`;
const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU", "TERRIMETAL", "ALENCORSRL", "MAPAJOYA"];
const EMPRESA_GLOBAL = "__admin_global__";

export default function Permisos() {
  const { instance, accounts } = useMsal();
  const [accesos, setAccesos] = useState([]);
  const [correo, setCorreo] = useState("");
  const [empresa, setEmpresa] = useState("ALENCORSRL");
  const [editando, setEditando] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminandoCorreo, setEliminandoCorreo] = useState("");

  const llamar = async (payload) => {
    const result = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${result.accessToken}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
    return data;
  };

  const cargar = async () => {
    try { setError(""); setAccesos((await llamar({ action: "list" })).accesos || []); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const limpiarFormulario = () => {
    setCorreo("");
    setEmpresa("ALENCORSRL");
    setEditando("");
  };

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError("");
    try {
      await llamar({ action: "save", correo, empresa });
      limpiarFormulario();
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  };

  const editar = (acceso) => {
    setCorreo(acceso.correo);
    setEmpresa(acceso.rol === "admin_global" ? EMPRESA_GLOBAL : acceso.empresa);
    setEditando(acceso.correo);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const alternar = async (acceso) => {
    try { await llamar({ action: "set-active", correo: acceso.correo, activo: !acceso.activo }); await cargar(); }
    catch (err) { setError(err.message); }
  };

  const eliminar = async (acceso) => {
    const mensaje = `¿Eliminar el acceso de TI de ${acceso.correo}? Dejará de entrar al panel administrativo. Si está registrada como colaboradora, conservará el portal de tickets.`;
    if (!window.confirm(mensaje)) return;
    setEliminandoCorreo(acceso.correo);
    setError("");
    try {
      await llamar({ action: "delete", correo: acceso.correo });
      if (editando === acceso.correo) limpiarFormulario();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminandoCorreo("");
    }
  };
  const activos = accesos.filter((acceso) => acceso.activo).length;

  return (
    <section className="mx-auto max-w-6xl space-y-7 pb-8">
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Administración · Seguridad</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Permisos por empresa</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Controla a qué información puede acceder cada persona de TI.</p>
        </div>
        <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:self-auto">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UsersRound size={20} /></span>
          <div><p className="text-lg font-bold leading-5 text-slate-900">{accesos.length}</p><p className="mt-1 text-xs text-slate-500">accesos · {activos} activos</p></div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,35,65,0.05)]">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserRoundPlus size={19} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">{editando ? "Editar acceso" : "Asignar acceso"}</h2>
            <p className="mt-1 text-sm text-slate-500">Elige una empresa o concede acceso global a todas.</p>
          </div>
          {editando && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Editando permiso</span>}
        </div>
        <form onSubmit={guardar} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(220px,1.25fr)_minmax(200px,0.85fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Correo de la persona</span>
            <span className="relative block">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required value={correo} onChange={e => setCorreo(e.target.value)} disabled={Boolean(editando)} placeholder="nombre@empresa.com" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-500" />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Alcance del acceso</span>
            <span className="relative block">
              {empresa === EMPRESA_GLOBAL ? <Globe2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" /> : <Building2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
              <select value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" aria-label="Empresa o alcance del permiso">
                {EMPRESAS.map(item => <option key={item} value={item}>{item}</option>)}
                <option value={EMPRESA_GLOBAL}>Todas · Administrador global</option>
              </select>
            </span>
          </label>
          <div className="flex gap-2 lg:pb-0">
            <button disabled={guardando} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 lg:flex-none">
              {guardando ? "Guardando…" : editando ? <><Pencil size={15} />Guardar cambios</> : <><UserRoundPlus size={16} />Agregar acceso</>}
            </button>
            {editando && <button type="button" onClick={limpiarFormulario} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancelar</button>}
          </div>
        </form>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="font-semibold text-slate-900">Accesos registrados</h2><p className="mt-1 text-xs text-slate-500">Personas y alcance asignado</p></div>
          <ShieldCheck size={20} className="text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3.5 sm:px-6">Persona</th><th className="px-5 py-3.5">Empresa / alcance</th><th className="px-5 py-3.5">Estado</th><th className="px-5 py-3.5 text-right sm:px-6">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accesos.map(a => <tr key={a.correo} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Mail size={15} /></span><span className="font-medium text-slate-800">{a.correo}</span></div></td>
                <td className="px-5 py-4">{a.empresa ? <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"><Building2 size={14} />{a.empresa}</span> : <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800"><Globe2 size={14} />Todas · Admin global</span>}</td>
                <td className="px-5 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${a.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${a.activo ? "bg-emerald-500" : "bg-slate-400"}`} />{a.activo ? "Activo" : "Desactivado"}</span></td>
                <td className="px-5 py-4 sm:px-6"><div className="flex items-center justify-end gap-2">
                  {a.rol === "ti_empresa" && <button onClick={() => alternar(a)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${a.activo ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>{a.activo ? "Desactivar" : "Activar"}</button>}
                  {a.rol === "ti_empresa" && <button type="button" disabled={eliminandoCorreo === a.correo} onClick={() => eliminar(a)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={13} />{eliminandoCorreo === a.correo ? "Eliminando…" : "Eliminar"}</button>}
                  <button type="button" onClick={() => editar(a)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"><Pencil size={13} />Editar</button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
          {!accesos.length && <div className="px-6 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><UsersRound size={22} /></span><p className="mt-3 text-sm font-medium text-slate-700">Aún no hay accesos registrados</p><p className="mt-1 text-xs text-slate-500">Agrega una persona desde el formulario.</p></div>}
        </div>
      </div>
    </section>
  );
}