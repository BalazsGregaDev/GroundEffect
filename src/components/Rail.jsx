import { railNav } from '../data/placeholder.js'
import { socialLinks } from '../data/site.js'
import logo from '../assets/logo-kor.jpg'
import './Rail.css'

export default function Rail() {
  return (
    <aside className="rail">
      <a className="brand" href="/">
        <img className="brand-logo" src={logo} width="48" height="48" alt="" />
        <span>Ground Effect</span>
      </a>

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
                <a href={item.href}>
                  {item.label}
                  <span className="nav-meta">{item.meta}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rail-foot">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
