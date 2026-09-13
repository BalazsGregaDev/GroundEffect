import LatestVideo from '../components/LatestVideo.jsx'
import FeaturedArticle from '../components/FeaturedArticle.jsx'
import VideoGrid from '../components/VideoGrid.jsx'
import ArticleBoard from '../components/ArticleBoard.jsx'
import FacebookEmbed from '../components/FacebookEmbed.jsx'
import PollPanel from '../components/PollPanel.jsx'
import NextRacePanel from '../components/NextRacePanel.jsx'
import JoinPanel from '../components/JoinPanel.jsx'
import { useVideos } from '../hooks/useVideos.js'
import { poll, nextRace, joinLinks } from '../data/placeholder.js'
import './Home.css'

const gridSize = 6

export default function Home() {
  const { latest, grid, loading } = useVideos(gridSize)

  return (
    <>
      <LatestVideo video={latest} loading={loading} />
      <FeaturedArticle />
      <VideoGrid videos={grid} />
      <ArticleBoard />

      <div className="bottom">
        <FacebookEmbed />
        <div className="panels">
          <PollPanel poll={poll} />
          <NextRacePanel race={nextRace} />
          <JoinPanel links={joinLinks} />
        </div>
      </div>
    </>
  )
}
