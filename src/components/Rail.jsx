import { Link } from 'react-router-dom'
import { railNav } from '../data/placeholder.js'
import { socialLinks } from '../data/site.js'
import logo from '../assets/logo-kor.jpg'
import './Rail.css'

export default function Rail() {
  return (
    <aside className="rail">
      <Link className="brand" to="/">
        <img className="brand-logo" src={logo} width="48" height="48" alt="" />
        <span>Ground Effect</span>
      </Link>

      <div>
        <h1 className="rail-statement">
          Minden,
          <br />
          ami <em>motorsport.</em>
        </h1>
        <p className="rail-sub">
          Kibeszélők, elemzések és podcastok minden versenyhétvége után.
        </p>
      </div>

      <div>
        <nav>
          <ul>
            {railNav.map((item) => (
              <li key={item.href}>
                <Link to={`/${item.href}`}>
                  {item.label}
                  <span className="nav-meta">{item.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rail-foot">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
