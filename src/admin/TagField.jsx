import { useState } from 'react'
import './TagField.css'

export default function TagField({ tags, onChange, suggestions, disabled }) {
  const [input, setInput] = useState('')

  function addTag() {
    const name = input.trim()

    if (!name || tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      setInput('')
      return
    }

    const known = suggestions.find((tag) => tag.name.toLowerCase() === name.toLowerCase())

    onChange([...tags, known ?? { name }])
    setInput('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag()
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
                onClick={() => onChange(tags.filter((other) => other !== tag))}
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
        <div className="tag-input">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            list="tag-suggestions"
            placeholder="Pilóta, csapat vagy pálya"
          />
          <datalist id="tag-suggestions">
            {suggestions.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <button type="button" className="admin-button admin-button--ghost" onClick={addTag}>
            Hozzáadás
          </button>
        </div>
      )}
    </div>
  )
}
