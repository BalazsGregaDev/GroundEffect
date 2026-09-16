import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const roles = ['superadmin', 'admin', 'demo']
const minimumPassword = 8

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return json({ error: 'Hiányzó bejelentkezés.' }, 401)
  }

  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })

  const { data: role, error: roleError } = await caller.rpc('current_admin_role')

  if (roleError) {
    return json({ error: 'A szerepkör lekérdezése nem sikerült.' }, 500)
  }

  if (role !== 'superadmin') {
    return json({ error: 'Felhasználót csak superadmin vehet fel.' }, 403)
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const wanted = typeof body?.role === 'string' ? body.role : 'demo'

  if (!email.includes('@')) {
    return json({ error: 'Érvényes e-mail címet adj meg.' }, 400)
  }

  if (password.length < minimumPassword) {
    return json({ error: `Az ideiglenes jelszó legyen legalább ${minimumPassword} karakter.` }, 400)
  }

  if (!roles.includes(wanted)) {
    return json({ error: 'Ismeretlen szerepkör.' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    const taken = /already|exists|registered/i.test(createError.message)

    return json(
      {
        error: taken
          ? 'Ehhez a címhez már tartozik fiók. A szerepkörét a listában állítsd, jelszót a Supabase felületén lehet neki adni.'
          : `A felhasználó létrehozása nem sikerült: ${createError.message}`,
      },
      taken ? 409 : 500,
    )
  }

  const { error: roleWriteError } = await admin
    .from('admin_users')
    .upsert({ email, role: wanted, must_change_password: true }, { onConflict: 'email' })

  if (roleWriteError) {
    await admin.auth.admin.deleteUser(created.user.id)

    return json({ error: `A szerepkör beállítása nem sikerült: ${roleWriteError.message}` }, 500)
  }

  return json({ email, role: wanted })
})
