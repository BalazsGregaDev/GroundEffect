import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import PollStats from './PollStats.jsx'
import { relativeTime } from '../lib/format.js'
import { isClosed } from '../lib/poll.js'
import './PollList.css'

function normalizeCells(cells, columns) {
  return columns.map((_, index) => ({ value: cells[index]?.value ?? '' }))
}

export default function PollList() {
  const { canEdit } = useAuth()
  const [polls, setPolls] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const list = await supabase
      .from('polls')
      .select('id, title, status, active, closes_at, updated_at, poll_questions (id)')
      .order('created_at', { ascending: false })

    const waiting = await supabase
      .from('poll_options')
      .select('id, cells, question_id, poll_questions (title, columns, polls (title))')
      .eq('approved', false)
      .order('created_at', { ascending: true })

    setPolls(list.data ?? [])
    setPending(
      (waiting.data ?? []).map((row) => {
        const columns = row.poll_questions.columns.length
          ? row.poll_questions.columns
          : [{ name: '' }]

        return {
          id: row.id,
          questionTitle: row.poll_questions.title || '(kérdés cím nélkül)',
          pollTitle: row.poll_questions.polls.title || '(cím nélkül)',
          columns,
          cells: normalizeCells(row.cells, columns),
        }
      }),
    )
    setError(list.error ?? waiting.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function editCell(id, index, value) {
    setPending((rows) =>
      rows.map((row) =>
        row.id === id
          ? { ...row, cells: row.cells.map((cell, p) => (p === index ? { value } : cell)) }
          : row,
      ),
    )
  }

  async function approve(row) {
    await supabase
      .from('poll_options')
      .update({ cells: row.cells, approved: true })
      .eq('id', row.id)

    await load()
  }

  async function reject(row) {
    await supabase.from('poll_options').delete().eq('id', row.id)
    await load()
  }

  return (
    <div>
      <div className="list-head">
        <h1>Szavazás</h1>
        {canEdit && (
          <Link to="/admin/szavazas/uj" className="admin-button">
            Új szavazás
          </Link>
        )}
      </div>

      {error && <p className="admin-error">Nem sikerült betölteni: {error.message}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && polls.length === 0 && <p className="list-empty">Még nincs szavazás.</p>}

      {polls.length > 0 && (
        <table className="list-table">
          <thead>
            <tr>
              <th>Cím</th>
              <th>Kérdés</th>
              <th>Állapot</th>
              <th>Lezárás</th>
              <th>Módosítva</th>
            </tr>
          </thead>
          <tbody>
            {polls.map((poll) => (
              <tr key={poll.id}>
                <td>
                  <Link to={`/admin/szavazas/${poll.id}`}>{poll.title || '(cím nélkül)'}</Link>
                  {poll.active && <span className="list-featured">főoldalon</span>}
                </td>
                <td className="list-number">{poll.poll_questions.length}</td>
                <td>
                  <span
                    className={
                      isClosed(poll, Date.now())
                        ? 'admin-status'
                        : 'admin-status admin-status--published'
                    }
                  >
                    {isClosed(poll, Date.now()) ? 'Lezárult' : 'Nyitott'}
                  </span>
                </td>
                <td className="list-number">
                  {poll.closes_at ? new Date(poll.closes_at).toLocaleString('hu-HU') : '–'}
                </td>
                <td className="list-number">{relativeTime(poll.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pending.length > 0 && (
        <div className="pollmod">
          <h2>Jóváhagyásra váró javaslatok ({pending.length})</h2>

          {pending.map((row) => (
            <div className="pollmod-row" key={row.id}>
              <span className="pollmod-source">
                {row.pollTitle} · {row.questionTitle}
              </span>

              <div className="pollmod-fields">
                {row.columns.map((column, index) => (
                  <input
                    key={index}
                    type="text"
                    value={row.cells[index]?.value ?? ''}
                    onChange={(event) => editCell(row.id, index, event.target.value)}
                    placeholder={column.name || `Oszlop ${index + 1}`}
                    disabled={!canEdit}
                  />
                ))}
              </div>

              {canEdit && (
                <div className="pollmod-actions">
                  <button type="button" className="admin-button" onClick={() => approve(row)}>
                    Jóváhagyás
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--ghost"
                    onClick={() => reject(row)}
                  >
                    Elvetés
                  </button>
                </div>
              )}
            </div>
          ))}

          <p className="editor-hint">Jóváhagyás előtt javíthatod a szöveget.</p>
        </div>
      )}

      <PollStats />
    </div>
  )
}
