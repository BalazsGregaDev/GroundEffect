import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { slugify } from '../lib/text.js'
import { tagKinds } from './tagKinds.js'
import './TagManager.css'

export default function TagManager({ onClose }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState('driver')

  const load = useCallback(async () => {
    setLoading(true)

    const result = await supabase
      .from('tags')
      .select('id, slug, name, kind, article_tags (count)')
      .order('name')

    setTags(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function run(action) {
    const { error } = await action

    if (error) {
      setError(error)
      return
    }

    setError(null)
    load()
  }

  async function addTag(event) {
    event.preventDefault()

    const name = newName.trim()

    if (!name) {
      return
    }

    setNewName('')
    await run(supabase.from('tags').upsert({ slug: slugify(name), name, kind: newKind }, { onConflict: 'slug' }))
  }

  async function saveEdit() {
    const name = editing.name.trim()

    if (!name) {
      return
    }

    const target = editing
    setEditing(null)
    await run(supabase.from('tags').update({ name, kind: target.kind }).eq('id', target.id))
  }

  async function removeTag(tag) {
    setRemoving(null)
    await run(supabase.from('tags').delete().eq('id', tag.id))
  }

  const visible = tags.filter(
    (tag) =>
      (filter === 'all' || tag.kind === filter) &&
      tag.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className="tagman-backdrop" onClick={onClose}>
      <div className="tagman-panel" onClick={(event) => event.stopPropagation()}>
        <div className="tagman-head">
          <h2>Tagek kezelése</h2>
          <button type="button" className="tagman-close" onClick={onClose} aria-label="Bezárás">
            ×
          </button>
        </div>

        <form className="tagman-add" onSubmit={addTag}>
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Új tag neve"
          />

          <select value={newKind} onChange={(event) => setNewKind(event.target.value)}>
            {tagKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>

          <button type="submit" className="admin-button">
            Hozzáadás
          </button>
        </form>

        <div className="tagman-filters">
          <button
            type="button"
            className={filter === 'all' ? 'tagman-filter is-active' : 'tagman-filter'}
            onClick={() => setFilter('all')}
          >
            Mind ({tags.length})
          </button>

          {tagKinds.map((kind) => {
            const count = tags.filter((tag) => tag.kind === kind.value).length

            return (
              <button
                key={kind.value}
                type="button"
                className={filter === kind.value ? 'tagman-filter is-active' : 'tagman-filter'}
                onClick={() => setFilter(kind.value)}
              >
                {kind.label} ({count})
              </button>
            )
          })}

          <input
            type="search"
            className="tagman-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Keresés"
          />
        </div>

        {error && <p className="admin-error">Hiba: {error.message}</p>}

        {loading && <p className="tagman-empty">Betöltés…</p>}

        {!loading && visible.length === 0 && <p className="tagman-empty">Nincs találat.</p>}

        <ul className="tagman-list">
          {visible.map((tag) => (
            <li key={tag.id}>
              {editing?.id === tag.id ? (
                <div className="tagman-row tagman-row--editing">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                    autoFocus
                  />

                  <select
                    value={editing.kind}
                    onChange={(event) => setEditing({ ...editing, kind: event.target.value })}
                  >
                    {tagKinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>

                  <button type="button" className="admin-button" onClick={saveEdit}>
                    Mentés
                  </button>

                  <button type="button" className="tagman-link" onClick={() => setEditing(null)}>
                    Mégsem
                  </button>
                </div>
              ) : (
                <div className="tagman-row">
                  <span className="tagman-name">{tag.name}</span>
                  <span className="tagman-kind">
                    {tagKinds.find((kind) => kind.value === tag.kind).label}
                  </span>
                  <span className="tagman-count">{tag.article_tags[0]?.count ?? 0} cikk</span>

                  <button
                    type="button"
                    className="tagman-link"
                    onClick={() => setEditing({ id: tag.id, name: tag.name, kind: tag.kind })}
                  >
                    Átnevezés
                  </button>

                  {removing?.id === tag.id ? (
                    <>
                      <button type="button" className="tagman-danger" onClick={() => removeTag(tag)}>
                        Igen, töröld
                      </button>
                      <button type="button" className="tagman-link" onClick={() => setRemoving(null)}>
                        Mégsem
                      </button>
                    </>
                  ) : (
                    <button type="button" className="tagman-link" onClick={() => setRemoving(tag)}>
                      Törlés
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <p className="tagman-hint">
          Az átnevezés megtartja a cikkek kapcsolatát, a törlés viszont minden cikkről
          leveszi a taget. Duplikátumok egységesítéséhez átnevezés a jó eszköz.
        </p>
      </div>
    </div>
  )
}
