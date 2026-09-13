import { useState } from 'react'
import { renderMarkdown } from '../lib/markdown.js'
import './MarkdownField.css'

export default function MarkdownField({ label, value, onChange, disabled }) {
  const [preview, setPreview] = useState(false)

  return (
    <div className="markdown-field">
      <div className="markdown-head">
        <span>{label}</span>
        <button type="button" className="markdown-toggle" onClick={() => setPreview(!preview)}>
          {preview ? 'Vissza a szerkesztéshez' : 'Előnézet'}
        </button>
      </div>

      {preview ? (
        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={22}
        />
      )}
    </div>
  )
}
