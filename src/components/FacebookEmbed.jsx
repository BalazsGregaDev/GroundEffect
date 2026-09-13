import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import { facebookPage } from '../data/site.js'
import './FacebookEmbed.css'

const pluginSrc =
  'https://www.facebook.com/plugins/page.php' +
  `?href=${encodeURIComponent(facebookPage)}` +
  '&tabs=timeline&width=500&height=500&small_header=false' +
  '&adapt_container_width=true&hide_cover=false&show_facepile=true'

export default function FacebookEmbed() {
  const [loaded, setLoaded] = useState(false)

  return (
    <section className="facebook">
      <SectionTitle>Facebook</SectionTitle>

      <div className="fb-frame">
        {loaded ? (
          <iframe
            src={pluginSrc}
            title="Ground Effect a Facebookon"
            scrolling="no"
            allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="fb-consent">
            <p>
              A Facebook-idővonal megjelenítéséhez a Facebook szervereitől töltünk be
              tartalmat, ami sütiket helyez el a böngésződben.
            </p>
            <button type="button" onClick={() => setLoaded(true)}>
              Idővonal betöltése
            </button>
            <a href={facebookPage} target="_blank" rel="noreferrer">
              Megnyitás a Facebookon
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
