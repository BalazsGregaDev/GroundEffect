import { socialLinks } from '../data/site.js'
import logo from '../assets/logo-arany.webp'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <img className="foot-logo" src={logo} width="132" height="132" alt="Ground Effect" />
        <p>Ground Effect · rajongóktól rajongóknak</p>
        <ul>
          {socialLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
