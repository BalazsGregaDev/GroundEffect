import { Link } from 'react-router-dom'
import './SectionTitle.css'

export default function SectionTitle({ children, linkLabel, linkHref, linkTo, action }) {
  return (
    <h2 className="section-title">
      <span className="section-title-text">{children}</span>
      {linkTo ? (
        <Link to={linkTo}>{linkLabel}</Link>
      ) : (
        linkHref && <a href={linkHref}>{linkLabel}</a>
      )}
      {action}
    </h2>
  )
}
