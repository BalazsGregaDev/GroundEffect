import Panel from './Panel.jsx'
import './JoinPanel.css'

export default function JoinPanel({ links }) {
  return (
    <Panel title="Csatlakozz">
      <ul className="links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>
              {link.label}
              <span>{link.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
