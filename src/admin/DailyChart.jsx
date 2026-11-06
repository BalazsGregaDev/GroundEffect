import { useEffect, useRef, useState } from 'react'
import './DailyChart.css'

const number = new Intl.NumberFormat('hu-HU')
const pad = { top: 10, right: 8, bottom: 22, left: 34 }

function niceMax(value) {
  if (value <= 4) {
    return 4
  }

  const step = 10 ** Math.floor(Math.log10(value))

  for (const factor of [1, 2, 2.5, 5, 10]) {
    if (factor * step >= value) {
      return factor * step
    }
  }

  return value
}

function shortDay(day) {
  const [, month, date] = day.split('-')
  return `${month}.${date}.`
}

function longDay(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('hu-HU', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function barPath(x, y, width, height) {
  const radius = Math.min(4, width / 2, height)

  if (height <= 0) {
    return ''
  }

  return [
    `M${x},${y + height}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + width - radius}`,
    `Q${x + width},${y} ${x + width},${y + radius}`,
    `V${y + height}`,
    'Z',
  ].join(' ')
}

export default function DailyChart({ rows, series, height = 180, label }) {
  const frame = useRef(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const node = frame.current

    if (!node) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const count = rows.length
  const plotWidth = Math.max(width - pad.left - pad.right, 0)
  const plotHeight = height - pad.top - pad.bottom
  const top = niceMax(Math.max(1, ...rows.flatMap((row) => series.map((item) => row[item.key] ?? 0))))
  const band = count > 0 ? plotWidth / count : 0
  const scaleY = (value) => pad.top + plotHeight - (value / top) * plotHeight
  const centre = (index) => pad.left + band * index + band / 2
  const ticks = [0, top / 2, top]
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(plotWidth / 56))))

  function pick(clientX) {
    const box = frame.current.getBoundingClientRect()
    const index = Math.floor((clientX - box.left - pad.left) / band)

    setActive(index >= 0 && index < count ? index : null)
  }

  function onKey(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      setActive((current) => Math.min(count - 1, Math.max(0, (current ?? (step > 0 ? -1 : count)) + step)))
    }

    if (event.key === 'Escape') {
      setActive(null)
    }
  }

  const tipLeft = active !== null ? Math.min(Math.max(centre(active), 70), width - 70) : 0

  return (
    <div className="daychart">
      {series.length > 1 && (
        <ul className="daychart-legend">
          {series.map((item) => (
            <li key={item.key}>
              <span
                className={item.kind === 'line' ? 'daychart-key is-line' : 'daychart-key'}
                style={{ '--series': item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <div
        className="daychart-frame"
        ref={frame}
        style={{ height }}
        tabIndex={0}
        role="img"
        aria-label={label}
        onPointerDown={(event) => pick(event.clientX)}
        onPointerMove={(event) => pick(event.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((current) => current ?? count - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        {width > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  className="daychart-grid"
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={scaleY(tick)}
                  y2={scaleY(tick)}
                />
                <text className="daychart-axis" x={pad.left - 6} y={scaleY(tick) + 3} textAnchor="end">
                  {number.format(tick)}
                </text>
              </g>
            ))}

            {rows.map((row, index) =>
              index % labelEvery === 0 || index === count - 1 ? (
                <text
                  key={row.day}
                  className="daychart-axis"
                  x={centre(index)}
                  y={height - 6}
                  textAnchor="middle"
                >
                  {shortDay(row.day)}
                </text>
              ) : null,
            )}

            {active !== null && (
              <line
                className="daychart-cross"
                x1={centre(active)}
                x2={centre(active)}
                y1={pad.top}
                y2={pad.top + plotHeight}
              />
            )}

            {series
              .filter((item) => item.kind !== 'line')
              .map((item) => (
                <g key={item.key} fill={item.color}>
                  {rows.map((row, index) => {
                    const value = row[item.key] ?? 0
                    const barWidth = Math.min(Math.max(band - 2, 1), 28)
                    const y = scaleY(value)

                    return (
                      <path
                        key={row.day}
                        d={barPath(centre(index) - barWidth / 2, y, barWidth, pad.top + plotHeight - y)}
                        opacity={active === null || active === index ? 1 : 0.55}
                      />
                    )
                  })}
                </g>
              ))}

            {series
              .filter((item) => item.kind === 'line')
              .map((item) => (
                <g key={item.key}>
                  <polyline
                    className="daychart-line"
                    stroke={item.color}
                    points={rows.map((row, index) => `${centre(index)},${scaleY(row[item.key] ?? 0)}`).join(' ')}
                  />
                  {active !== null && (
                    <circle
                      className="daychart-dot"
                      cx={centre(active)}
                      cy={scaleY(rows[active][item.key] ?? 0)}
                      r="4"
                      fill={item.color}
                    />
                  )}
                </g>
              ))}
          </svg>
        )}

        {active !== null && rows[active] && (
          <div className="daychart-tip" style={{ left: tipLeft }}>
            <span className="daychart-tip-day">{longDay(rows[active].day)}</span>
            {series.map((item) => (
              <span key={item.key} className="daychart-tip-row">
                <span className="daychart-tip-key" style={{ '--series': item.color }} />
                <strong>{number.format(rows[active][item.key] ?? 0)}</strong>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <details className="daychart-table">
        <summary>Táblázatként</summary>
        <table>
          <thead>
            <tr>
              <th>Nap</th>
              {series.map((item) => (
                <th key={item.key}>{item.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((row) => (
              <tr key={row.day}>
                <td>{longDay(row.day)}</td>
                {series.map((item) => (
                  <td key={item.key}>{number.format(row[item.key] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
