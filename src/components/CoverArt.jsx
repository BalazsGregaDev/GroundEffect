import {
  coverHeight,
  coverText,
  coverWidth,
  stripePoints,
} from '../lib/seriesCover.js'
import './CoverArt.css'

export default function CoverArt({ name, tone, design, className }) {
  const { rows, size } = coverText(name, design)
  const leading = size * 1.1
  const middle = (coverHeight - design.ruleHeight) / 2
  const top = middle - ((rows.length - 1) * leading) / 2 + size * 0.35

  return (
    <svg
      className={className ? `cover-art ${className}` : 'cover-art'}
      viewBox={`0 0 ${coverWidth} ${coverHeight}`}
      style={{
        '--tone': tone,
        '--tint': `${design.tint}%`,
        '--stripe-opacity': design.stripeOpacity / 100,
      }}
      aria-hidden="true"
    >
      <g className="cover-art-stripes">
        {stripePoints(design).map((points) => (
          <polygon key={points} points={points} />
        ))}
      </g>

      <rect
        className="cover-art-rule"
        x="0"
        y={coverHeight - design.ruleHeight}
        width={coverWidth}
        height={design.ruleHeight}
      />

      <text className="cover-art-name" fontSize={size.toFixed(1)}>
        {rows.map((row, index) => (
          <tspan key={index} x={design.textInset} y={(top + index * leading).toFixed(1)}>
            {row}
          </tspan>
        ))}
      </text>
    </svg>
  )
}
