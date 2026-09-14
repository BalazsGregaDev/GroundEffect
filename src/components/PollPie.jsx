export const pieColors = [
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
  '#3987e5',
  '#d95926',
  '#199e70',
]

export const maxSlices = pieColors.length

export function sliceColor(index) {
  return pieColors[Math.min(index, maxSlices - 1)]
}

function arcPath(cx, cy, r, from, to) {
  if (to - from >= Math.PI * 2 - 0.0001) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
  }

  const x0 = cx + r * Math.cos(from)
  const y0 = cy + r * Math.sin(from)
  const x1 = cx + r * Math.cos(to)
  const y1 = cy + r * Math.sin(to)
  const large = to - from > Math.PI ? 1 : 0

  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}

export default function PollPie({ slices, view, size = 300 }) {
  const data = slices.filter((slice) => slice.value > 0)
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  if (total === 0) {
    return <p className="poll-empty">Még nincs szavazat.</p>
  }

  const radius = size / 2
  const labelSize = Math.round(size / 15)
  const pad = labelSize * 5 + 10
  let angle = -Math.PI / 2

  const arcs = data.map((slice) => {
    const fraction = slice.value / total
    const from = angle
    const to = angle + fraction * Math.PI * 2
    angle = to

    const mid = (from + to) / 2
    const labelRadius = radius + labelSize * 0.9

    return {
      key: slice.key,
      path: arcPath(radius, radius, radius, from, to),
      color: slice.color,
      label: slice.label,
      value: slice.value,
      text: view === 'percent' ? `${(fraction * 100).toFixed(1)}%` : String(slice.value),
      x: radius + labelRadius * Math.cos(mid),
      y: radius + labelRadius * Math.sin(mid),
      anchor: Math.cos(mid) >= 0 ? 'start' : 'end',
    }
  })

  return (
    <svg
      className="poll-pie"
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      width={size + pad * 2}
      height={size + pad * 2}
      role="img"
      aria-label="A szavazatok megoszlása"
    >
      {arcs.map((arc) => (
        <path key={arc.key} d={arc.path} fill={arc.color} stroke="var(--black)" strokeWidth="2">
          <title>{`${arc.label}: ${arc.value}`}</title>
        </path>
      ))}

      {arcs.map((arc) => (
        <text
          key={`label-${arc.key}`}
          className="poll-pie-label"
          fontSize={labelSize}
          x={arc.x.toFixed(1)}
          y={arc.y.toFixed(1)}
          textAnchor={arc.anchor}
          dominantBaseline="middle"
        >
          {arc.text}
        </text>
      ))}
    </svg>
  )
}
