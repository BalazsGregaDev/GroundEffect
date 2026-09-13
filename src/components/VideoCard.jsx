import PlayIcon from './PlayIcon.jsx'
import { embedUrl, playerPermissions, thumbnailUrl } from '../lib/youtube.js'
import { formatCount } from '../lib/format.js'
import './VideoCard.css'

export default function VideoCard({ video, playing, onPlay }) {
  if (playing) {
    return (
      <article className="vcard">
        <span className="vthumb">
          <iframe
            src={embedUrl(video.youtube_id)}
            title={video.title}
            allow={playerPermissions}
            allowFullScreen
          />
        </span>
        <h3>{video.title}</h3>
        <p>{formatCount(video.views)} megtekintés</p>
      </article>
    )
  }

  return (
    <button
      className="vcard"
      type="button"
      onClick={onPlay}
      aria-label={`${video.title} lejátszása`}
    >
      <span className="vthumb">
        <img src={thumbnailUrl(video)} alt="" loading="lazy" />
        <span className="vplay">
          <PlayIcon />
        </span>
        {video.duration && <span className="dur">{video.duration}</span>}
      </span>
      <h3>{video.title}</h3>
      <p>{formatCount(video.views)} megtekintés</p>
    </button>
  )
}
