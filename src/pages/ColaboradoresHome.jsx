import { ArrowUpRight, ClipboardList, LogOut, Ticket } from "lucide-react";

export default function ColaboradorHome({ user, onRegistrarTicket, onSeguimiento, onLogout }) {
  const nombre = user?.name?.trim().split(/\s+/)[0] || "Colaborador";
  const empresa = user?.company || "Grupo Aurica";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb] px-5 py-8 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-sky-100/80 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <img src="/grupoaurica-letrasazules.png" alt="Grupo Aurica" className="w-48 object-contain sm:w-56" />
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />{empresa}
          </div>
        </header>
        <section className="rounded-[30px] border border-white/80 bg-white/75 p-6 shadow-[0_24px_80px_rgba(36,66,112,0.10)] backdrop-blur sm:p-10">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Portal de soporte TI</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Hola, {nombre}<span className="text-blue-700">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">¿En qué podemos ayudarte hoy? Registra una incidencia o revisa el avance de tu solicitud.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <button onClick={onRegistrarTicket} className="group flex min-h-40 items-center gap-4 rounded-2xl bg-[#345d9d] p-5 text-left shadow-[0_12px_28px_rgba(52,93,157,0.22)] transition duration-200 hover:-translate-y-1 hover:bg-[#294f89] hover:shadow-[0_18px_34px_rgba(52,93,157,0.26)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20"><Ticket size={27} strokeWidth={1.8} /></span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-semibold text-white">Registrar ticket</span><span className="mt-1 block text-sm leading-5 text-blue-100">Reporta un problema o incidencia</span></span>
              <ArrowUpRight size={20} className="shrink-0 text-blue-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button onClick={onSeguimiento} className="group flex min-h-40 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><ClipboardList size={27} strokeWidth={1.8} /></span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-semibold text-slate-900">Seguimiento ticket</span><span className="mt-1 block text-sm leading-5 text-slate-500">Consulta el estado de tu solicitud</span></span>
              <ArrowUpRight size={20} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-700" />
            </button>
          </div>
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-400">Atención de soporte para las empresas del grupo</p>
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"><LogOut size={16} />Cerrar sesión</button>
          </footer>
        </section>
      </div>
    </main>
  );
}