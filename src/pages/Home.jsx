import LatestVideo from '../components/LatestVideo.jsx'
import FeaturedArticle from '../components/FeaturedArticle.jsx'
import VideoGrid from '../components/VideoGrid.jsx'
import ArticleBoard from '../components/ArticleBoard.jsx'
import PollSection from '../components/PollSection.jsx'
import FacebookPosts from '../components/FacebookPosts.jsx'
import NextRacePanel from '../components/NextRacePanel.jsx'
import JoinPanel from '../components/JoinPanel.jsx'
import { useVideos } from '../hooks/useVideos.js'
import { joinLinks } from '../data/placeholder.js'
import './Home.css'

const gridSize = 8

export default function Home() {
  const { latest, grid, loading } = useVideos(gridSize)

  return (
    <>
      <LatestVideo video={latest} loading={loading} />
      <FeaturedArticle />
      <VideoGrid videos={grid} />
      <ArticleBoard />
      <PollSection />

      <div className="bottom">
        <FacebookPosts />
        <div className="panels">
          <NextRacePanel />
          <JoinPanel links={joinLinks} />
        </div>
      </div>
    </>
  )
}
