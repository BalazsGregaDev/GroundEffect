import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sync-secret',
}

const graphVersion = 'v26.0'
const maxPosts = 25
const postFields = 'id,message,created_time,permalink_url,full_picture'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function callerIsEditor(authorization: string) {
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })

  const { data: role, error } = await caller.rpc('current_admin_role')

  if (error) {
    throw new Error('A szerepkör lekérdezése nem sikerült.')
  }

  return role === 'superadmin' || role === 'admin'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const syncSecret = Deno.env.get('SYNC_SECRET')
  const scheduled = Boolean(syncSecret) && req.headers.get('x-sync-secret') === syncSecret

  if (!scheduled) {
    const authorization = req.headers.get('Authorization')

    if (!authorization) {
      return json({ error: 'Hiányzó bejelentkezés.' }, 401)
    }

    if (!(await callerIsEditor(authorization))) {
      return json({ error: 'Ehhez szerkesztői jog kell.' }, 403)
    }
  }

  const pageId = Deno.env.get('FACEBOOK_PAGE_ID')
  const pageToken = Deno.env.get('FACEBOOK_PAGE_TOKEN')

  if (!pageId || !pageToken) {
    return json({ error: 'A Facebook titkok nincsenek beállítva.' }, 500)
  }

  const query = new URLSearchParams({
    fields: postFields,
    limit: String(maxPosts),
    access_token: pageToken,
  })

  const graph = await fetch(`https://graph.facebook.com/${graphVersion}/${pageId}/posts?${query}`)
  const result = await graph.json()

  if (!graph.ok) {
    return json({ error: `A Facebook elutasította: ${result.error?.message}` }, 502)
  }

  const syncedAt = new Date().toISOString()

  const rows = result.data.map((post) => ({
    facebook_id: post.id,
    message: post.message ?? null,
    permalink_url: post.permalink_url ?? null,
    image_url: post.full_picture ?? null,
    created_time: post.created_time,
    synced_at: syncedAt,
  }))

  if (rows.length === 0) {
    return json({ synced: 0, syncedAt })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await admin
    .from('facebook_posts')
    .upsert(rows, { onConflict: 'facebook_id' })

  if (error) {
    return json({ error: `A mentés nem sikerült: ${error.message}` }, 500)
  }

  return json({ synced: rows.length, syncedAt })
})
