import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email.includes('@')) {
    return json({ error: 'Hiányzik a felhasználó e-mail címe.' }, 400)
  }

  if (password.length < minimumPassword) {
    return json({ error: `Az ideiglenes jelszó legyen legalább ${minimumPassword} karakter.` }, 400)
  }

  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: callerData } = await caller.auth.getUser()

  if (callerData?.user?.email?.toLowerCase() === email.toLowerCase()) {
    return json({ error: 'A saját jelszavadat itt nem állíthatod vissza.' }, 403)
  }

  const { data: target, error: targetError } = await admin
    .from('admin_users')
    .select('email, role')
    .eq('email', email)
    .maybeSingle()

  if (targetError) {
    return json({ error: 'A felhasználó lekérdezése nem sikerült.' }, 500)
  }

  if (!target) {
    return json({ error: 'Ilyen admin felhasználó nincs.' }, 404)
  }

  const { data: allowed, error: roleError } = await caller.rpc('can_assign_role', {
    p_role: target.role,
  })

  if (roleError) {
    return json({ error: 'A jogosultság lekérdezése nem sikerült.' }, 500)
  }

  if (allowed !== true) {
    return json({ error: 'Ennek a felhasználónak nem állíthatod vissza a jelszavát.' }, 403)
  }

  const { data: userId, error: idError } = await admin.rpc('auth_user_id', { p_email: email })

  if (idError) {
    return json({ error: 'A belépési fiók lekérdezése nem sikerült.' }, 500)
  }

  if (!userId) {
    return json({ error: 'Ehhez a címhez még nincs belépési fiók.' }, 404)
  }

  const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password })

  if (passwordError) {
    return json({ error: `A jelszó beállítása nem sikerült: ${passwordError.message}` }, 500)
  }

  const { error: flagError } = await admin
    .from('admin_users')
    .update({ must_change_password: true })
    .eq('email', email)

  if (flagError) {
    return json(
      { error: 'A jelszó beállt, de a kötelező csere jelzése nem sikerült. Próbáld újra.' },
      500,
    )
  }

  return json({ email })
})
