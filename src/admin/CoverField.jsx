import { useRef, useState } from 'react'
import { coverUrl, uploadImage } from '../lib/cloudinary.js'
import { focusPoints } from './figureOptions.js'
import { uploadLabel } from './uploadStage.js'
import './CoverField.css'

export default function CoverField({ value, focus, onChange, onFocusChange, disabled }) {
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
    <div className="cover-field">
      <label className="admin-field">
        <span>Borítókép</span>
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="https://res.cloudinary.com/..."
        />
      </label>

      {!disabled && (
        <div className="cover-actions">
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => fileInput.current.click()}
            disabled={Boolean(stage)}
          >
            {uploadLabel(stage, 'Kép feltöltése')}
          </button>

          {value && (
            <button type="button" className="cover-clear" onClick={() => onChange('')}>
              Eltávolítás
            </button>
          )}

          <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />
        </div>
      )}

      {error && <p className="admin-error">Képfeltöltés: {error}</p>}

      {value && (
        <>
          <img className="cover-preview" src={coverUrl(value, focus)} alt="Borítókép előnézet" />

          <p className="cover-hint">
            A borítókép mindig 16:9-ben, fektetve jelenik meg a cím fölött. Ha bele kell
            vágni, itt állítod be, melyik rész maradjon meg.
          </p>

          <div className="cover-focus">
            {focusPoints.map((point) => (
              <button
                key={point.value}
                type="button"
                className={point.value === focus ? 'cover-choice is-active' : 'cover-choice'}
                onClick={() => onFocusChange(point.value)}
                disabled={disabled}
              >
                {point.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
