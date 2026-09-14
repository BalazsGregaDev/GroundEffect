import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

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

export function useActivePoll() {
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

  useEffect(() => {
    if (!poll) {
      return
    }

    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'poll_options' },
        (payload) =>
          setPoll((current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              poll_questions: current.poll_questions.map((question) => ({
                ...question,
                poll_options: question.poll_options.map((option) =>
                  option.id === payload.new.id
                    ? { ...option, up_votes: payload.new.up_votes, down_votes: payload.new.down_votes }
                    : option,
                ),
              })),
            }
          }),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_options' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [poll?.id, load])

  return { poll, loading, reload: load }
}
