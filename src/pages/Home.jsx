import LatestVideo from '../components/LatestVideo.jsx'
import FeaturedArticle from '../components/FeaturedArticle.jsx'
import VideoGrid from '../components/VideoGrid.jsx'
import RaceCalendarSection from '../components/RaceCalendarSection.jsx'
import ArticleBoard from '../components/ArticleBoard.jsx'
import PollSection from '../components/PollSection.jsx'
import MerchGrid from '../components/MerchGrid.jsx'
import FacebookPosts from '../components/FacebookPosts.jsx'
import CommunityLinks from '../components/CommunityLinks.jsx'
import DiscountCodes from '../components/DiscountCodes.jsx'
import { useVideos } from '../hooks/useVideos.js'

const gridSize = 8

export default function Home() {
  const { latest, grid, loading } = useVideos(gridSize)

  return (
    <>
      <LatestVideo video={latest} loading={loading} />
      <FeaturedArticle />
      <VideoGrid videos={grid} />
      <RaceCalendarSection />
      <ArticleBoard />
      <PollSection />
      <MerchGrid />
      <FacebookPosts />
      <CommunityLinks />
      <DiscountCodes />
    </>
  )
}
