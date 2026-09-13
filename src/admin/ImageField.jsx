import { useRef, useState } from 'react'
import { cloudinaryUrl, uploadImage } from '../lib/cloudinary.js'
import { uploadLabel } from './uploadStage.js'
import './ImageField.css'

export default function ImageField({ label, value, onChange, disabled }) {
  const fileInput = useRef(null)
  const [stage, setStage] = useState(null)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setStage('upload')
    setError(null)

    try {
      onChange(await uploadImage(file, setStage))
    } catch (failure) {
      setError(failure.message)
    }

    setStage(null)
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
            disabled={Boolean(stage)}
          >
            {uploadLabel(stage, 'Kép feltöltése')}
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
