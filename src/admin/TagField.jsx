import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { kindLabel, tagKinds } from './tagKinds.js'
import './TagField.css'

const optionLimit = 15
const freeKinds = tagKinds.filter((kind) => kind.value !== 'series')

export default function TagField({ tags, onChange, disabled }) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const [newKind, setNewKind] = useState('driver')

  useEffect(() => {
    if (disabled) {
      return
    }

    let active = true
    setSearching(true)

    const timer = setTimeout(() => {
      supabase
        .rpc('search_tags', { search: query.trim(), limit_count: optionLimit })
        .then(({ data }) => {
          if (active) {
            setOptions((data ?? []).filter((tag) => tag.kind !== 'series'))
            setSearching(false)
          }
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, disabled])

  const selected = new Set(tags.map((tag) => tag.name.toLowerCase()))
  const trimmed = query.trim()
  const exactMatch =
    selected.has(trimmed.toLowerCase()) ||
    options.some((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())

  function toggle(tag) {
    if (selected.has(tag.name.toLowerCase())) {
      onChange(tags.filter((other) => other.name.toLowerCase() !== tag.name.toLowerCase()))
    } else {
      onChange([...tags, tag])
    }
  }

  function addNew() {
    if (!trimmed || exactMatch) {
      return
    }

    onChange([...tags, { name: trimmed, kind: newKind }])
    setQuery('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addNew()
    }
  }

  return (
    <div className="tag-field">
      <span className="tag-label">Tagek</span>

      <div className="tag-chips">
        {tags.map((tag) => (
          <span className="tag-chip" key={tag.id ?? tag.name}>
            {tag.name}
            <span className="tag-chip-kind">- {kindLabel(tag.kind)}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => toggle(tag)}
                aria-label={`${tag.name} eltávolítása`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && <span className="tag-empty">Nincs tag</span>}
      </div>

      {!disabled && (
        <>
          <input
            type="text"
            className="tag-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Keresés vagy új tag neve"
          />

          <div className="tag-options">
            {options.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={
                  selected.has(tag.name.toLowerCase()) ? 'tag-option is-active' : 'tag-option'
                }
                onClick={() => toggle(tag)}
              >
                {tag.name}
                <span className="tag-option-kind">
                  {kindLabel(tag.kind)}
                </span>
              </button>
            ))}

            {!searching && options.length === 0 && (
              <span className="tag-empty">Nincs találat.</span>
            )}
          </div>

          {trimmed && !exactMatch && (
            <div className="tag-new-row">
              <span className="tag-new-label">
                „{trimmed}" még nincs a rendszerben.
              </span>

              <select value={newKind} onChange={(event) => setNewKind(event.target.value)}>
                {freeKinds.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>

              <button type="button" className="admin-button admin-button--ghost" onClick={addNew}>
                Hozzáadás
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
