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

async function signParams(params: Record<string, string>, apiSecret: string) {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return sha1Hex(canonical + apiSecret)
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

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: 'A Cloudinary titkok nincsenek beállítva.' }, 500)
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await signParams({ folder, timestamp }, apiSecret)

  return json({ cloudName, apiKey, timestamp, folder, signature })
})
