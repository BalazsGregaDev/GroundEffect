import './MenuToggle.css'

export default function MenuToggle({ open, controls, onToggle }) {
  return (
    <button
      type="button"
      className={open ? 'menu-toggle is-open' : 'menu-toggle'}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  )
}
