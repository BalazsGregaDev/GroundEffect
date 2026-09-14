import { aspectRatio, orientations, ratios, sizes, sizeWidth } from './figureOptions.js'
import ToggleSwitch from './ToggleSwitch.jsx'
import './FigurePanel.css'

const sample =
  'A rajt utáni első kanyarban dőlt el a futam sorsa, és onnantól már csak a ' +
  'gumistratégia kérdése volt, ki mikor jön ki a bokszba. A mezőny közepén ' +
  'közben külön csata zajlott a pontszerző helyekért.'

function ChoiceRow({ label, options, value, onChange }) {
  return (
    <div className="figure-row">
      <span className="figure-label">{label}</span>
      <div className="figure-choices">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'figure-choice is-active' : 'figure-choice'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FigurePanel({ src, values, onChange, onSubmit, onCancel, submitLabel }) {
  const fullWidth = values.size === 'teljes'
  const wrapping = values.wrap && !fullWidth

  function set(field, value) {
    onChange({ ...values, [field]: value })
  }

  return (
    <div className="figure-panel">
      <div className="figure-preview">
        <span className="figure-label">Előnézet a cikk szövegoszlopában</span>

        <div className="figure-column">
          <figure
            className={wrapping ? 'figure-mock is-wrapped' : 'figure-mock'}
            style={{ width: `${sizeWidth(values.size)}%` }}
          >
            <img
              src={src}
              alt=""
              style={{ aspectRatio: aspectRatio(values.ratio, values.orientation) }}
            />
            {values.caption && <figcaption>{values.caption}</figcaption>}
          </figure>

          <p>{sample}</p>
        </div>
      </div>

      <div className="figure-controls">
        <ChoiceRow
          label="Képarány"
          options={ratios}
          value={values.ratio}
          onChange={(value) => set('ratio', value)}
        />

        <ChoiceRow
          label="Állás"
          options={orientations}
          value={values.orientation}
          onChange={(value) => set('orientation', value)}
        />

        <ChoiceRow
          label="Méret"
          options={sizes}
          value={values.size}
          onChange={(value) => set('size', value)}
        />

        <label className="figure-row">
          <span className="figure-label">Képaláírás</span>
          <input
            type="text"
            value={values.caption}
            onChange={(event) => set('caption', event.target.value)}
            placeholder="Forrás: Ground Effect"
          />
        </label>

        <div className="figure-row">
          <span className="figure-label">Szöveg körbefuttatása</span>
          <ToggleSwitch
            checked={wrapping}
            onChange={(next) => set('wrap', next)}
            label="Szöveg körbefuttatása"
            disabled={fullWidth}
          />
        </div>

        {fullWidth && (
          <p className="figure-hint">Teljes szélességnél nincs mit körbefuttatni.</p>
        )}

        <div className="figure-actions">
          <button type="button" className="admin-button" onClick={onSubmit}>
            {submitLabel}
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={onCancel}
          >
            Mégsem
          </button>
        </div>
      </div>
    </div>
  )
}
