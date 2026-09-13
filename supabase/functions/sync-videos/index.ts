import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sync-secret',
}

const api = 'https://www.googleapis.com/youtube/v3'
const maxVideos = 50
const thumbnailOrder = ['maxres', 'standard', 'high', 'medium', 'default']

type Thumbnails = Record<string, { url: string } | undefined>

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function callYoutube(path: string, params: Record<string, string>) {
  const response = await fetch(`${api}/${path}?${new URLSearchParams(params)}`)
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error?.message ?? `A YouTube API ${response.status} hibát adott.`)
  }

  return body
}

async function uploadsPlaylistId(channel: string, key: string) {
  const selector = channel.startsWith('UC') ? { id: channel } : { forHandle: channel }
  const body = await callYoutube('channels', { part: 'contentDetails', key, ...selector })
  const playlist = body.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!playlist) {
    throw new Error(`Nincs ilyen csatorna: ${channel}`)
  }

  return playlist as string
}

async function latestVideoIds(playlistId: string, key: string) {
  const body = await callYoutube('playlistItems', {
    part: 'contentDetails',
    playlistId,
    maxResults: String(maxVideos),
    key,
  })

  return body.items.map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId)
}

function durationSeconds(iso: string) {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)

  if (!match) {
    return null
  }

  const [, days, hours, minutes, seconds] = match

  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  )
}

function clockDuration(total: number) {
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

function pickThumbnail(thumbnails: Thumbnails) {
  for (const name of thumbnailOrder) {
    const found = thumbnails[name]?.url

    if (found) {
      return found
    }
  }

  return null
}

async function videoRows(ids: string[], key: string, syncedAt: string) {
  const body = await callYoutube('videos', {
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
    key,
  })

  return body.items
    .filter((item) => item.snippet.liveBroadcastContent !== 'upcoming')
    .map((item) => {
      const seconds = durationSeconds(item.contentDetails.duration)

      return {
        youtube_id: item.id,
        title: item.snippet.title,
        duration: seconds === null ? null : clockDuration(seconds),
        duration_seconds: seconds,
        thumbnail_url: pickThumbnail(item.snippet.thumbnails),
        views: Number(item.statistics.viewCount ?? 0),
        published_at: item.snippet.publishedAt,
        synced_at: syncedAt,
      }
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

  const key = Deno.env.get('YOUTUBE_API_KEY')
  const channel = Deno.env.get('YOUTUBE_CHANNEL')

  if (!key || !channel) {
    return json({ error: 'A YouTube titkok nincsenek beállítva.' }, 500)
  }

  const syncedAt = new Date().toISOString()

  try {
    const playlistId = await uploadsPlaylistId(channel, key)
    const ids = await latestVideoIds(playlistId, key)

    if (ids.length === 0) {
      return json({ synced: 0, syncedAt })
    }

    const rows = await videoRows(ids, key, syncedAt)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error } = await admin.from('videos').upsert(rows, { onConflict: 'youtube_id' })

    if (error) {
      return json({ error: `A mentés nem sikerült: ${error.message}` }, 500)
    }

    return json({ synced: rows.length, syncedAt })
  } catch (failure) {
    return json({ error: (failure as Error).message }, 502)
  }
})
