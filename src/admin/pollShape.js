export const pollColumns = `
  id, title, status, active, starts_at, closes_at, warn_before_min, test_mode, default_view,
  poll_questions (
    id, title, columns, has_votes, vote_style, allow_suggestions, live_sort, sort_order,
    poll_options (id, cells, up_votes, down_votes, approved, suggested, sort_order)
  )
`

export function emptyQuestion() {
  return {
    id: null,
    title: '',
    columns: [{ name: '' }],
    has_votes: true,
    vote_style: 'updown',
    allow_suggestions: false,
    live_sort: true,
    options: [],
  }
}

export function emptyPoll() {
  return {
    id: null,
    title: '',
    status: 'open',
    active: false,
    starts_at: '',
    closes_at: '',
    warn_before_min: 0,
    test_mode: false,
    default_view: 'percent',
    questions: [emptyQuestion()],
  }
}

export function toLocalInput(iso) {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function normalizeCells(cells, columns) {
  return columns.map((_, index) => ({ value: cells[index]?.value ?? '' }))
}

export function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    active: row.active,
    starts_at: toLocalInput(row.starts_at),
    closes_at: toLocalInput(row.closes_at),
    warn_before_min: row.warn_before_min,
    test_mode: row.test_mode,
    default_view: row.default_view,
    questions: [...row.poll_questions]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((question) => {
        const columns = question.columns.length > 0 ? question.columns : [{ name: '' }]

        return {
          id: question.id,
          title: question.title,
          columns,
          has_votes: question.has_votes,
          vote_style: question.vote_style,
          allow_suggestions: question.allow_suggestions,
          live_sort: question.live_sort,
          options: question.poll_options
            .filter((option) => option.approved)
            .sort((left, right) => left.sort_order - right.sort_order)
            .map((option) => ({
              id: option.id,
              cells: normalizeCells(option.cells, columns),
              up_votes: option.up_votes,
              down_votes: option.down_votes,
            })),
        }
      }),
  }
}

export function toExport(poll) {
  return {
    title: poll.title,
    questions: poll.questions.map((question) => ({
      title: question.title,
      columns: question.columns,
      hasVotes: question.has_votes,
      voteStyle: question.vote_style,
      options: question.options.map((option) => ({
        cells: option.cells,
        up: option.up_votes,
        down: option.down_votes,
      })),
    })),
  }
}
