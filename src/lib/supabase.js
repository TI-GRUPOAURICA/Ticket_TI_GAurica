import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let proveedorTokenMicrosoft = null

export function configurarProveedorTokenMicrosoft(proveedor) {
  proveedorTokenMicrosoft = proveedor
}

const fetchNativo = globalThis.fetch.bind(globalThis)

async function fetchConPermisosEmpresa(input, init) {
  const request = new Request(input, init)
  const url = new URL(request.url)

  // Toda consulta PostgREST pasa por la Edge Function que autoriza por
  // empresa. Las llamadas a Auth y a otras Edge Functions siguen directas.
  if (url.origin !== supabaseUrl.replace(/\/$/, '') || !url.pathname.startsWith('/rest/v1/')) {
    return fetchNativo(request)
  }

  if (!proveedorTokenMicrosoft) {
    return new Response(JSON.stringify({ message: 'Inicia sesión para consultar los datos.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const accessToken = await proveedorTokenMicrosoft()
  if (!accessToken) {
    return new Response(JSON.stringify({ message: 'No se pudo validar tu sesión de Microsoft.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const headers = request.headers
  const forwardHeaders = {}
  for (const name of [
    'accept', 'accept-profile', 'content-profile', 'content-type', 'prefer',
    'range', 'range-unit', 'if-match', 'if-none-match',
  ]) {
    const value = headers.get(name)
    if (value) forwardHeaders[name] = value
  }

  const body = ['GET', 'HEAD'].includes(request.method) ? '' : await request.text()
  return fetchNativo(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/tenant-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      method: request.method,
      path: url.pathname,
      search: url.search,
      headers: forwardHeaders,
      body,
    }),
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchConPermisosEmpresa },
})
