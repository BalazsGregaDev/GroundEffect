import SectionTitle from './SectionTitle.jsx'
import PlayIcon from './PlayIcon.jsx'
import { youtubeChannel } from '../data/site.js'
import { formatCount } from '../lib/format.js'
import './VideoGrid.css'

export default function VideoGrid({ videos }) {
  return (
    <section className="video-grid-section">
      <SectionTitle linkLabel="Összes videó" linkHref={youtubeChannel}>
        Korábbi adások
      </SectionTitle>

      <div className="video-grid">
        {videos.map((video) => (
          <a className="vcard" href={`#${video.id}`} key={video.id}>
            <span className="vthumb">
              <PlayIcon />
              <span className="dur">{video.duration}</span>
            </span>
            <h3>{video.title}</h3>
            <p>{formatCount(video.views)} megtekintés</p>
          </a>
        ))}
      </div>
    </section>
  )
}
