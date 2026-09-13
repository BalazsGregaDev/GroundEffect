import { Link } from 'react-router-dom'
import './SectionTitle.css'

export default function SectionTitle({ children, linkLabel, linkHref, linkTo }) {
  return (
    <h2 className="section-title">
      {children}
      {linkTo ? (
        <Link to={linkTo}>{linkLabel}</Link>
      ) : (
        linkHref && <a href={linkHref}>{linkLabel}</a>
      )}
    </h2>
  )
}
