import './SectionTitle.css'

export default function SectionTitle({ children, linkLabel, linkHref }) {
  return (
    <h2 className="section-title">
      {children}
      {linkLabel && <a href={linkHref}>{linkLabel}</a>}
    </h2>
  )
}
