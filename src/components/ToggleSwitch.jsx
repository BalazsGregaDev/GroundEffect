import './ToggleSwitch.css'

export default function ToggleSwitch({ checked, onChange, label, disabled }) {
  return (
    <span className={checked ? 'switch is-on' : 'switch'}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch-knob" />
    </span>
  )
}
