import { Fragment } from 'react'
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
import SearchResults from '../components/SearchResults.jsx'
import { useSearch } from '../hooks/useSearch.js'
import { useSiteConfig } from '../lib/siteConfig.js'
import { useVideos } from '../hooks/useVideos.js'
import { keptWhileSearching } from '../data/sections.js'

const gridSize = 8

export default function Home() {
  const { latest, grid, loading } = useVideos(gridSize)
  const { sections } = useSiteConfig()
  const { active, phase } = useSearch()

  const parts = {
    latest: <LatestVideo video={latest} loading={loading} />,
    featured: <FeaturedArticle />,
    videos: <VideoGrid videos={grid} />,
    calendar: <RaceCalendarSection />,
    articles: <ArticleBoard />,
    poll: <PollSection />,
    merch: <MerchGrid />,
    facebook: <FacebookPosts />,
    community: <CommunityLinks />,
    discounts: <DiscountCodes />,
  }

  const shown = sections.filter(
    (section) =>
      section.visible && (phase !== 'hidden' || keptWhileSearching.includes(section.key)),
  )

  return (
    <>
      {active && <SearchResults />}

      {shown.map((section) => (
        <Fragment key={section.key}>{parts[section.key]}</Fragment>
      ))}
    </>
  )
}
