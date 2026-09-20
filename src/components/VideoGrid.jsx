import { useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import VideoCard from './VideoCard.jsx'
import { youtubeChannel } from '../data/site.js'
import './VideoGrid.css'

export default function VideoGrid({ videos }) {
  const [playing, setPlaying] = useState(null)

  if (videos.length === 0) {
    return null
  }

  return (
    <section className="video-grid-section" id="videok">
      <SectionTitle linkLabel="Összes videó" linkHref={youtubeChannel}>
        Korábbi adások
      </SectionTitle>

      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            playing={playing === video.id}
            onPlay={() => setPlaying(video.id)}
          />
        ))}
      </div>
    </section>
  )
}
