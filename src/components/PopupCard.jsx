import './SitePopup.css'

export default function PopupCard({ popup, onClose, shown = true }) {
  const external = popup.link?.startsWith('http')

  return (
    <div
      className={shown ? 'popup-box is-shown' : 'popup-box'}
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={popup.title1 || 'Üzenet'}
    >
      {onClose && (
        <button type="button" className="popup-x" onClick={onClose} aria-label="Bezárás">
          ×
        </button>
      )}

      <span className="popup-corner popup-corner--tl" />
      <span className="popup-corner popup-corner--tr" />
      <span className="popup-corner popup-corner--bl" />
      <span className="popup-corner popup-corner--br" />

      {popup.eyebrow && <p className="popup-eyebrow">{popup.eyebrow}</p>}

      {(popup.title1 || popup.title2) && (
        <h2 className="popup-title">
          {popup.title1}
          {popup.title2 && <span className="popup-title-accent"> {popup.title2}</span>}
        </h2>
      )}

      {popup.body && <p className="popup-body">{popup.body}</p>}

      {popup.button &&
        (popup.link ? (
          <a
            className="popup-cta"
            href={popup.link}
            onClick={onClose}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {popup.button}
          </a>
        ) : (
          <button type="button" className="popup-cta" onClick={onClose}>
            {popup.button}
          </button>
        ))}
    </div>
  )
}
