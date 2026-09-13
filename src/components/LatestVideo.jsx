import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import PlayIcon from './PlayIcon.jsx'
import { youtubeChannel } from '../data/site.js'
import { formatCount, relativeTime } from '../lib/format.js'
import './LatestVideo.css'

export default function LatestVideo({ video }) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="latest" id="videok">
      <SectionTitle linkLabel="YouTube csatorna" linkHref={youtubeChannel}>
        Legfrissebb adás
      </SectionTitle>

      <div className="latest-inner">
        {playing ? (
          <div className="player">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button
            className="player"
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${video.title} lejátszása`}
          >
            <span className="play-btn">
              <PlayIcon />
            </span>
            <span className="dur">{video.duration}</span>
          </button>
        )}

        <div className="latest-meta">
          <h3>{video.title}</h3>
          <p>
            {formatCount(video.views)} megtekintés · {relativeTime(video.publishedAt)}
          </p>
        </div>
      </div>
    </section>
  )
}
