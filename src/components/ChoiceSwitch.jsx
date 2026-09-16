import ToggleSwitch from './ToggleSwitch.jsx'
import './ChoiceSwitch.css'

export default function ChoiceSwitch({ value, left, right, onChange, label }) {
  const atRight = value === right.value

  return (
    <div className="choice">
      <button
        type="button"
        className={atRight ? 'choice-word' : 'choice-word is-active'}
        onClick={() => onChange(left.value)}
      >
        {left.label}
      </button>

      <ToggleSwitch
        checked={atRight}
        onChange={(next) => onChange(next ? right.value : left.value)}
        label={label}
      />

      <button
        type="button"
        className={atRight ? 'choice-word is-active' : 'choice-word'}
        onClick={() => onChange(right.value)}
      >
        {right.label}
      </button>
    </div>
  )
}
