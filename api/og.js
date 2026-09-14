export const config = { runtime: 'edge' }

const siteName = 'Ground Effect'
const cardTransform = 'c_fill,g_auto,w_1200,h_630,f_jpg,q_auto'

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cardImage(coverUrl) {
  if (!coverUrl || !coverUrl.includes('/upload/')) {
    return coverUrl
  }

  return coverUrl.replace('/upload/', `/upload/${cardTransform}/`)
}

async function loadArticle(slug) {
  const query = new URLSearchParams({
    slug: `eq.${slug}`,
    status: 'eq.published',
    published_at: `lte.${new Date().toISOString()}`,
    select: 'title,lead,cover_url,published_at',
    limit: '1',
  })

  const key = process.env.VITE_SUPABASE_ANON_KEY
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/articles?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    return null
  }

  const rows = await response.json()

  return rows[0] ?? null
}

function replaceSocialTags(html, title, tags) {
  return html
    .replace(/\s*<meta property="og:[^"]*"[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:[^"]*"[^>]*>/g, '')
    .replace(/\s*<meta name="description"[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace('</head>', `${tags}</head>`)
}

export default async function handler(request) {
  const { origin, searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  const [shell, article] = await Promise.all([
    fetch(`${origin}/index.html`).then((response) => response.text()),
    loadArticle(slug),
  ])

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  }

  if (!article) {
    return new Response(shell, { headers })
  }

  const title = escapeHtml(`${article.title} — ${siteName}`)
  const description = escapeHtml(article.lead ?? '')
  const image = cardImage(article.cover_url)

  const tags = [
    `<meta name="description" content="${description}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="${siteName}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${origin}/cikkek/${escapeHtml(slug)}">`,
    `<meta property="og:locale" content="hu_HU">`,
    `<meta property="article:published_time" content="${article.published_at}">`,
    image && `<meta property="og:image" content="${escapeHtml(image)}">`,
    image && `<meta property="og:image:width" content="1200">`,
    image && `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
  ]
    .filter(Boolean)
    .join('')

  return new Response(replaceSocialTags(shell, title, tags), { headers })
}
