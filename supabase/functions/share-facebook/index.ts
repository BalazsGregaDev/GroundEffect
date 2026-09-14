import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const graphVersion = 'v26.0'

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

  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return json({ error: 'Hiányzó bejelentkezés.' }, 401)
  }

  if (!(await callerIsEditor(authorization))) {
    return json({ error: 'Ehhez szerkesztői jog kell.' }, 403)
  }

  const pageId = Deno.env.get('FACEBOOK_PAGE_ID')
  const pageToken = Deno.env.get('FACEBOOK_PAGE_TOKEN')
  const siteUrl = Deno.env.get('SITE_URL')

  if (!pageId || !pageToken || !siteUrl) {
    return json({ error: 'A Facebook titkok nincsenek beállítva.' }, 500)
  }

  const { articleId, message } = await req.json()

  if (!articleId || !message?.trim()) {
    return json({ error: 'Hiányzik a cikk vagy a kísérőszöveg.' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: article, error: lookupError } = await admin
    .from('articles')
    .select('slug, status, published_at')
    .eq('id', articleId)
    .single()

  if (lookupError) {
    return json({ error: 'Ez a cikk nem érhető el.' }, 404)
  }

  if (article.status !== 'published' || new Date(article.published_at) > new Date()) {
    return json({ error: 'Csak már publikált cikket lehet megosztani.' }, 409)
  }

  const graph = await fetch(`https://graph.facebook.com/${graphVersion}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.trim(),
      link: `${siteUrl}/cikkek/${article.slug}`,
      access_token: pageToken,
    }),
  })

  const result = await graph.json()

  if (!graph.ok) {
    return json({ error: `A Facebook elutasította: ${result.error?.message}` }, 502)
  }

  await admin.from('articles').update({ facebook_post_id: result.id }).eq('id', articleId)

  return json({ postId: result.id, url: `https://www.facebook.com/${result.id}` })
})
