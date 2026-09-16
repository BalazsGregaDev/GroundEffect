import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const folder = 'GroundEffect'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha1Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function publicIdFromUrl(url: string) {
  const marker = '/upload/'
  const at = url.indexOf(marker)

  if (at === -1) {
    return null
  }

  const segments = url.slice(at + marker.length).split('/')

  while (segments.length > 0 && (/^v\d+$/.test(segments[0]) || segments[0].includes(','))) {
    segments.shift()
  }

  const path = segments.join('/').replace(/\.[a-z0-9]+$/i, '')

  return path.startsWith(`${folder}/`) ? path : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return json({ error: 'Hiányzó bejelentkezés.' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  )

  const { data: role, error: roleError } = await supabase.rpc('current_admin_role')

  if (roleError) {
    return json({ error: 'A szerepkör lekérdezése nem sikerült.' }, 500)
  }

  if (role !== 'superadmin' && role !== 'admin') {
    return json({ error: 'Ehhez szerkesztői jog kell.' }, 403)
  }

  const body = await req.json().catch(() => null)
  const wanted = Array.isArray(body?.urls) ? body.urls : [body?.url]
  const publicIds = [
    ...new Set(
      wanted
        .filter((item: unknown): item is string => typeof item === 'string')
        .map(publicIdFromUrl)
        .filter((item: string | null): item is string => item !== null),
    ),
  ].slice(0, 50)

  if (publicIds.length === 0) {
    return json({ error: 'Ez a cím nem a Ground Effect mappájából való.' }, 400)
  }

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'A Cloudinary titkok nincsenek beállítva.' }, 500)
  }

  const deleted: Record<string, string> = {}

  for (const publicId of publicIds) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = await sha1Hex(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)

    const form = new FormData()
    form.append('public_id', publicId)
    form.append('api_key', apiKey)
    form.append('timestamp', timestamp)
    form.append('signature', signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    })

    const result = await response.json().catch(() => null)

    deleted[publicId] = response.ok ? (result?.result ?? 'unknown') : 'error'
  }

  return json({ deleted })
})
