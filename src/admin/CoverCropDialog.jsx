import { useEffect, useRef, useState } from 'react'
import './CoverCropDialog.css'

const ratio = 16 / 9

function parsePosition(value) {
  const [x, y] = String(value)
    .split(' ')
    .map((part) => Number.parseInt(part, 10))

  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: 50, y: 50 }
}

function clamp(value) {
  return Math.min(100, Math.max(0, value))
}

export default function CoverCropDialog({ src, value, onSave, onClose }) {
  const imageRef = useRef(null)
  const [position, setPosition] = useState(() => parsePosition(value))
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    const element = imageRef.current
    const observer = new ResizeObserver(() => {
      setFrame({ width: element.clientWidth, height: element.clientHeight })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const ready = frame.height > 0
  const wide = ready && frame.width / frame.height > ratio
  const cropWidth = wide ? frame.height * ratio : frame.width
  const cropHeight = wide ? frame.height : frame.width / ratio
  const rangeX = frame.width - cropWidth
  const rangeY = frame.height - cropHeight

  function startDrag(event) {
    event.preventDefault()

    const startX = event.clientX
    const startY = event.clientY
    const start = position

    function move(pointer) {
      setPosition({
        x: rangeX > 1 ? clamp(start.x + ((pointer.clientX - startX) / rangeX) * 100) : start.x,
        y: rangeY > 1 ? clamp(start.y + ((pointer.clientY - startY) / rangeY) * 100) : start.y,
      })
    }

    function stop() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  const objectPosition = `${Math.round(position.x)}% ${Math.round(position.y)}%`

  return (
    <div className="crop-backdrop" onClick={onClose}>
      <div className="crop-panel" onClick={(event) => event.stopPropagation()}>
        <h2>Borítókép kivágása</h2>
        <p className="crop-hint">
          Húzd a világos négyzetet arra a részre, aminek a 16:9-es borítón látszania kell.
        </p>

        {broken && (
          <p className="admin-error">Ez a kép nem tölthető be, ellenőrizd a borítókép URL-t.</p>
        )}

        <div className="crop-stage">
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable="false"
            onError={() => setBroken(true)}
          />

          {ready && (
            <div
              className="crop-window"
              style={{
                width: `${cropWidth}px`,
                height: `${cropHeight}px`,
                left: `${rangeX * (position.x / 100)}px`,
                top: `${rangeY * (position.y / 100)}px`,
              }}
              onPointerDown={startDrag}
            />
          )}
        </div>

        <div className="crop-result">
          <span className="crop-hint">Így fog megjelenni a cikk tetején:</span>
          <img src={src} style={{ objectPosition }} alt="" />
        </div>

        <div className="crop-actions">
          <button type="button" className="admin-button" onClick={() => onSave(objectPosition)}>
            Mentés
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={onClose}
          >
            Mégsem
          </button>
        </div>
      </div>
    </div>
  )
}
