import LatestVideo from '../components/LatestVideo.jsx'
import FeaturedArticle from '../components/FeaturedArticle.jsx'
import VideoGrid from '../components/VideoGrid.jsx'
import ArticleBoard from '../components/ArticleBoard.jsx'
import FacebookEmbed from '../components/FacebookEmbed.jsx'
import PollPanel from '../components/PollPanel.jsx'
import NextRacePanel from '../components/NextRacePanel.jsx'
import JoinPanel from '../components/JoinPanel.jsx'
import {
  latestVideo,
  previousVideos,
  poll,
  nextRace,
  joinLinks,
} from '../data/placeholder.js'
import './Home.css'

export default function Home() {
  return (
    <>
      <LatestVideo video={latestVideo} />
      <FeaturedArticle />
      <VideoGrid videos={previousVideos} />
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
