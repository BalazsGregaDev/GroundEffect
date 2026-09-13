import { useState } from 'react'
import { tagKinds } from './tagKinds.js'
import './TagField.css'

export default function TagField({ tags, onChange, available, disabled }) {
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState('driver')

  const selected = new Set(tags.map((tag) => tag.name.toLowerCase()))

  function toggle(tag) {
    if (selected.has(tag.name.toLowerCase())) {
      onChange(tags.filter((other) => other.name.toLowerCase() !== tag.name.toLowerCase()))
    } else {
      onChange([...tags, tag])
    }
  }

  function addNew() {
    const name = newName.trim()

    if (!name || selected.has(name.toLowerCase())) {
      setNewName('')
      return
    }

    const known = available.find((tag) => tag.name.toLowerCase() === name.toLowerCase())

    onChange([...tags, known ?? { name, kind: newKind }])
    setNewName('')
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
          <div className="tag-groups">
            {tagKinds.map((kind) => {
              const group = available.filter((tag) => tag.kind === kind.value)

              if (group.length === 0) {
                return null
              }

              return (
                <div className="tag-group" key={kind.value}>
                  <span className="tag-group-label">{kind.label}</span>

                  <div className="tag-options">
                    {group.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className={
                          selected.has(tag.name.toLowerCase())
                            ? 'tag-option is-active'
                            : 'tag-option'
                        }
                        onClick={() => toggle(tag)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <details className="tag-new">
            <summary>Új tag felvétele</summary>

            <div className="tag-new-row">
              <input
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Név"
              />

              <select value={newKind} onChange={(event) => setNewKind(event.target.value)}>
                {tagKinds.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={addNew}
              >
                Hozzáadás
              </button>
            </div>
          </details>
        </>
      )}
    </div>
  )
}
