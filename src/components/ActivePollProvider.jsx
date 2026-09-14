import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ActivePollContext } from '../hooks/activePollContext.js'

const columns = `
  id, title, status, active, starts_at, closes_at, warn_before_min, test_mode, default_view,
  poll_questions (
    id, title, columns, has_votes, vote_style, allow_suggestions, live_sort, sort_order,
    poll_options (id, cells, up_votes, down_votes, approved, sort_order)
  )
`

function shape(poll) {
  return {
    ...poll,
    poll_questions: [...poll.poll_questions]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((question) => ({
        ...question,
        poll_options: question.poll_options
          .filter((option) => option.approved)
          .sort((left, right) => left.sort_order - right.sort_order),
      })),
  }
}

function applyVotes(current, updated) {
  if (!current) {
    return current
  }

  return {
    ...current,
    poll_questions: current.poll_questions.map((question) => ({
      ...question,
      poll_options: question.poll_options.map((option) =>
        option.id === updated.id
          ? { ...option, up_votes: updated.up_votes, down_votes: updated.down_votes }
          : option,
      ),
    })),
  }
}

export default function ActivePollProvider({ children }) {
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('polls').select(columns).eq('active', true).maybeSingle()

    setPoll(data ? shape(data) : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pollId = poll?.id

  useEffect(() => {
    if (!pollId) {
      return
    }

    const channel = supabase
      .channel(`poll-${pollId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'poll_options' }, (payload) =>
        setPoll((current) => applyVotes(current, payload.new)),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_options' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pollId, load])

  const value = useMemo(() => ({ poll, loading, reload: load }), [poll, loading, load])

  return <ActivePollContext.Provider value={value}>{children}</ActivePollContext.Provider>
}
