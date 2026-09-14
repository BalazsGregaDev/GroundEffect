import ToggleSwitch from './ToggleSwitch.jsx'
import './ChoiceSwitch.css'

export default function ChoiceSwitch({ value, left, right, onChange, label }) {
  const atRight = value === right.value

  return (
    <div className="choice">
      <span className={atRight ? 'choice-word' : 'choice-word is-active'}>{left.label}</span>
      <ToggleSwitch
        checked={atRight}
        onChange={(next) => onChange(next ? right.value : left.value)}
        label={label}
      />
      <span className={atRight ? 'choice-word is-active' : 'choice-word'}>{right.label}</span>
    </div>
  )
}
