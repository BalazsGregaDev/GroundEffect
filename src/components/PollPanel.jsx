import Panel from './Panel.jsx'
import './PollPanel.css'

export default function PollPanel({ poll }) {
  return (
    <Panel title={poll.question}>
      {poll.options.map((option, index) => (
        <div className="poll-row" key={option.id}>
          <span className="rank">{index + 1}</span>
          <span>{option.label}</span>
          <span className="share">{option.share}%</span>
          <span className="bar">
            <span className="bar-fill" style={{ width: `${option.share}%` }} />
          </span>
        </div>
      ))}
      <small>{poll.note}</small>
    </Panel>
  )
}
