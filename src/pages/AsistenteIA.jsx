import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Bot, Send, UserRound, Sparkles } from "lucide-react";
import { loginRequest } from "../Config/authConfig";

const PREGUNTAS_SUGERIDAS = [
  "¿Quién usa la LAP0002 y qué IP tiene?",
  "¿Qué equipos usa Karen?",
  "¿Qué tickets recientes tiene la LAP0002?",
];

export default function AsistenteIA() {
  const { instance, accounts } = useMsal();
  const [mensajes, setMensajes] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [consultando, setConsultando] = useState(false);
  const mensajesRef = useRef(null);

  useEffect(() => {
    mensajesRef.current?.scrollTo({ top: mensajesRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, consultando]);

  const enviarPregunta = async (texto = pregunta) => {
    const consulta = texto.trim();
    if (!consulta || consultando) return;
    setPregunta("");
    setMensajes((actuales) => [...actuales, { rol: "user", texto: consulta }]);
    setConsultando(true);

    try {
      const account = accounts?.[0];
      if (!account) throw new Error("No se encontró una sesión activa de Microsoft.");
      const token = await instance.acquireTokenSilent({ ...loginRequest, account });
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asistente-ti`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token.accessToken}`,
        },
        body: JSON.stringify({ pregunta: consulta }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo consultar el inventario.");
      setMensajes((actuales) => [...actuales, { rol: "assistant", texto: data.respuesta }]);
    } catch (error) {
      console.error("Error consultando al asistente de TI:", error);
      setMensajes((actuales) => [...actuales, {
        rol: "assistant",
        texto: error.message || "No pude completar la consulta. Inténtalo nuevamente.",
        error: true,
      }]);
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col p-4 md:p-7">
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Asistente de TI</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Consulta tu inventario</h1>
        <p className="mt-1 text-sm text-slate-500">Pregunta por equipos, personas, IP local, sincronización o tickets. Solo consulta información.</p>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div ref={mensajesRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {mensajes.length === 0 && (
            <div className="mx-auto mt-8 max-w-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Sparkles size={26} /></div>
              <h2 className="mt-4 text-lg font-semibold text-slate-800">¿Qué necesitas encontrar?</h2>
              <p className="mt-1 text-sm text-slate-500">El asistente consulta los datos que TI ya tiene registrados.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {PREGUNTAS_SUGERIDAS.map((ejemplo) => (
                  <button key={ejemplo} type="button" onClick={() => enviarPregunta(ejemplo)} className="rounded-full border border-blue-100 bg-blue-50/60 px-4 py-2 text-left text-xs text-blue-800 transition hover:bg-blue-100">
                    {ejemplo}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mensajes.map((mensaje, indice) => (
            <div key={`${indice}-${mensaje.rol}`} className={`flex items-start gap-3 ${mensaje.rol === "user" ? "justify-end" : "justify-start"}`}>
              {mensaje.rol === "assistant" && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Bot size={19} /></div>}
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${mensaje.rol === "user" ? "bg-blue-700 text-white" : mensaje.error ? "border border-red-200 bg-red-50 text-red-700" : "border border-slate-100 bg-slate-50 text-slate-700"}`}>
                {mensaje.texto}
              </div>
              {mensaje.rol === "user" && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><UserRound size={18} /></div>}
            </div>
          ))}
          {consultando && <div className="flex items-center gap-3 text-sm text-slate-500"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Bot size={19} /></div>Consultando el inventario…</div>}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); enviarPregunta(); }} className="flex items-center gap-3 border-t border-slate-100 p-3 md:p-4">
          <input value={pregunta} onChange={(event) => setPregunta(event.target.value)} maxLength={300} placeholder="Ejemplo: ¿Qué IP tiene la LAP0002?" disabled={consultando} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
          <button type="submit" disabled={!pregunta.trim() || consultando} aria-label="Enviar pregunta" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} /></button>
        </form>
      </section>
      <p className="mt-3 text-center text-xs text-slate-400">El asistente no cambia ni asigna información.</p>
    </div>
  );
}