import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { readingMinutes, slugify } from '../lib/text.js'
import { useAuth } from './useAuth.js'
import { useLookup } from './useLookup.js'
import { statuses } from './statuses.js'
import RichTextField from './RichTextField.jsx'
import ImageField from './ImageField.jsx'
import TagField from './TagField.jsx'
import './ArticleEditor.css'

const emptyForm = {
  title: '',
  slug: '',
  lead: '',
  body: '',
  cover_url: '',
  category_id: '',
  status: 'draft',
  featured: false,
  reading_minutes: '',
  published_at: '',
}

function toLocalInput(iso) {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null
}

async function loadArticle(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('*, article_tags (tags (id, slug, name))')
    .eq('id', id)
    .single()

  if (error) {
    return { error }
  }

  return {
    form: {
      title: data.title,
      slug: data.slug,
      lead: data.lead ?? '',
      body: data.body,
      cover_url: data.cover_url ?? '',
      category_id: data.category_id ?? '',
      status: data.status,
      featured: data.featured,
      reading_minutes: data.reading_minutes ?? '',
      published_at: toLocalInput(data.published_at),
    },
    tags: data.article_tags.map((row) => row.tags),
  }
}

function toPayload(form) {
  const publishedAt = fromLocalInput(form.published_at)

  return {
    title: form.title.trim(),
    slug: form.slug.trim() || slugify(form.title),
    lead: form.lead.trim() || null,
    body: form.body,
    cover_url: form.cover_url.trim() || null,
    category_id: form.category_id || null,
    status: form.status,
    featured: form.featured,
    reading_minutes: form.reading_minutes ? Number(form.reading_minutes) : null,
    published_at:
      form.status === 'published' && !publishedAt ? new Date().toISOString() : publishedAt,
  }
}

async function saveTags(articleId, tags) {
  const ids = []

  for (const tag of tags) {
    if (tag.id) {
      ids.push(tag.id)
      continue
    }

    const { data, error } = await supabase
      .from('tags')
      .upsert({ slug: slugify(tag.name), name: tag.name }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (error) {
      return error
    }

    ids.push(data.id)
  }

  await supabase.from('article_tags').delete().eq('article_id', articleId)

  if (ids.length === 0) {
    return null
  }

  const { error } = await supabase
    .from('article_tags')
    .insert(ids.map((tagId) => ({ article_id: articleId, tag_id: tagId })))

  return error
}

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, canEdit, isSuperadmin } = useAuth()
  const { rows: categories } = useLookup('categories')
  const { rows: allTags, reload: reloadTags } = useLookup('tags')

  const [form, setForm] = useState(emptyForm)
  const [tags, setTags] = useState([])
  const [saved, setSaved] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) {
      setForm(emptyForm)
      setTags([])
      setSaved(null)
      setPrevious(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    loadArticle(id).then((result) => {
      if (!active) {
        return
      }

      if (result.error) {
        setError('Ez a cikk nem érhető el.')
      } else {
        setForm(result.form)
        setTags(result.tags)
        setSaved({ form: result.form, tags: result.tags })
      }

      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [id])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function restorePrevious() {
    setForm(previous.form)
    setTags(previous.tags)
    setPrevious(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = toPayload(form)
    let articleId = id
    let failure = null

    if (id) {
      const { error } = await supabase.from('articles').update(payload).eq('id', id)
      failure = error
    } else {
      const { data, error } = await supabase
        .from('articles')
        .insert({ ...payload, author_email: session.user.email })
        .select('id')
        .single()

      failure = error
      articleId = data?.id
    }

    if (!failure) {
      failure = await saveTags(articleId, tags)
    }

    setSaving(false)

    if (failure) {
      setError(`Mentés sikertelen: ${failure.message}`)
      return
    }

    setPrevious(saved)
    setSaved({ form, tags })
    reloadTags()

    if (!id) {
      navigate(`/admin/cikkek/${articleId}`, { replace: true })
    }
  }

  async function handleDelete() {
    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      setError(`Törlés sikertelen: ${error.message}`)
      return
    }

    navigate('/admin/cikkek')
  }

  if (loading) {
    return <p className="admin-readonly">Betöltés…</p>
  }

  const readOnly = !canEdit
  const canPublish = isSuperadmin || saved?.form.status === 'published'

  return (
    <form className="editor" onSubmit={handleSubmit}>
      <div className="editor-head">
        <div>
          <Link to="/admin/cikkek" className="editor-back">
            Vissza a listához
          </Link>
          <h1>{id ? 'Cikk szerkesztése' : 'Új cikk'}</h1>
        </div>

        {canEdit && (
          <div className="editor-actions">
            {previous && (
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={restorePrevious}
              >
                Előző verzió visszaállítása
              </button>
            )}
            <button type="submit" className="admin-button" disabled={saving}>
              {saving ? 'Mentés…' : 'Mentés'}
            </button>
          </div>
        )}
      </div>

      {readOnly && (
        <p className="admin-readonly">Demó szerepkörrel csak olvasni tudod a cikkeket.</p>
      )}

      {error && <p className="admin-error">{error}</p>}

      {previous && (
        <p className="admin-readonly">
          A visszaállítás a mentés előtti szövegeket tölti vissza az űrlapba. Mentened kell,
          hogy élesben is visszakerüljön.
        </p>
      )}

      <div className="editor-grid">
        <div className="editor-main">
          <label className="admin-field">
            <span>Cím</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              onBlur={() => !form.slug && form.title && update('slug', slugify(form.title))}
              disabled={readOnly}
              required
            />
          </label>

          <label className="admin-field">
            <span>Webcím (slug)</span>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => update('slug', event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label className="admin-field">
            <span>Lead</span>
            <textarea
              value={form.lead}
              onChange={(event) => update('lead', event.target.value)}
              disabled={readOnly}
              rows={3}
            />
          </label>

          <RichTextField
            label="Szöveg"
            value={form.body}
            onChange={(value) => update('body', value)}
            disabled={readOnly}
          />
        </div>

        <aside className="editor-side">
          <label className="admin-field">
            <span>Állapot</span>
            <select
              value={form.status}
              onChange={(event) => update('status', event.target.value)}
              disabled={readOnly}
            >
              {statuses.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                  disabled={status.value === 'published' && !canPublish}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          {!canPublish && (
            <p className="editor-hint">Publikálni csak superadmin tud.</p>
          )}

          <label className="admin-field">
            <span>Publikálás ideje</span>
            <input
              type="datetime-local"
              value={form.published_at}
              onChange={(event) => update('published_at', event.target.value)}
              disabled={readOnly}
            />
          </label>

          <p className="editor-hint">Jövőbeli időpont esetén a cikk csak akkor jelenik meg.</p>

          <label className="admin-field">
            <span>Kategória</span>
            <select
              value={form.category_id}
              onChange={(event) => update('category_id', event.target.value)}
              disabled={readOnly}
            >
              <option value="">Nincs</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <TagField
            tags={tags}
            onChange={setTags}
            suggestions={allTags}
            disabled={readOnly}
          />

          <ImageField
            label="Borítókép"
            value={form.cover_url}
            onChange={(url) => update('cover_url', url)}
            disabled={readOnly}
          />

          <label className="admin-field">
            <span>Olvasási idő (perc)</span>
            <input
              type="number"
              min="1"
              value={form.reading_minutes}
              onChange={(event) => update('reading_minutes', event.target.value)}
              disabled={readOnly}
            />
          </label>

          {!readOnly && form.body && (
            <button
              type="button"
              className="editor-link"
              onClick={() => update('reading_minutes', readingMinutes(form.body))}
            >
              Számold ki a szövegből
            </button>
          )}

          <label className="editor-checkbox">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update('featured', event.target.checked)}
              disabled={readOnly}
            />
            Kiemelt cikk
          </label>

          {id && canEdit && (
            <div className="editor-delete">
              {confirmDelete ? (
                <>
                  <button type="button" className="admin-button" onClick={handleDelete}>
                    Igen, töröld
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Mégsem
                  </button>
                </>
              ) : (
                <button type="button" className="editor-link" onClick={() => setConfirmDelete(true)}>
                  Cikk törlése
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </form>
  )
}
