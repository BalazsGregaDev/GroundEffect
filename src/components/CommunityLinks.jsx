import SectionTitle from './SectionTitle.jsx'
import { communityLinks } from '../data/site.js'
import './CommunityLinks.css'

export default function CommunityLinks() {
  return (
    <section className="community" id="kozosseg">
      <SectionTitle>Csatlakozz</SectionTitle>

      <div className="community-grid">
        {communityLinks.map((link) => (
          <a
            className="ccard"
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            <span className="ccard-label">{link.label}</span>
            <span className="ccard-note">{link.note}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
