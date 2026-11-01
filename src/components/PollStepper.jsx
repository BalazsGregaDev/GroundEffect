import VoteArrow from './VoteArrow.jsx'

export default function PollStepper({ index, total, onStep, onFinish }) {
  const last = index === total - 1

  return (
    <div className="poll-stepper">
      {total > 1 && (
        <div className="poll-step-buttons">
          <button
            type="button"
            className="poll-step"
            onClick={() => onStep(index - 1)}
            disabled={index === 0}
          >
            <VoteArrow direction="left" />
            Előző kérdés
          </button>

          <button
            type="button"
            className="poll-step"
            onClick={() => onStep(index + 1)}
            disabled={last}
          >
            Következő kérdés
            <VoteArrow direction="right" />
          </button>
        </div>
      )}

      {last && (
        <button type="button" className="poll-finish" onClick={onFinish}>
          Válaszaim rögzítése
        </button>
      )}
    </div>
  )
}
