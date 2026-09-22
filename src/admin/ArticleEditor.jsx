import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { readingMinutes, slugify } from '../lib/text.js'
import { deleteImages } from '../lib/cloudinary.js'
import { bodyImages, droppedImages } from '../lib/imageCleanup.js'
import { useAuth } from './useAuth.js'
import { useLookup } from './useLookup.js'
import { statuses } from './statuses.js'
import RichTextField from './RichTextField.jsx'
import CoverField from './CoverField.jsx'
import TagField from './TagField.jsx'
import FeaturedDialog from './FeaturedDialog.jsx'
import FacebookDialog from './FacebookDialog.jsx'
import SavedDialog from './SavedDialog.jsx'
import { dateTimeBounds } from './dateInput.js'
import { featuredArticleLimit } from '../data/site.js'
import './ArticleEditor.css'

const emptyForm = {
  title: '',
  slug: '',
  lead: '',
  body: '',
  cover_url: '',
  cover_focus: '50% 50%',
  category_id: '',
  status: 'draft',
  featured: false,
  reading_minutes: '',
  published_at: '',
  primary_series_tag_id: '',
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
    .select('*, article_tags (tags (id, slug, name, kind))')
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
      cover_focus: data.cover_focus,
      category_id: data.category_id ?? '',
      status: data.status,
      featured: data.featured,
      reading_minutes: data.reading_minutes ?? '',
      published_at: toLocalInput(data.published_at),
      primary_series_tag_id: data.primary_series_tag_id ?? '',
    },
    tags: data.article_tags.map((row) => row.tags),
    facebookPostId: data.facebook_post_id,
  }
}

function SeriesSelect({ label, value, options, onChange, disabled }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        value={value?.id ?? ''}
        onChange={(event) =>
          onChange(options.find((tag) => tag.id === event.target.value) ?? null)
        }
        disabled={disabled}
      >
        <option value="">{label === 'Versenysorozat' ? 'Válassz sorozatot' : 'Nincs'}</option>
        {options.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function toPayload(form) {
  const publishedAt = fromLocalInput(form.published_at)

  return {
    title: form.title.trim(),
    slug: form.slug.trim() || slugify(form.title),
    lead: form.lead.trim() || null,
    body: form.body,
    cover_url: form.cover_url.trim() || null,
    cover_focus: form.cover_focus,
    category_id: form.category_id || null,
    status: form.status,
    featured: form.featured,
    reading_minutes: form.reading_minutes ? Number(form.reading_minutes) : null,
    published_at:
      form.status === 'published' && !publishedAt ? new Date().toISOString() : publishedAt,
    primary_series_tag_id: form.primary_series_tag_id || null,
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
      .upsert({ slug: slugify(tag.name), name: tag.name, kind: tag.kind }, { onConflict: 'slug' })
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
  const { rows: allTags } = useLookup('tags', 'id, slug, name, kind')

  const [form, setForm] = useState(emptyForm)
  const [tags, setTags] = useState([])
  const [saved, setSaved] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [crowded, setCrowded] = useState(null)
  const [facebookPostId, setFacebookPostId] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveDone, setSaveDone] = useState(false)

  useEffect(() => {
    if (!id) {
      setForm(emptyForm)
      setTags([])
      setSaved(null)
      setPrevious(null)
      setFacebookPostId(null)
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
        setFacebookPostId(result.facebookPostId)
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

  function changeCover(url) {
    const current = form.cover_url

    if (current && current !== url && current !== saved?.form.cover_url) {
      deleteImages(current)
    }

    update('cover_url', url)
  }

  function restorePrevious() {
    setForm(previous.form)
    setTags(previous.tags)
    setPrevious(null)
  }

  async function persist() {
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

    if (failure) {
      setError(`Mentés sikertelen: ${failure.message}`)
      return
    }

    const orphans = [
      ...(saved?.form.cover_url && saved.form.cover_url !== payload.cover_url
        ? [saved.form.cover_url]
        : []),
      ...droppedImages(saved?.form.body, payload.body),
    ]

    if (orphans.length > 0) {
      deleteImages(orphans)
    }

    setPrevious(orphans.length > 0 ? null : saved)
    setSaved({ form, tags })
    setSaveDone(true)

    if (!id) {
      navigate(`/admin/cikkek/${articleId}`, { replace: true })
    }
  }

  function setSeries(primary, related) {
    const chosen = [primary, ...related].filter(Boolean)

    update('primary_series_tag_id', primary?.id ?? '')
    setTags((current) => [...current.filter((tag) => tag.kind !== 'series'), ...chosen])
  }

  function pickRelated(index, tag) {
    const slots = [relatedSeries[0] ?? null, relatedSeries[1] ?? null]
    slots[index] = tag

    setSeries(seriesTag, slots.filter(Boolean))
  }

  async function otherFeatured() {
    const { data, error: lookupError } = await supabase
      .from('articles')
      .select('id, title, published_at')
      .eq('featured', true)
      .order('published_at', { ascending: false })

    if (lookupError) {
      setError(`A kiemelt cikkek lekérdezése nem sikerült: ${lookupError.message}`)
      return null
    }

    return data.filter((article) => article.id !== id)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!seriesTag) {
      setError('Válassz versenysorozatot, e nélkül nem menthető a cikk.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (form.featured && !saved?.form.featured) {
        const others = await otherFeatured()

        if (!others) {
          return
        }

        if (others.length >= featuredArticleLimit) {
          setCrowded(others)
          return
        }
      }

      await persist()
    } catch (failure) {
      setError(`Mentés sikertelen: ${failure.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function replaceFeatured(dropId) {
    setCrowded(null)
    setSaving(true)
    setError(null)

    try {
      const { error: dropError } = await supabase
        .from('articles')
        .update({ featured: false })
        .eq('id', dropId)

      if (dropError) {
        setError(`A kiemelés levétele nem sikerült: ${dropError.message}`)
        return
      }

      await persist()
    } catch (failure) {
      setError(`Mentés sikertelen: ${failure.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      setError(`Törlés sikertelen: ${error.message}`)
      return
    }

    deleteImages(saved?.form.cover_url, bodyImages(saved?.form.body))
    navigate('/admin/cikkek')
  }

  if (loading) {
    return <p className="admin-readonly">Betöltés…</p>
  }

  const readOnly = !canEdit
  const seriesTags = allTags.filter((tag) => tag.kind === 'series')
  const seriesTag = seriesTags.find((tag) => tag.id === form.primary_series_tag_id) ?? null
  const relatedSeries = tags.filter(
    (tag) => tag.kind === 'series' && tag.id !== form.primary_series_tag_id,
  )
  const canPublish = isSuperadmin || saved?.form.status === 'published'
  const isLive =
    saved?.form.status === 'published' &&
    (!saved.form.published_at || new Date(saved.form.published_at) <= new Date())

  return (
    <form className="editor" onSubmit={handleSubmit}>
      {saveDone && <SavedDialog onClose={() => navigate('/admin/cikkek')} />}

      {crowded && (
        <FeaturedDialog
          articles={crowded}
          onPick={replaceFeatured}
          onCancel={() => setCrowded(null)}
        />
      )}

      {sharing && (
        <FacebookDialog
          articleId={id}
          form={saved.form}
          onClose={() => setSharing(false)}
          onShared={(postId) => {
            setFacebookPostId(postId)
            setSharing(false)
          }}
        />
      )}

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
              {...dateTimeBounds}
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

          <SeriesSelect
            label="Versenysorozat"
            value={seriesTag}
            options={seriesTags.filter(
              (tag) => !relatedSeries.some((other) => other.id === tag.id),
            )}
            onChange={(tag) => setSeries(tag, relatedSeries)}
            disabled={readOnly}
          />

          {[0, 1].map((index) => (
            <SeriesSelect
              key={index}
              label="Kapcsolódó sorozat"
              value={relatedSeries[index] ?? null}
              options={seriesTags.filter(
                (tag) =>
                  tag.id !== seriesTag?.id &&
                  tag.id !== (relatedSeries[index === 0 ? 1 : 0] ?? {}).id,
              )}
              onChange={(tag) => pickRelated(index, tag)}
              disabled={readOnly || !seriesTag}
            />
          ))}

          <TagField
            tags={tags.filter((tag) => tag.kind !== 'series')}
            onChange={(next) => setTags(seriesTag ? [...next, seriesTag] : next)}
            disabled={readOnly}
          />

          <CoverField
            value={form.cover_url}
            focus={form.cover_focus}
            onChange={changeCover}
            onFocusChange={(focus) => update('cover_focus', focus)}
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

          <p className="editor-hint">
            Egyszerre legfeljebb {featuredArticleLimit} cikk lehet kiemelt.
          </p>

          {id && canEdit && (
            <div className="editor-share">
              {facebookPostId ? (
                <>
                  <p className="editor-hint">Ez a cikk már kikerült a Facebook oldalra.</p>
                  <a
                    className="editor-link"
                    href={`https://www.facebook.com/${facebookPostId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Poszt megnyitása
                  </a>
                  <button
                    type="button"
                    className="editor-link"
                    onClick={() => setSharing(true)}
                    disabled={!isLive}
                  >
                    Megosztás újra
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => setSharing(true)}
                  disabled={!isLive}
                >
                  Megosztás Facebookra
                </button>
              )}

              {!isLive && (
                <p className="editor-hint">
                  Megosztani csak már publikált, nem időzített cikket lehet.
                </p>
              )}
            </div>
          )}

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
