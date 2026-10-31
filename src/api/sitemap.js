export const config = { runtime: 'edge' }

const pages = ['/', '/cikkek', '/merch']
const maxArticles = 5000

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function day(stamp) {
  return typeof stamp === 'string' ? stamp.slice(0, 10) : null
}

async function loadArticles() {
  const key = process.env.VITE_SUPABASE_ANON_KEY
  const query = new URLSearchParams({
    select: 'slug,updated_at,published_at',
    status: 'eq.published',
    published_at: `lte.${new Date().toISOString()}`,
    order: 'published_at.desc',
    limit: String(maxArticles),
  })

  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/articles?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  if (!response.ok) {
    return []
  }

  return response.json()
}

function entry(loc, lastmod) {
  const stamp = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''

  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${stamp}\n  </url>`
}

export default async function handler(request) {
  const { origin } = new URL(request.url)
  const articles = await loadArticles()

  const newest = articles.map((article) => day(article.updated_at ?? article.published_at))[0]

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((path) => entry(`${origin}${path}`, path === '/' ? newest : null)),
    ...articles.map((article) =>
      entry(`${origin}/cikkek/${article.slug}`, day(article.updated_at ?? article.published_at)),
    ),
    '</urlset>',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
