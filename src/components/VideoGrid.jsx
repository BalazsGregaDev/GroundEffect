import SectionTitle from './SectionTitle.jsx'
import VideoCards from './VideoCards.jsx'
import { youtubeChannel } from '../data/site.js'
import './VideoGrid.css'

export default function VideoGrid({ videos }) {
  if (videos.length === 0) {
    return null
  }

  return (
    <section className="video-grid-section" id="videok">
      <SectionTitle linkLabel="Összes videó" linkHref={youtubeChannel}>
        Korábbi adások
      </SectionTitle>

      <VideoCards videos={videos} />
    </section>
  )
}
