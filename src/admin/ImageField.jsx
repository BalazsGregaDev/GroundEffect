import { useRef, useState } from 'react'
import { cloudinaryUrl, uploadImage } from '../lib/cloudinary.js'
import './ImageField.css'

export default function ImageField({ label, value, onChange, disabled }) {
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      onChange(await uploadImage(file))
    } catch (failure) {
      setError(failure.message)
    }

    setUploading(false)
    event.target.value = ''
  }

  return (
    <div className="image-field">
      <label className="admin-field">
        <span>{label}</span>
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="https://res.cloudinary.com/..."
        />
      </label>

      {!disabled && (
        <div className="image-actions">
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => fileInput.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Feltöltés…' : 'Kép feltöltése'}
          </button>

          {value && (
            <button type="button" className="image-clear" onClick={() => onChange('')}>
              Eltávolítás
            </button>
          )}

          <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />
        </div>
      )}

      {error && <p className="admin-error">Képfeltöltés: {error}</p>}

      {value && (
        <img
          className="image-preview"
          src={cloudinaryUrl(value, 'f_auto,q_auto,w_600')}
          alt="Borítókép előnézet"
        />
      )}
    </div>
  )
}
