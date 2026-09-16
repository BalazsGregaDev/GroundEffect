function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function net(question, option) {
  return question.voteStyle === 'simple' ? option.up : option.up - option.down
}

function ranked(question) {
  return question.hasVotes
    ? [...question.options].sort((left, right) => net(question, right) - net(question, left))
    : question.options
}

function label(option) {
  return option.cells.map((cell) => cell.value ?? '').filter(Boolean).join(' | ') || '—'
}

function save(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slug(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function fileName(polls, extension) {
  const base = polls.length === 1 ? slug(polls[0].title) : 'szavazasok'

  return `${base || 'szavazas'}.${extension}`
}

export function exportCsv(polls) {
  const blocks = polls.flatMap((poll) =>
    poll.questions.map((question) => {
      const head = [
        ...question.columns.map((column) => column.name ?? ''),
        ...(question.hasVotes ? ['Fel', 'Le', 'Nettó'] : []),
      ]

      const lines = ranked(question).map((option) =>
        [
          ...option.cells.map((cell) => csvCell(cell.value)),
          ...(question.hasVotes
            ? [option.up, option.down, option.up - option.down].map(csvCell)
            : []),
        ].join(','),
      )

      return [
        csvCell(`${poll.title || 'Szavazás'} — ${question.title || 'Kérdés'}`),
        head.map(csvCell).join(','),
        ...lines,
      ].join('\n')
    }),
  )

  save(fileName(polls, 'csv'), blocks.join('\n\n'), 'text/csv;charset=utf-8')
}

export function exportJson(polls) {
  save(fileName(polls, 'json'), JSON.stringify(polls, null, 2), 'application/json')
}

export function exportTxt(polls) {
  const blocks = polls.map((poll) => {
    const lines = [`Szavazás: ${poll.title || '(cím nélkül)'}`]

    poll.questions.forEach((question) => {
      lines.push('', question.title || '(kérdés cím nélkül)')

      ranked(question).forEach((option, index) => {
        const votes = question.hasVotes
          ? question.voteStyle === 'simple'
            ? ` — ${option.up} szavazat`
            : ` — ↑${option.up} / ↓${option.down} (nettó: ${net(question, option) >= 0 ? '+' : ''}${net(question, option)})`
          : ''

        lines.push(`${index + 1}. ${label(option)}${votes}`)
      })
    })

    return lines.join('\n')
  })

  save(fileName(polls, 'txt'), blocks.join('\n\n———\n\n'), 'text/plain;charset=utf-8')
}

const png = {
  scale: 2,
  width: 780,
  pad: 26,
  rowHeight: 30,
  titleHeight: 42,
  questionHeight: 32,
}

export function exportPng(polls) {
  let height = png.pad

  polls.forEach((poll) => {
    height += png.titleHeight

    poll.questions.forEach((question) => {
      height += png.questionHeight + png.rowHeight
      height += Math.max(question.options.length, 1) * png.rowHeight + 14
    })
  })

  const canvas = document.createElement('canvas')
  canvas.width = png.width * png.scale
  canvas.height = height * png.scale

  const ctx = canvas.getContext('2d')
  ctx.scale(png.scale, png.scale)
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, png.width, height)

  let y = png.pad

  polls.forEach((poll) => {
    ctx.fillStyle = '#f0b323'
    ctx.font = "700 22px 'Space Grotesk Variable', sans-serif"
    ctx.fillText(poll.title || '(cím nélkül)', png.pad, y + 24)
    y += png.titleHeight

    poll.questions.forEach((question) => {
      const names = question.columns.map((column) => column.name ?? '')
      const count = names.length + (question.hasVotes ? 1 : 0)
      const columnWidth = (png.width - png.pad * 2) / Math.max(count, 1)

      ctx.fillStyle = '#f2f2f0'
      ctx.font = "700 15px 'Space Grotesk Variable', sans-serif"
      ctx.fillText(question.title || '(kérdés cím nélkül)', png.pad, y + 20)
      y += png.questionHeight

      ctx.fillStyle = '#8a8a8a'
      ctx.font = '700 12px monospace'
      names.forEach((name, index) =>
        ctx.fillText(String(name).slice(0, 20), png.pad + index * columnWidth + 4, y + 20),
      )

      if (question.hasVotes) {
        ctx.fillText(
          question.voteStyle === 'simple' ? '↑' : '↑/↓',
          png.pad + names.length * columnWidth + 4,
          y + 20,
        )
      }

      y += png.rowHeight
      ctx.fillStyle = '#f2f2f0'
      ctx.font = '13px monospace'

      ranked(question).forEach((option) => {
        option.cells.forEach((cell, index) =>
          ctx.fillText(
            String(cell.value ?? '').slice(0, 22),
            png.pad + index * columnWidth + 4,
            y + 20,
          ),
        )

        if (question.hasVotes) {
          ctx.fillText(
            question.voteStyle === 'simple' ? `↑${option.up}` : `↑${option.up} ↓${option.down}`,
            png.pad + names.length * columnWidth + 4,
            y + 20,
          )
        }

        y += png.rowHeight
      })

      y += 14
    })
  })

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName(polls, 'png')
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

export const exporters = [
  { label: 'CSV', run: exportCsv },
  { label: 'JSON', run: exportJson },
  { label: 'TXT', run: exportTxt },
  { label: 'PNG', run: exportPng },
]
