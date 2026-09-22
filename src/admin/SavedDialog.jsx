import { useEffect } from 'react'
import './SavedDialog.css'

export default function SavedDialog({ onClose }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="saved-backdrop" onMouseDown={onClose}>
      <div
        className="saved-panel"
        role="alertdialog"
        aria-labelledby="saved-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="saved-title">Sikeres mentés</h2>
        <p>Bezárás után a cikkek listájára lépünk vissza.</p>

        <button type="button" className="admin-button" onClick={onClose} autoFocus>
          Rendben
        </button>
      </div>
    </div>
  )
}
