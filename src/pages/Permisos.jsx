import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../Config/authConfig";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tenant-access`;
const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU", "TERRIMETAL", "ALENCORSRL", "MAPAJOYA"];

export default function Permisos() {
  const { instance, accounts } = useMsal();
  const [accesos, setAccesos] = useState([]);
  const [correo, setCorreo] = useState("");
  const [empresa, setEmpresa] = useState("ALENCORSRL");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

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

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError("");
    try { await llamar({ action: "save", correo, empresa }); setCorreo(""); await cargar(); }
    catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  };

  const alternar = async (acceso) => {
    try { await llamar({ action: "set-active", correo: acceso.correo, activo: !acceso.activo }); await cargar(); }
    catch (err) { setError(err.message); }
  };

  return <section className="mx-auto max-w-5xl space-y-5">
    <header><h2 className="text-2xl font-bold text-slate-800">Permisos por empresa</h2><p className="text-sm text-slate-600">Asigna acceso de TI a una empresa. La persona verá los módulos disponibles con información de esa empresa.</p></header>
    <form onSubmit={guardar} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_220px_auto]">
      <input type="email" required value={correo} onChange={e => setCorreo(e.target.value)} placeholder="Correo de TI (por ejemplo, el correo que creen para Alencor)" className="rounded-lg border px-3 py-2" />
      <select value={empresa} onChange={e => setEmpresa(e.target.value)} className="rounded-lg border px-3 py-2">{EMPRESAS.map(item => <option key={item}>{item}</option>)}</select>
      <button disabled={guardando} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Guardando…" : "Agregar acceso"}</button>
    </form>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Correo</th><th className="p-3">Empresa</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr></thead><tbody>{accesos.map(a => <tr key={a.correo} className="border-t"><td className="p-3">{a.correo}</td><td className="p-3">{a.empresa || "Todas (administrador global)"}</td><td className="p-3">{a.activo ? "Activo" : "Desactivado"}</td><td className="p-3">{a.rol === "ti_empresa" && <button onClick={() => alternar(a)} className="text-blue-700 underline">{a.activo ? "Desactivar" : "Activar"}</button>}</td></tr>)}</tbody></table>{!accesos.length && <p className="p-4 text-sm text-slate-500">No hay permisos cargados.</p>}</div>
  </section>;
}
