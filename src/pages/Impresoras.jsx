import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Pencil, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const SEDES = ["Lima", "Chala", "Arequipa", "Trapiche", "Bolivia"];
const FORM_VACIO = { sede: "Lima", area: "", modelo: "", ip: "", numero_serie: "" };
const CAMPO = "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400";
function obtenerUrlPanel(ip) {
  const valor = String(ip || "").trim();
  const partes = valor.split(".");
  const esIpValida = partes.length === 4 && partes.every((parte) => /^\d{1,3}$/.test(parte) && Number(parte) >= 0 && Number(parte) <= 255);
  return esIpValida ? `https://${valor}/PRESENTATION/ADVANCED/COMMON/TOP` : null;
}

export default function Impresoras() {
  const [impresoras, setImpresoras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORM_VACIO);

  useEffect(() => { cargarImpresoras(); }, []);

  async function cargarImpresoras() {
    setCargando(true);
    const { data, error } = await supabase.from("impresoras").select("*").order("sede").order("area");
    if (error) {
      console.error("Error cargando impresoras:", error);
      alert("No se pudieron cargar las impresoras. Verifica que la migración esté aplicada en Supabase.");
    } else setImpresoras(data || []);
    setCargando(false);
  }

  const impresorasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return impresoras.filter((impresora) => {
      const coincideTexto = !texto || [impresora.sede, impresora.area, impresora.modelo, impresora.ip, impresora.numero_serie]
        .some((valor) => String(valor || "").toLowerCase().includes(texto));
      return coincideTexto && (!filtroSede || impresora.sede === filtroSede);
    });
  }, [impresoras, busqueda, filtroSede]);

  function abrirNueva() {
    setEditando(null);
    setFormulario(FORM_VACIO);
    setModalAbierto(true);
  }

  function abrirEdicion(impresora) {
    setEditando(impresora);
    setFormulario({ sede: impresora.sede || "Lima", area: impresora.area || "", modelo: impresora.modelo || "", ip: impresora.ip || "", numero_serie: impresora.numero_serie || "" });
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!formulario.area.trim() || !formulario.modelo.trim()) {
      alert("Completa el área y el modelo de la impresora.");
      return;
    }
    setGuardando(true);
    const datos = { sede: formulario.sede, area: formulario.area.trim(), modelo: formulario.modelo.trim(), ip: formulario.ip.trim() || null, numero_serie: formulario.numero_serie.trim() || null };
    const consulta = editando
      ? supabase.from("impresoras").update(datos).eq("id", editando.id)
      : supabase.from("impresoras").insert(datos);
    const { error } = await consulta;
    setGuardando(false);
    if (error) {
      console.error("Error guardando impresora:", error);
      alert("No se pudo guardar la impresora.");
      return;
    }
    setModalAbierto(false);
    setFormulario(FORM_VACIO);
    setEditando(null);
    await cargarImpresoras();
  }

  async function eliminar(impresora) {
    if (!window.confirm(`¿Eliminar la impresora de ${impresora.area} (${impresora.modelo})?`)) return;
    const { error } = await supabase.from("impresoras").delete().eq("id", impresora.id);
    if (error) {
      console.error("Error eliminando impresora:", error);
      alert("No se pudo eliminar la impresora.");
      return;
    }
    await cargarImpresoras();
  }

  const sedesRegistradas = new Set(impresoras.map((impresora) => impresora.sede).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Inventario de Impresoras</h2><p className="mt-1 text-sm text-slate-500">Administra las impresoras por sede, área y conexión.</p></div>
        <button onClick={abrirNueva} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"><Plus size={17} /> Agregar impresora</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-sm text-slate-500">Impresoras registradas</p><p className="mt-1 text-2xl font-bold text-slate-800">{impresoras.length}</p></div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-sm text-slate-500">Sedes con impresoras</p><p className="mt-1 text-2xl font-bold text-slate-800">{sedesRegistradas}</p></div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 sm:flex-row">
        <label className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por área, modelo, IP, serie o sede..." className={`${CAMPO} pl-9`} /></label>
        <select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} className={`${CAMPO} sm:max-w-56`}><option value="">Todas las sedes</option>{SEDES.map((sede) => <option key={sede} value={sede}>{sede}</option>)}</select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
        {cargando ? <div className="p-10 text-center text-sm text-slate-500">Cargando impresoras…</div> : impresorasFiltradas.length === 0 ? (
          <div className="p-10 text-center"><Printer size={32} className="mx-auto mb-3 text-blue-300" /><p className="font-semibold text-slate-700">No hay impresoras para mostrar</p><p className="mt-1 text-sm text-slate-500">Agrega una impresora o cambia los filtros.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-800"><tr><th className="px-4 py-3">Sede</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Modelo</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">N/S</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-blue-50">{impresorasFiltradas.map((impresora) => (
              <tr key={impresora.id} className="transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"><MapPin size={12} />{impresora.sede}</span></td>
                <td className="px-4 py-3 font-medium text-slate-800">{impresora.area}</td><td className="px-4 py-3 text-slate-700">{impresora.modelo}</td><td className="px-4 py-3">
                  {obtenerUrlPanel(impresora.ip) ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-mono text-slate-600">{impresora.ip}</span>
                      <a href={obtenerUrlPanel(impresora.ip)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline">
                        Abrir panel <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : <span className="font-mono text-slate-600">{impresora.ip || "—"}</span>}
                </td><td className="px-4 py-3 font-mono text-slate-600">{impresora.numero_serie || "—"}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => abrirEdicion(impresora)} title="Editar" aria-label={`Editar ${impresora.area}`} className="rounded-lg border border-blue-100 p-2 text-blue-700 hover:bg-blue-50"><Pencil size={15} /></button><button type="button" onClick={() => eliminar(impresora)} title="Eliminar" aria-label={`Eliminar ${impresora.area}`} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        <div className="border-t border-blue-50 px-4 py-3 text-xs text-slate-500">Mostrando {impresorasFiltradas.length} de {impresoras.length} impresoras</div>
      </div>
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalAbierto(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-modal-impresora" className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-50 px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Printer size={20} /></span><div><h3 id="titulo-modal-impresora" className="font-bold text-slate-900">{editando ? "Editar impresora" : "Agregar impresora"}</h3><p className="text-xs text-slate-500">Completa los datos del equipo.</p></div></div><button type="button" onClick={() => setModalAbierto(false)} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <form onSubmit={guardar} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Sede<select required value={formulario.sede} onChange={(e) => setFormulario({ ...formulario, sede: e.target.value })} className={CAMPO}>{SEDES.map((sede) => <option key={sede} value={sede}>{sede}</option>)}</select></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Área<input required value={formulario.area} onChange={(e) => setFormulario({ ...formulario, area: e.target.value })} placeholder="Ej. Contabilidad" className={CAMPO} /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">Modelo<input required value={formulario.modelo} onChange={(e) => setFormulario({ ...formulario, modelo: e.target.value })} placeholder="Ej. EPSON PRO WF-6590" className={CAMPO} /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Dirección IP / conexión<input value={formulario.ip} onChange={(e) => setFormulario({ ...formulario, ip: e.target.value })} placeholder="Ej. 192.168.10.31 o Sin conexión" className={CAMPO} /></label>
              <label className="space-y-1.5 text-sm font-medium text-slate-700">Número de serie (N/S)<input value={formulario.numero_serie} onChange={(e) => setFormulario({ ...formulario, numero_serie: e.target.value })} placeholder="Número de serie" className={CAMPO} /></label>
            </div><div className="flex justify-end gap-2 border-t border-blue-50 pt-4"><button type="button" onClick={() => setModalAbierto(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{guardando ? "Guardando…" : <><Plus size={16} />{editando ? "Guardar cambios" : "Agregar impresora"}</>}</button></div></form>
          </div>
        </div>
      )}
    </div>
  );
}