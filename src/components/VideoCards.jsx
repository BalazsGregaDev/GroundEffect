import { useState } from 'react'
import VideoCard from './VideoCard.jsx'
import './VideoCards.css'

export default function VideoCards({ videos }) {
  const [playing, setPlaying] = useState(null)

  return (
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
  )
}
