import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import PlayIcon from './PlayIcon.jsx'
import { youtubeChannel } from '../data/site.js'
import { embedUrl, playerPermissions, thumbnailUrl } from '../lib/youtube.js'
import { formatCount, relativeTime } from '../lib/format.js'
import '../styles/skeleton.css'
import './LatestVideo.css'

export default function LatestVideo({ video, loading }) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="latest">
      <SectionTitle linkLabel="YouTube csatorna" linkHref={youtubeChannel}>
        Legfrissebb adás
      </SectionTitle>

      {loading && (
        <div className="latest-inner">
          <div className="player skel" />
          <div className="latest-meta">
            <span className="skel latest-skel-title" />
            <span className="skel latest-skel-meta" />
          </div>
        </div>
      )}

      {!loading && !video && (
        <p className="latest-message">Még nincs szinkronizált videó a csatornáról.</p>
      )}

      {video && (
        <div className="latest-inner">
          {playing ? (
            <div className="player">
              <iframe
                src={embedUrl(video.youtube_id)}
                title={video.title}
                allow={playerPermissions}
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
              <img src={thumbnailUrl(video)} alt="" />
              <span className="play-btn">
                <PlayIcon />
              </span>
              {video.duration && <span className="dur">{video.duration}</span>}
            </button>
          )}

          <div className="latest-meta">
            <h3>{video.title}</h3>
            <p>
              {formatCount(video.views)} megtekintés · {relativeTime(video.published_at)}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
