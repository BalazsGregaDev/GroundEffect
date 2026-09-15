import { coverText, inset, seriesTone } from '../lib/seriesCover.js'
import './SeriesCover.css'

export default function SeriesCover({ slug, name, className }) {
  const { rows, size } = coverText(name)
  const leading = size * 1.1
  const top = 84 - ((rows.length - 1) * leading) / 2 + size * 0.35

  return (
    <svg
      className={className ? `series-cover ${className}` : 'series-cover'}
      viewBox="0 0 320 180"
      style={{ '--tone': seriesTone(slug) }}
      aria-hidden="true"
    >
      <g className="series-cover-stripes">
        <polygon points="240,180 284,0 295,0 251,180" />
        <polygon points="265,180 309,0 320,0 276,180" />
        <polygon points="290,180 334,0 345,0 301,180" />
      </g>

      <rect className="series-cover-rule" x="0" y="174" width="320" height="6" />

      <text className="series-cover-name" fontSize={size.toFixed(1)}>
        {rows.map((row, index) => (
          <tspan key={index} x={inset} y={(top + index * leading).toFixed(1)}>
            {row}
          </tspan>
        ))}
      </text>
    </svg>
  )
}
