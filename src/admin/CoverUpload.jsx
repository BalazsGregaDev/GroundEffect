import { useRef, useState } from 'react'
import { uploadImage } from '../lib/cloudinary.js'
import { uploadLabel } from './uploadStage.js'

export default function CoverUpload({ value, onChange, disabled, idle }) {
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
    <div className="cover-upload">
      <button
        type="button"
        className="admin-button admin-button--ghost"
        onClick={() => fileInput.current.click()}
        disabled={disabled || Boolean(stage)}
      >
        {uploadLabel(stage, value ? 'Csere' : (idle ?? 'Kép feltöltése'))}
      </button>

      {value && !disabled && (
        <button type="button" className="cover-clear" onClick={() => onChange(null)}>
          Eltávolítás
        </button>
      )}

      <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} hidden />

      {error && <p className="admin-error">Képfeltöltés: {error}</p>}
    </div>
  )
}
