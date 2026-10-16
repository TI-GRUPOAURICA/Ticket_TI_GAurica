import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================
// CORS
// =============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================
// CLIENTE SUPABASE (usa las claves que Supabase ya inyecta solo)
// =============================================================

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// Solo sincroniza y devuelve usuarios de los dominios corporativos.
const DOMINIOS_CORPORATIVOS = new Set([
  "alencorsrl.com",
  "auricape.onmicrosoft.com",
  "auricasac.com",
  "gianlusac.com",
  "mapajoya.com",
  "metalabsac.com",
  "mineralabsac.com",
  "terrimetalsac.com",
]);

const EMPRESA_POR_DOMINIO: Record<string, string> = { "alencorsrl.com": "ALENCORSRL", "auricape.onmicrosoft.com": "AURICA", "auricasac.com": "AURICA", "gianlusac.com": "GIANLU", "mapajoya.com": "MAPAJOYA", "metalabsac.com": "METALAB", "mineralabsac.com": "MINERALAB", "terrimetalsac.com": "TERRIMETAL" };
function empresaDeUsuario(usuario: any): string {
  if (usuario.empresa) return String(usuario.empresa).trim().toUpperCase();
  const correo = String(usuario.correo || usuario.user_principal_name || "");
  return EMPRESA_POR_DOMINIO[correo.split("@")[1]?.toLowerCase()] || "";
}
function dominioPermitido(correo: unknown): boolean {
  const dominio = String(correo || "").split("@")[1]?.trim().toLowerCase();
  return Boolean(dominio && DOMINIOS_CORPORATIVOS.has(dominio));
}

// =============================================================
// NOMBRES AMIGABLES DE LICENCIAS
// =============================================================

const nombresLicencias: Record<string, string> = {
  O365_BUSINESS: "Aplicaciones de Microsoft 365 para negocios",
  O365_BUSINESS_ESSENTIALS: "Microsoft 365 Empresa Básico",
  O365_BUSINESS_PREMIUM: "Microsoft 365 Empresa Estándar",
  EXCHANGESTANDARD: "Exchange Online (Plan 1)",
  EXCHANGEDESKLESS: "Kiosk Exchange Online 2GB",
  TEAMS_ESSENTIALS_AAD: "Microsoft Teams Essentials",
  SHAREPOINTSTANDARD: "SharePoint (Plan 1)",
  POWER_BI_PRO: "Power BI Pro",
  POWER_BI_STANDARD: "Power BI (Gratis / Estándar)",
  POWER_AUTOMATE_PREMIUM: "Power Automate Premium",
  FLOW_FREE: "Power Automate (Gratis)",
  POWERAPPS_DEV: "Power Apps Developer",
  POWERAPPS_VIRAL: "Power Apps (Gratis)",
  POWERAPPS_PER_APP_NEW: "Power Apps por aplicación",
  Microsoft_Teams_Exploratory_Dept: "Microsoft Teams Exploratory",
  PROJECT_PLAN3_DEPT: "Project Plan 3",
  POWER_AUTOMATE_ATTENDED_RPA: "Power Automate RPA Attended",
  THREAT_INTELLIGENCE: "Microsoft Threat Intelligence",
  WINDOWS_STORE: "Microsoft Store",
  // SPB es Business Premium según la tabla oficial de Microsoft.
  // Compáralo con el nombre que ves en el centro de administración.
  SPB: "Microsoft 365 Empresa Premium",
};

function obtenerCategoria(skuPartNumber: string): string {
  const sku = String(skuPartNumber || "").toUpperCase();

  if (sku.includes("EXCHANGE")) return "Exchange";
  if (sku.includes("TEAMS")) return "Teams";
  if (sku.includes("POWER_BI")) return "Power BI";
  if (sku.includes("POWERAPPS") || sku.includes("POWER_APPS")) {
    return "Power Apps";
  }
  if (sku.includes("FLOW_") || sku.includes("POWER_AUTOMATE")) {
    return "Power Automate";
  }
  if (sku.includes("SHAREPOINT")) return "SharePoint";
  if (sku.includes("O365_") || sku === "SPB") return "Microsoft 365";
  if (sku.includes("PROJECT")) return "Project";

  return "Otros";
}

function obtenerNombreLicencia(skuPartNumber: string): string {
  return nombresLicencias[skuPartNumber] || skuPartNumber;
}

// =============================================================
// GET PAGINADO DE MICROSOFT GRAPH
// =============================================================

async function obtenerTodos(urlInicial: string, accessToken: string) {
  const resultados: any[] = [];
  let url: string | null = urlInicial;

  while (url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || "Microsoft Graph rechazó la consulta.",
      );
    }

    if (Array.isArray(data.value)) {
      resultados.push(...data.value);
    }

    url = data["@odata.nextLink"] || null;
  }

  return resultados;
}

// =============================================================
// UTILIDADES DE BASE DE DATOS
// =============================================================

async function guardarEnLotes(
  tabla: string,
  filas: any[],
  claveConflicto: string,
) {
  for (let i = 0; i < filas.length; i += 500) {
    const { error } = await supabase
      .from(tabla)
      .upsert(filas.slice(i, i + 500), { onConflict: claveConflicto });

    if (error) {
      throw new Error(`Error guardando en ${tabla}: ${error.message}`);
    }
  }
}

async function leerTodo(tabla: string, ordenarPor: string) {
  const filas: any[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .order(ordenarPor, { ascending: true })
      .range(desde, desde + 999);

    if (error) {
      throw new Error(`Error leyendo ${tabla}: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    filas.push(...data);

    if (data.length < 1000) break;
    desde += 1000;
  }

  return filas;
}

// Borra de la tabla lo que ya no existe en Microsoft
async function borrarLosQueSobran(
  tabla: string,
  columna: string,
  idsActuales: string[],
) {
  const existentes = (await leerTodo(tabla, columna)).map((f) => f[columna]);
  const actuales = new Set(idsActuales);
  const sobran = existentes.filter((id: string) => !actuales.has(id));

  for (let i = 0; i < sobran.length; i += 100) {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .in(columna, sobran.slice(i, i + 100));

    if (error) {
      throw new Error(`Error eliminando de ${tabla}: ${error.message}`);
    }
  }

  return sobran.length;
}

// =============================================================
// SINCRONIZAR: MICROSOFT GRAPH  ->  TABLAS DE SUPABASE
// =============================================================

async function sincronizarDesdeMicrosoft() {
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

  if (!clientId || !tenantId || !clientSecret) {
    throw new Error("Faltan los Secrets de Microsoft en Supabase.");
  }

  // ---- Token de aplicación ----

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Error obteniendo token de aplicación:", tokenData);
    throw new Error("No se pudo autenticar con Microsoft Graph.");
  }

  const appAccessToken = tokenData.access_token;
  const ahora = new Date().toISOString();

  // ---- Licencias del tenant ----

  const licenciasGraph = await obtenerTodos(
    "https://graph.microsoft.com/v1.0/subscribedSkus",
    appAccessToken,
  );

  const mapaLicencias = new Map<string, any>();

  const filasLicencias = licenciasGraph.map((sku: any) => {
    const total = Number(sku.prepaidUnits?.enabled || 0);
    const asignadas = Number(sku.consumedUnits || 0);

    const fila = {
      sku_id: sku.skuId,
      sku_part_number: sku.skuPartNumber,
      nombre: obtenerNombreLicencia(sku.skuPartNumber),
      categoria: obtenerCategoria(sku.skuPartNumber),
      total,
      asignadas,
      disponibles: Math.max(total - asignadas, 0),
      suspendidas: Number(sku.prepaidUnits?.suspended || 0),
      warning: Number(sku.prepaidUnits?.warning || 0),
      estado: sku.capabilityStatus || "Enabled",
      actualizado_en: ahora,
    };

    mapaLicencias.set(String(sku.skuId).toLowerCase(), fila);
    return fila;
  });

  // ---- Usuarios del tenant ----

  const usuariosGraph = await obtenerTodos(
    "https://graph.microsoft.com/v1.0/users" +
      "?$select=id,displayName,mail,userPrincipalName,accountEnabled,userType,assignedLicenses" +
      "&$top=999",
    appAccessToken,
  );
  const idsUsuariosDelTenant = usuariosGraph.map((user: any) => user.id);
  const usuariosCorporativosGraph = usuariosGraph.filter((user: any) =>
    dominioPermitido(user.mail || user.userPrincipalName),
  );

  // Conserva las fechas que se registren desde la página. Graph no conoce
  // estas fechas comerciales y la sincronización no debe borrarlas.
  const usuariosDbPrevios = await leerTodo("m365_usuarios", "id");
  const licenciasPreviasPorUsuario = new Map(
    usuariosDbPrevios.map((usuario: any) => [
      usuario.id,
      new Map(
        (Array.isArray(usuario.licencias) ? usuario.licencias : []).map(
          (licencia: any) => [String(licencia.skuId || "").toLowerCase(), licencia],
        ),
      ),
    ]),
  );

  // OJO: no se envía la columna "empresa", así lo que escribas a mano
  // en la tabla nunca se borra al sincronizar.
  const filasUsuarios = usuariosCorporativosGraph.map((user: any) => {
    const fechasPrevias = licenciasPreviasPorUsuario.get(user.id) || new Map();
    const licenciasUsuario = (user.assignedLicenses || []).map(
      (asignada: any) => {
        const skuId = String(asignada.skuId || "").toLowerCase();
        const licenciaPrevia = fechasPrevias.get(skuId);
        const info = mapaLicencias.get(skuId);
        const datosLicencia = info
          ? {
              skuId: info.sku_id,
              nombre: info.nombre,
              skuPartNumber: info.sku_part_number,
              categoria: info.categoria,
            }
          : {
              skuId: asignada.skuId,
              nombre: "Licencia no identificada",
              skuPartNumber: null,
              categoria: "Otros",
            };

        return {
          ...datosLicencia,
          ...(licenciaPrevia?.fechaInicio ? { fechaInicio: licenciaPrevia.fechaInicio } : {}),
          ...(licenciaPrevia?.fechaFin ? { fechaFin: licenciaPrevia.fechaFin } : {}),
        };
      },
    );

    return {
      id: user.id,
      nombre: user.displayName || "Sin nombre",
      correo: user.mail || user.userPrincipalName || "",
      user_principal_name: user.userPrincipalName || "",
      estado: user.accountEnabled === false ? "Bloqueado" : "Activo",
      habilitado: user.accountEnabled !== false,
      tipo: user.userType || "Member",
      licencias: licenciasUsuario,
      cantidad_licencias: licenciasUsuario.length,
      actualizado_en: ahora,
    };
  });

  // ---- Guardar (agrega y actualiza) ----

  await guardarEnLotes("m365_licencias", filasLicencias, "sku_id");
  await guardarEnLotes("m365_usuarios", filasUsuarios, "id");

  // ---- Eliminar lo que ya no existe en el tenant ----
  // Si Microsoft devolviera 0 usuarios, NO se borra nada (por seguridad).

  let usuariosEliminados = 0;
  let licenciasEliminadas = 0;

  if (idsUsuariosDelTenant.length > 0) {
    usuariosEliminados = await borrarLosQueSobran(
      "m365_usuarios",
      "id",
      idsUsuariosDelTenant,
    );
  }

  if (filasLicencias.length > 0) {
    licenciasEliminadas = await borrarLosQueSobran(
      "m365_licencias",
      "sku_id",
      filasLicencias.map((f: any) => f.sku_id),
    );
  }

  return {
    fecha: ahora,
    usuarios: filasUsuarios.length,
    licencias: filasLicencias.length,
    usuariosEliminados,
    licenciasEliminadas,
  };
}

// =============================================================
// LEER: TABLAS DE SUPABASE  ->  FORMATO QUE ESPERA LA PÁGINA
// =============================================================

async function leerDesdeBase(empresaSolicitante?: string) {
  const [usuariosDb, licenciasDb] = await Promise.all([
    leerTodo("m365_usuarios", "nombre"),
    leerTodo("m365_licencias", "nombre"),
  ]);

  const usuarios = usuariosDb
    .filter((u: any) => dominioPermitido(u.correo || u.user_principal_name))
    .filter((u: any) => !empresaSolicitante || empresaDeUsuario(u) === empresaSolicitante)
    .map((u: any) => ({ id: u.id, nombre: u.nombre, correo: u.correo, userPrincipalName: u.user_principal_name, empresa: empresaDeUsuario(u), estado: u.estado, habilitado: u.habilitado, tipo: u.tipo, cantidadLicencias: u.cantidad_licencias, licencias: u.licencias || [] }));
  const licenciasBase = empresaSolicitante
    ? Array.from(usuarios.reduce((mapa: Map<string, number>, usuario: any) => {
        for (const licencia of usuario.licencias || []) { const id = String(licencia.skuId).toLowerCase(); mapa.set(id, (mapa.get(id) || 0) + 1); }
        return mapa;
      }, new Map<string, number>()).entries()).map(([skuId, cantidad]) => {
        const base = licenciasDb.find((item: any) => String(item.sku_id).toLowerCase() === skuId);
        return base ? { ...base, total: cantidad, asignadas: cantidad, disponibles: 0 } : null;
      }).filter(Boolean)
    : licenciasDb;
  const licencias = licenciasBase.map((l: any) => ({
    id: l.sku_id,
    skuId: l.sku_id,
    skuPartNumber: l.sku_part_number,
    nombre: l.nombre,
    categoria: l.categoria,
    capacidad: l.total,
    asignadas: l.asignadas,
    disponibles: l.disponibles,
    suspendidas: l.suspendidas,
    warning: l.warning,
    estado: l.estado,
  }));

  const usuariosConLicencia = usuarios.filter(
    (u: any) => u.cantidadLicencias > 0,
  ).length;

  const totalAsignaciones = usuarios.reduce(
    (total: number, u: any) => total + Number(u.cantidadLicencias || 0),
    0,
  );

  const fechas = [...usuariosDb, ...licenciasDb]
    .map((f: any) => f.actualizado_en)
    .filter(Boolean)
    .sort();

  return {
    usuarios,
    licencias,
    resumen: {
      totalUsuarios: usuarios.length,
      usuariosConLicencia,
      totalUsuariosSinLicencia: usuarios.length - usuariosConLicencia,
      totalAsignaciones,
      totalTiposLicencia: licencias.length,
    },
    ultimaSincronizacion: fechas.length ? fechas[fechas.length - 1] : null,
  };
}

// =============================================================
// FUNCIÓN PRINCIPAL
// =============================================================
//
//  GET   -> devuelve lo que hay guardado en Supabase (rápido).
//           Si las tablas están vacías, sincroniza primero.
//  POST  -> sincroniza con Microsoft y devuelve los datos.
//           (lo usa el botón "Sincronizar")
//  CRON  -> POST con la cabecera x-cron-secret (sin token de usuario).
//           (lo usa la programación automática)
// =============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---------------------------------------------------------
    // 1. ¿QUIÉN LLAMA?
    // ---------------------------------------------------------

    const cronSecret = Deno.env.get("CRON_SECRET");
    const esCron =
      !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    let accesoSolicitante: any = null;
    if (!esCron) {
      const authorization = req.headers.get("Authorization");

      if (!authorization || !authorization.startsWith("Bearer ")) {
        return responder(
          { success: false, error: "No se recibió el token de Microsoft." },
          401,
        );
      }

      const meResponse = await fetch(
        "https://graph.microsoft.com/v1.0/me?$select=id,displayName,userPrincipalName,mail",
        { headers: { Authorization: authorization } },
      );

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        console.error("Token Microsoft inválido:", meData);
        return responder(
          {
            success: false,
            error: "La sesión de Microsoft no es válida o expiró.",
          },
          401,
        );
      }

      const correos = [meData.mail, meData.userPrincipalName].filter(Boolean).map((c: string) => c.trim().toLowerCase());
      const { data: acceso, error: errorAcceso } = await supabase.from("accesos_empresa")
        .select("correo, rol, empresa, activo").in("correo", correos).maybeSingle();
      if (errorAcceso) throw new Error(`Error validando permisos: ${errorAcceso.message}`);
      if (!acceso?.activo) return responder({ success: false, error: "No tienes permiso para consultar Microsoft 365." }, 403);
      accesoSolicitante = acceso;
    }

    // ---------------------------------------------------------
    // 2. ACTUALIZAR EMPRESA MANUALMENTE
    // ---------------------------------------------------------

    if (req.method === "PATCH") {
      if (esCron) {
        return responder(
          { success: false, error: "El cron no puede editar empresas." },
          403,
        );
      }

      const body = await req.json();

      if (body?.action === "actualizarFechasLicencia") {
        const usuarioIdFechas = String(body?.usuarioId || "").trim();
        const skuId = String(body?.skuId || "").trim().toLowerCase();
        const fechaInicio = body?.fechaInicio || null;
        const fechaFin = body?.fechaFin || null;
        const fechaEsValida = (fecha: unknown) => {
          if (fecha === null) return true;
          if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
          const parsed = new Date(`${fecha}T00:00:00Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === fecha;
        };

        if (!usuarioIdFechas || !skuId) {
          return responder(
            { success: false, error: "Falta el usuario o la licencia." },
            400,
          );
        }

        if (!fechaEsValida(fechaInicio) || !fechaEsValida(fechaFin)) {
          return responder(
            { success: false, error: "Usa fechas válidas para inicio y vencimiento." },
            400,
          );
        }

        if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
          return responder(
            { success: false, error: "El vencimiento no puede ser anterior al inicio." },
            400,
          );
        }

        const { data: usuarioFechas, error: errorLecturaFechas } = await supabase
          .from("m365_usuarios")
          .select("id, licencias, empresa, correo, user_principal_name")
          .eq("id", usuarioIdFechas)
          .maybeSingle();

        if (errorLecturaFechas) {
          throw new Error(`Error leyendo licencias del usuario: ${errorLecturaFechas.message}`);
        }

        if (!usuarioFechas) {
          return responder(
            { success: false, error: "No se encontró el usuario en Supabase." },
            404,
          );
        }

        if (accesoSolicitante?.rol !== "admin_global" && empresaDeUsuario(usuarioFechas) !== accesoSolicitante?.empresa) return responder({ success: false, error: "No puedes editar licencias de otra empresa." }, 403);
        const licenciasUsuario = Array.isArray(usuarioFechas.licencias)
          ? usuarioFechas.licencias
          : [];
        const indiceLicencia = licenciasUsuario.findIndex(
          (licencia: any) => String(licencia.skuId || "").toLowerCase() === skuId,
        );

        if (indiceLicencia < 0) {
          return responder(
            { success: false, error: "La licencia ya no está asignada a este usuario." },
            404,
          );
        }

        const licenciasActualizadas = licenciasUsuario.map((licencia: any, index: number) =>
          index === indiceLicencia
            ? { ...licencia, fechaInicio, fechaFin }
            : licencia,
        );
        const { error: errorActualizacionFechas } = await supabase
          .from("m365_usuarios")
          .update({ licencias: licenciasActualizadas })
          .eq("id", usuarioIdFechas);

        if (errorActualizacionFechas) {
          throw new Error(`Error guardando las fechas: ${errorActualizacionFechas.message}`);
        }

        return responder({
          success: true,
          usuarioId: usuarioIdFechas,
          licencias: licenciasActualizadas,
        });
      }

      if (body?.action !== "actualizarEmpresa") {
        return responder(
          { success: false, error: "La acción solicitada no es válida." },
          400,
        );
      }
      if (accesoSolicitante?.rol !== "admin_global") return responder({ success: false, error: "Solo el administrador global puede cambiar empresas." }, 403);
      const usuarioId = String(body?.usuarioId || "").trim();
      const empresa = body?.empresa ?? null;
      const empresasPermitidas = [
        "AURICA",
        "METALAB",
        "MINERALAB",
        "GIANLU",
        "TERRIMETAL",
        "ALENCORSRL",
        "MAPAJOYA",
      ];

      if (!usuarioId) {
        return responder(
          { success: false, error: "Falta el identificador del usuario." },
          400,
        );
      }

      if (empresa !== null && !empresasPermitidas.includes(empresa)) {
        return responder(
          { success: false, error: "La empresa seleccionada no es válida." },
          400,
        );
      }

      const { data, error } = await supabase
        .from("m365_usuarios")
        .update({ empresa })
        .eq("id", usuarioId)
        .select("id, empresa")
        .maybeSingle();

      if (error) {
        throw new Error(`Error guardando la empresa: ${error.message}`);
      }

      if (!data) {
        return responder(
          { success: false, error: "No se encontró el usuario en Supabase." },
          404,
        );
      }

      return responder({
        success: true,
        usuarioId: data.id,
        empresa: data.empresa || "",
      });
    }

    // ---------------------------------------------------------
    // 3. ¿SINCRONIZAR O SOLO LEER?
    // ---------------------------------------------------------

    let sincronizacion: any = null;

    if (esCron || req.method === "POST") {
      if (!esCron && accesoSolicitante?.rol !== "admin_global") return responder({ success: false, error: "Solo el administrador global puede sincronizar todo el tenant." }, 403);
      sincronizacion = await sincronizarDesdeMicrosoft();
    }

    if (esCron) {
      return responder({ success: true, sincronizacion });
    }

    const empresaSolicitante = esCron || accesoSolicitante?.rol === "admin_global" ? undefined : accesoSolicitante?.empresa;
    let datos = await leerDesdeBase(empresaSolicitante);

    // Primera vez: tablas vacías -> sincroniza automáticamente
    if (!empresaSolicitante && !sincronizacion && datos.usuarios.length === 0) {
      sincronizacion = await sincronizarDesdeMicrosoft();
      datos = await leerDesdeBase(empresaSolicitante);
    }

    return responder({ success: true, sincronizacion, ...datos });
  } catch (error) {
    console.error("Error general:", error);

    return responder(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido.",
      },
      500,
    );
  }
});


