import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const maxEvents = 200
const defaultSender = 'GroundEffect hibajegy <onboarding@resend.dev>'

const logKinds: Record<string, string> = {
  page: 'Oldal',
  click: 'Kattintás',
  change: 'Módosítás',
  request: 'Kérés',
  error: 'Hiba',
}

type LogEntry = { at: string; kind: string; message: string }

type Report = {
  reporter: string
  role: string
  kind: string
  happenedAt: string | null
  goal: string
  trigger: string
  note: string
  page: string
  userAgent: string
  viewport: string
  log: LogEntry[]
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanLog(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.slice(-maxEvents).map((entry) => ({
    at: text(entry?.at, 40),
    kind: text(entry?.kind, 20),
    message: text(entry?.message, 300),
  }))
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function budapest(iso: string | null, withDate = true) {
  if (!iso || Number.isNaN(Date.parse(iso))) {
    return '–'
  }

  return new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    ...(withDate ? { year: 'numeric', month: '2-digit', day: '2-digit' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

function details(report: Report): [string, string][] {
  return [
    ['Típus', report.kind],
    ['Mikor történt', budapest(report.happenedAt)],
    ['Mi volt a cél', report.goal],
    ['Mi után jelentkezett', report.trigger || '–'],
    ['Megjegyzés', report.note || '–'],
    ['Oldal', report.page || '–'],
    ['Bejelentő', `${report.reporter} (${report.role})`],
    ['Böngésző', report.userAgent || '–'],
    ['Kijelző', report.viewport || '–'],
  ]
}

function emailHtml(report: Report) {
  const cell = 'padding:6px 10px;border-bottom:1px solid #2a2a2a;vertical-align:top;text-align:left'

  const facts = details(report)
    .map(
      ([label, value]) =>
        `<tr><th style="${cell};color:#8a8a8a;font-weight:normal;white-space:nowrap">${label}</th>` +
        `<td style="${cell};white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join('')

  const events = report.log
    .map(
      (entry) =>
        `<tr><td style="${cell};font-family:monospace;white-space:nowrap">${budapest(entry.at, false)}</td>` +
        `<td style="${cell};color:#b8791a;white-space:nowrap">${escapeHtml(logKinds[entry.kind] ?? entry.kind)}</td>` +
        `<td style="${cell}">${escapeHtml(entry.message)}</td></tr>`,
    )
    .join('')

  const logBlock = report.log.length
    ? `<h3 style="margin:24px 0 8px">Napló (${report.log.length} esemény, a legrégebbitől)</h3>` +
      `<table style="border-collapse:collapse;width:100%;font-size:13px">${events}</table>`
    : '<p style="color:#8a8a8a">Napló nélkül küldték.</p>'

  return (
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#141414">' +
    '<h2 style="margin:0 0 12px">GroundEffect hibajegy</h2>' +
    `<table style="border-collapse:collapse;width:100%">${facts}</table>` +
    logBlock +
    '</div>'
  )
}

function emailText(report: Report) {
  const facts = details(report)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')

  const events = report.log
    .map((entry) => `${budapest(entry.at, false)}  ${logKinds[entry.kind] ?? entry.kind}  ${entry.message}`)
    .join('\n')

  return `${facts}\n\nNapló:\n${events || 'Napló nélkül küldték.'}\n`
}

async function sendEmail(report: Report) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const recipients = (Deno.env.get('BUG_REPORT_TO') ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean)

  if (!apiKey || recipients.length === 0) {
    return { status: 'skipped', error: null }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('BUG_REPORT_FROM') || defaultSender,
      to: recipients,
      reply_to: report.reporter || undefined,
      subject: `GroundEffect hibajegy: ${report.kind} – ${report.goal.slice(0, 60)}`,
      html: emailHtml(report),
      text: emailText(report),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()

    return { status: 'failed', error: `${response.status} ${detail}`.slice(0, 500) }
  }

  return { status: 'sent', error: null }
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

  const { data: access, error: roleError } = await caller.rpc('current_admin_access')

  if (roleError) {
    return json({ error: 'A szerepkör lekérdezése nem sikerült.' }, 500)
  }

  const role: string | undefined = access?.[0]?.name

  if (!role) {
    return json({ error: 'Hibajegyet csak az admin felület felhasználói küldhetnek.' }, 403)
  }

  const { data: userData } = await caller.auth.getUser()
  const body = await req.json().catch(() => null)
  const happenedAt = text(body?.happened_at, 40)

  const report: Report = {
    reporter: userData?.user?.email ?? '',
    role,
    kind: text(body?.kind, 80),
    happenedAt: Number.isNaN(Date.parse(happenedAt)) ? null : happenedAt,
    goal: text(body?.goal, 300),
    trigger: text(body?.trigger, 300),
    note: text(body?.note, 4000),
    page: text(body?.page, 200),
    userAgent: text(body?.user_agent, 300),
    viewport: text(body?.viewport, 30),
    log: cleanLog(body?.log),
  }

  if (!report.kind || !report.goal) {
    return json({ error: 'Add meg a hiba típusát és a célt.' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: stored } = await admin
    .from('bug_reports')
    .insert({
      reporter_email: report.reporter || null,
      reporter_role: report.role,
      kind: report.kind,
      happened_at: report.happenedAt,
      goal: report.goal,
      trigger_step: report.trigger || null,
      note: report.note || null,
      page: report.page || null,
      user_agent: report.userAgent || null,
      viewport: report.viewport || null,
      log: report.log,
    })
    .select('id')
    .single()

  const email = await sendEmail(report).catch((error) => ({
    status: 'failed',
    error: String(error?.message ?? error).slice(0, 500),
  }))

  if (stored) {
    await admin
      .from('bug_reports')
      .update({ email_status: email.status, email_error: email.error })
      .eq('id', stored.id)
  }

  if (!stored && email.status !== 'sent') {
    return json({ error: 'A hibajegyet nem sikerült rögzíteni.' }, 500)
  }

  const messages: Record<string, string> = {
    sent: 'Köszönjük, a hibajegyet elküldtük.',
    skipped: 'Köszönjük, a hibajegy elmentve. Az e-mailes értesítés még nincs beállítva.',
    failed: 'Köszönjük, a hibajegy elmentve, de az e-mailt nem sikerült elküldeni.',
  }

  return json({ id: stored?.id ?? null, emailed: email.status === 'sent', message: messages[email.status] })
})
