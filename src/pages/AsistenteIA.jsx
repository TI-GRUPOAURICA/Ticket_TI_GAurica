import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Bot, Send, UserRound, Sparkles, X, MessageCircle, Minus } from "lucide-react";
import { loginRequest } from "../Config/authConfig";

const PREGUNTAS_SUGERIDAS = [
  "¿Quién usa la LAP0002 y qué IP tiene?",
  "¿Qué equipos usa Karen?",
  "¿Qué tickets recientes tiene la LAP0002?",
];

export default function AsistenteIA() {
  const { instance, accounts } = useMsal();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [pregunta, setPregunta] = useState("");
  const [consultando, setConsultando] = useState(false);
  const mensajesRef = useRef(null);

  useEffect(() => {
    mensajesRef.current?.scrollTo({ top: mensajesRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, consultando, abierto]);

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
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {abierto && (
        <section className="flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl" style={{ height: "min(34rem, calc(100vh - 7rem))" }} aria-label="Chat con el asistente de TI">
          <header className="flex items-center justify-between bg-[#345D9D] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Bot size={23} /></div>
              <div>
                <h2 className="text-sm font-bold">Asistente de TI</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-blue-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Listo para ayudarte</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setAbierto(false)} aria-label="Minimizar asistente" className="rounded-lg p-2 transition hover:bg-white/15"><Minus size={17} /></button>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente" className="rounded-lg p-2 transition hover:bg-white/15"><X size={17} /></button>
            </div>
          </header>

          <div ref={mensajesRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
            {mensajes.length === 0 && (
              <div className="pt-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Sparkles size={23} /></div>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">¿Qué necesitas encontrar?</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Puedo buscar equipos, personas, IP, sincronizaciones y tickets.</p>
                <div className="mt-4 space-y-2">
                  {PREGUNTAS_SUGERIDAS.map((ejemplo) => (
                    <button key={ejemplo} type="button" onClick={() => enviarPregunta(ejemplo)} className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-left text-xs leading-5 text-blue-800 transition hover:border-blue-300 hover:bg-blue-50">
                      {ejemplo}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mensajes.map((mensaje, indice) => (
              <div key={`${indice}-${mensaje.rol}`} className={`flex items-end gap-2 ${mensaje.rol === "user" ? "justify-end" : "justify-start"}`}>
                {mensaje.rol === "assistant" && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Bot size={16} /></div>}
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${mensaje.rol === "user" ? "rounded-br-md bg-blue-700 text-white" : mensaje.error ? "border border-red-200 bg-red-50 text-red-700" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}>
                  {mensaje.texto}
                </div>
                {mensaje.rol === "user" && <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600"><UserRound size={15} /></div>}
              </div>
            ))}
            {consultando && <div className="flex items-center gap-2 text-xs text-slate-500"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Bot size={16} /></div>Buscando en el inventario…</div>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); enviarPregunta(); }} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
            <input value={pregunta} onChange={(event) => setPregunta(event.target.value)} maxLength={300} placeholder="Pregunta por un equipo o persona…" disabled={consultando} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            <button type="submit" disabled={!pregunta.trim() || consultando} aria-label="Enviar pregunta" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} /></button>
          </form>
          <p className="bg-white pb-2 text-center text-[10px] text-slate-400">Solo consulta información; no realiza cambios.</p>
        </section>
      )}

      <button type="button" onClick={() => setAbierto((actual) => !actual)} aria-label={abierto ? "Minimizar asistente de TI" : "Abrir asistente de TI"} aria-expanded={abierto} className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#345D9D] text-white shadow-lg ring-4 ring-white transition duration-200 hover:scale-105 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200">
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 transition group-hover:animate-ping" />
        {abierto ? <MessageCircle size={25} className="relative" /> : <Bot size={27} className="relative" />}
        {!abierto && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />}
      </button>
      {!abierto && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md">¿Te ayudo?</span>}
    </div>
  );
}