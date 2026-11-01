import { OptionName, Score, ShareBar } from './PollParts.jsx'
import { rankedOptions } from '../lib/poll.js'

export default function PollSummary({ questions, view, closed, myVotes }) {
  return (
    <div className="poll-summary">
      {questions.map((question, index) => {
        const options = rankedOptions(question, question.poll_options, closed)

        return (
          <section className="poll-summary-question" key={question.id}>
            <h3>{question.title || `${index + 1}. kérdés`}</h3>

            {options.length === 0 ? (
              <p className="poll-empty">Ehhez a kérdéshez még nincs opció.</p>
            ) : (
              <ul className="poll-summary-list">
                {options.map((option) => (
                  <li
                    key={option.id}
                    className={
                      myVotes[option.id] === 'up' ? 'poll-summary-row is-mine' : 'poll-summary-row'
                    }
                  >
                    <OptionName option={option} />

                    {question.has_votes && (
                      <>
                        <ShareBar question={question} options={options} option={option} />
                        <Score question={question} option={option} options={options} view={view} />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
