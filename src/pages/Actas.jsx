import { useCallback, useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { ArrowLeft, Download, Eye, FileSignature, LoaderCircle, RefreshCw, Upload, X } from "lucide-react";
import { loginRequest } from "../Config/authConfig";
import { supabase } from "../lib/supabase";

const URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/actas-entrega";
const BUCKET = "actas-entrega";
const NADIA = "asistenterrhh@auricasac.com";
const MAX_BYTES = 10 * 1024 * 1024;
const EMPRESAS = ["AURICA", "METALAB", "MINERALAB", "GIANLU", "TERRIMETAL", "ALENCORSRL", "MAPAJOYA"];
const TIPOS_ACTA = ["Entrega inicial", "Entrega adicional"];

export default function Actas({ onVolver, userEmail, esAdminGlobal = false }) {
  const { instance, accounts } = useMsal();
  const correo = String(userEmail || accounts[0]?.username || "").trim().toLowerCase();
  const puedeSubir = correo === NADIA || esAdminGlobal;
  const [actas, setActas] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [rutaPreparada, setRutaPreparada] = useState("");
  const [estadoAnalisis, setEstadoAnalisis] = useState("");
  const [descargando, setDescargando] = useState("");
  const [abriendo, setAbriendo] = useState("");
  const [actaEnVista, setActaEnVista] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [form, setForm] = useState({
    nombreColaborador: "",
    dni: "",
    empresa: "",
    tipoActa: "Entrega inicial",
    equipos: [{ tipo: "", descripcion: "", identificador: "" }],
    fechaEntrega: "",
    archivo: null,
  });

  const llamar = useCallback(async (body) => {
    const token = await instance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: "Bearer " + token.accessToken,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
    return data;
  }, [accounts, instance]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await llamar({ action: "listar" });
      setActas(data.actas || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [llamar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const empresas = EMPRESAS;
  const actasFiltradas = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return actas.filter((acta) => {
      if (filtroEmpresa && acta.empresa !== filtroEmpresa) return false;
      if (!consulta) return true;
      const campos = [acta.nombre_colaborador, acta.dni, ...(acta.equipos || []).flatMap((equipo) => [equipo.tipo, equipo.descripcion, equipo.identificador])];
      return campos.some((campo) => String(campo || "").toLocaleLowerCase("es").includes(consulta));
    });
  }, [actas, filtroEmpresa, busqueda]);

  const actualizar = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));
  const actualizarEquipo = (indice, campo, valor) => setForm((actual) => ({ ...actual, equipos: actual.equipos.map((equipo, i) => i === indice ? { ...equipo, [campo]: valor } : equipo) }));
  const agregarEquipo = () => setForm((actual) => ({ ...actual, equipos: [...actual.equipos, { tipo: "", descripcion: "", identificador: "" }] }));
  const quitarEquipo = (indice) => setForm((actual) => ({ ...actual, equipos: actual.equipos.filter((_, i) => i !== indice) }));

  const prepararArchivo = async (archivo) => {
    const preparado = await llamar({ action: "preparar-carga", nombreArchivo: archivo.name, tipoArchivo: archivo.type, tamanoBytes: archivo.size });
    const { error: errorCarga } = await supabase.storage.from(BUCKET).uploadToSignedUrl(preparado.rutaArchivo, preparado.token, archivo, { contentType: "application/pdf", upsert: false });
    if (errorCarga) throw errorCarga;
    return preparado.rutaArchivo;
  };

  const analizarActa = async () => {
    const archivo = form.archivo;
    if (!archivo || archivo.type !== "application/pdf" || archivo.size > MAX_BYTES) {
      setError("Selecciona un PDF de hasta 10 MB.");
      return;
    }
    setAnalizando(true);
    setError("");
    setEstadoAnalisis("");
    try {
      const ruta = rutaPreparada || await prepararArchivo(archivo);
      setRutaPreparada(ruta);
      const respuesta = await llamar({ action: "analizar", rutaArchivo: ruta, nombreArchivo: archivo.name });
      const datos = respuesta.datos || {};
      if (!datos.esActa) {
        setEstadoAnalisis("Este archivo no parece una guía de entrega. Selecciona la guía correcta.");
        return;
      }
      const equipos = (datos.equipos || []).filter((equipo) => equipo.tipo || equipo.descripcion).map((equipo) => ({
        tipo: equipo.tipo || "",
        descripcion: equipo.descripcion || "",
        identificador: equipo.identificador || "",
        confianzaIdentificador: equipo.confianzaIdentificador || "baja",
      }));
      setForm((actual) => ({
        ...actual,
        nombreColaborador: datos.nombreColaborador || "",
        dni: datos.dni || "",
        empresa: EMPRESAS.includes(datos.empresa) ? datos.empresa : "",
        fechaEntrega: /^\d{4}-\d{2}-\d{2}$/.test(datos.fechaEntrega || "") ? datos.fechaEntrega : "",
        equipos: equipos.length ? equipos : [{ tipo: "", descripcion: "", identificador: "" }],
      }));
      setEstadoAnalisis("Lectura lista. Revisa y corrige los datos detectados, especialmente los manuscritos y las series, antes de guardar.");
    } catch (e) {
      setError(e.message || "No se pudo leer el acta.");
      setEstadoAnalisis("Puedes completar los campos manualmente y guardar el PDF.");
    } finally {
      setAnalizando(false);
    }
  };

  const subirActa = async (event) => {
    event.preventDefault();
    const formulario = event.currentTarget;
    const archivo = form.archivo;
    if (!form.nombreColaborador.trim() || !form.dni.trim() || !form.empresa || !form.tipoActa || !form.fechaEntrega || !archivo || form.equipos.length === 0 || form.equipos.some((equipo) => !equipo.tipo.trim() || !equipo.descripcion.trim())) {
      setError("Completa colaborador, DNI, empresa, fecha y los equipos. El número de serie es opcional si el artículo no tiene uno.");
      return;
    }
    if (archivo.type !== "application/pdf" || archivo.size > MAX_BYTES) {
      setError("El archivo debe ser PDF y pesar como máximo 10 MB.");
      return;
    }

    setSubiendo(true);
    setError("");
    setMensaje("");
    try {
      const rutaArchivo = rutaPreparada || await prepararArchivo(archivo);
      setRutaPreparada(rutaArchivo);

await llamar({
        action: "registrar",
        nombreColaborador: form.nombreColaborador,
        dni: form.dni,
        empresa: form.empresa,
        tipoActa: form.tipoActa,
        equipos: form.equipos,
        fechaEntrega: form.fechaEntrega,
        nombreArchivo: archivo.name,
        rutaArchivo,
        tamanoBytes: archivo.size,
      });
      setForm({
        nombreColaborador: "",
        dni: "",
        empresa: "",
        tipoActa: "Entrega inicial",
        equipos: [{ tipo: "", descripcion: "", identificador: "" }],
        fechaEntrega: "",
        archivo: null,
      });
      setRutaPreparada("");
      setEstadoAnalisis("");
      formulario.reset();
      setMensaje("Acta cargada y registrada correctamente.");
      await cargar();
    } catch (e) {
      setError(e.message || "No se pudo subir el acta.");
    } finally {
      setSubiendo(false);
    }
  };

  const verActa = async (acta) => {
    setAbriendo(acta.id);
    setError("");
    try {
      const data = await llamar({ action: "ver", id: acta.id });
      setActaEnVista({ ...acta, url: data.url });
    } catch (e) {
      setError(e.message);
    } finally {
      setAbriendo("");
    }
  };

  const descargar = async (acta) => {
    const ventana = window.open("about:blank", "_blank");
    if (!ventana) {
      setError("Permite las ventanas emergentes para descargar el acta.");
      return;
    }
    ventana.opener = null;
    setDescargando(acta.id);
    setError("");
    try {
      const data = await llamar({ action: "descargar", id: acta.id });
      ventana.location.href = data.url;
    } catch (e) {
      ventana.close();
      setError(e.message);
    } finally {
      setDescargando("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div className="flex items-start gap-3">
          {onVolver && (
            <button onClick={onVolver} className="mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Recursos humanos</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Actas de entrega</h1>
            <p className="mt-2 text-sm text-slate-500">Registro privado de documentos de entrega de equipos.</p>
          </div>
        </div>
        <button onClick={cargar} disabled={cargando} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={cargando ? "animate-spin" : ""} /> Actualizar
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {mensaje && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mensaje}</div>}

      {puedeSubir && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FileSignature size={20} /></span>
            <div>
              <h2 className="font-semibold text-slate-900">Subir acta firmada</h2>
              <p className="text-sm text-slate-500">Adjunta el PDF y registra a quién se entregaron los equipos.</p>
            </div>
          </div>
          <form onSubmit={subirActa} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Nombre del colaborador
              <input required value={form.nombreColaborador} onChange={(e) => actualizar("nombreColaborador", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-medium text-slate-700">DNI
              <input required value={form.dni} onChange={(e) => actualizar("dni", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="text-sm font-medium text-slate-700">Empresa
              <select required value={form.empresa} onChange={(e) => actualizar("empresa", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"><option value="">Selecciona una empresa</option>{EMPRESAS.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Tipo de entrega
              <select required value={form.tipoActa} onChange={(e) => actualizar("tipoActa", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{TIPOS_ACTA.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Fecha de entrega
              <input required type="date" value={form.fechaEntrega} onChange={(e) => actualizar("fechaEntrega", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <fieldset className="space-y-3 sm:col-span-2 lg:col-span-3">
              <legend className="text-sm font-semibold text-slate-700">Equipos incluidos en esta entrega</legend>
              {form.equipos.map((equipo, indice) => <div key={indice} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-slate-600">Tipo de equipo<input required value={equipo.tipo} onChange={(e) => actualizarEquipo(indice, "tipo", e.target.value)} placeholder="Laptop, celular, monitor..." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
                <label className="text-xs font-medium text-slate-600">Descripción<input required value={equipo.descripcion} onChange={(e) => actualizarEquipo(indice, "descripcion", e.target.value)} placeholder="Marca / modelo" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
                <label className="text-xs font-medium text-slate-600">Serie, IMEI o código (si tiene)<div className="mt-1 flex gap-2"><input value={equipo.identificador} onChange={(e) => actualizarEquipo(indice, "identificador", e.target.value)} placeholder="Serie / IMEI / código (si tiene)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />{form.equipos.length > 1 && <button type="button" onClick={() => quitarEquipo(indice)} className="rounded-lg px-2 text-red-600 hover:bg-red-50" aria-label="Quitar equipo">×</button>}</div></label>
              </div>)}
              <button type="button" onClick={agregarEquipo} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">+ Añadir otro equipo</button>
            </fieldset>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Acta firmada (PDF, máximo 10 MB)
              <input required type="file" accept="application/pdf,.pdf" onChange={(e) => { actualizar("archivo", e.target.files?.[0] || null); setRutaPreparada(""); setEstadoAnalisis(""); }} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700" />
            </label>
            {form.archivo && <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
              <button type="button" onClick={analizarActa} disabled={analizando || subiendo} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50">
                {analizando ? <LoaderCircle size={16} className="animate-spin" /> : <Eye size={16} />}
                {analizando ? "Leyendo guía..." : "Leer datos del PDF"}
              </button>
              <span className="text-xs text-slate-500">La lectura es una propuesta; verifica todo antes de guardar.</span>
            </div>}
            {estadoAnalisis && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:col-span-2 lg:col-span-3">{estadoAnalisis}</div>}
            <div className="sm:col-span-2 lg:col-span-3">
              <button disabled={subiendo || analizando} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                {subiendo ? <LoaderCircle size={17} className="animate-spin" /> : <Upload size={17} />}
                {subiendo ? "Guardando acta..." : "Guardar acta"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Actas registradas</h2>
            <p className="mt-1 text-sm text-slate-500">
              {actasFiltradas.length}{filtroEmpresa ? " de " + actas.length : ""} {actasFiltradas.length === 1 ? "documento" : "documentos"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar colaborador, DNI o equipo" aria-label="Buscar actas por colaborador o equipo" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64" />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span>Empresa</span>
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label="Filtrar actas por empresa"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}
            </select>
          </label>
          </div>
        </div>
        {cargando ? (
          <div className="p-10 text-center text-sm text-slate-500">Cargando actas...</div>
        ) : actas.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Aún no hay actas registradas.</div>
        ) : actasFiltradas.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No hay actas que coincidan con los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Colaborador</th><th className="px-5 py-3">DNI</th><th className="px-5 py-3">Empresa</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3 text-right">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actasFiltradas.map((acta) => (
                  <tr key={acta.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{acta.nombre_colaborador}</td>
                    <td className="px-5 py-3.5 text-slate-600">{acta.dni}</td>
                    <td className="px-5 py-3.5 text-slate-600">{acta.empresa}</td>
                    <td className="px-5 py-3.5 text-slate-600">{acta.tipo_acta || "Entrega inicial"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{acta.fecha_entrega}</td>
                    <td className="px-5 py-3.5 text-slate-600"><div className="space-y-1">{(acta.equipos || []).map((equipo) => <div key={equipo.identificador}><span className="font-medium">{equipo.tipo}</span> · {equipo.descripcion} · <span className="font-mono text-xs">{equipo.identificador}</span></div>)}<div className="max-w-56 truncate pt-1 text-xs text-slate-400">{acta.nombre_archivo}</div></div></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => verActa(acta)} disabled={abriendo === acta.id} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                          {abriendo === acta.id ? <LoaderCircle size={14} className="animate-spin" /> : <Eye size={14} />}
                          Ver
                        </button>
                        <button onClick={() => descargar(acta)} disabled={descargando === acta.id} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                          {descargando === acta.id ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
                          Descargar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-xs text-slate-400">Los documentos se guardan en almacenamiento privado y solo usuarios autorizados pueden consultarlos.</p>

      {actaEnVista && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6" role="presentation" onClick={() => setActaEnVista(null)}>
          <section role="dialog" aria-modal="true" aria-label={"Vista previa de " + actaEnVista.nombre_archivo} className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">{actaEnVista.nombre_archivo}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{actaEnVista.nombre_colaborador} · {actaEnVista.empresa}</p>
              </div>
              <button type="button" onClick={() => setActaEnVista(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar vista previa"><X size={20} /></button>
            </header>
            <iframe title={"Acta de " + actaEnVista.nombre_colaborador} src={actaEnVista.url} className="min-h-0 w-full flex-1 bg-slate-100" />
          </section>
        </div>
      )}
    </main>
  );
}