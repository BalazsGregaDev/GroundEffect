import { useState } from 'react'

const messages = {
  ok: 'Köszönjük, a javaslat jóváhagyásra vár.',
  full: 'Egyelőre túl sok javaslat vár jóváhagyásra.',
  error: 'A javaslatot nem sikerült elküldeni.',
  closed: 'A szavazás időközben lezárult.',
}

export default function PollSuggest({ question, names, onSuggest }) {
  const [draft, setDraft] = useState([])
  const [state, setState] = useState('idle')

  async function submit() {
    setState('sending')

    const result = await onSuggest(
      question,
      names.map((_, index) => ({ value: (draft[index] ?? '').trim() })),
    )

    if (result === 'ok') {
      setDraft([])
    }

    setState(result)
  }

  return (
    <div className="poll-suggest">
      <span className="poll-suggest-title">Javasolj új opciót</span>

      <div className="poll-suggest-fields">
        {names.map((name, index) => (
          <input
            key={index}
            type="text"
            value={draft[index] ?? ''}
            onChange={(event) =>
              setDraft((current) => {
                const next = [...current]
                next[index] = event.target.value
                return next
              })
            }
            aria-label={name || `Oszlop ${index + 1}`}
          />
        ))}

        <button
          type="button"
          onClick={submit}
          disabled={state === 'sending' || !draft.some((value) => (value ?? '').trim())}
        >
          {state === 'sending' ? 'Küldés…' : 'Javaslom'}
        </button>
      </div>

      {messages[state] && (
        <p className={state === 'ok' ? 'poll-suggest-msg' : 'poll-suggest-msg is-error'}>
          {messages[state]}
        </p>
      )}
    </div>
  )
}
