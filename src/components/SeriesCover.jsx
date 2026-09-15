import CoverArt from './CoverArt.jsx'
import { coverUrl } from '../lib/cloudinary.js'
import { useCoverConfig } from '../lib/coverConfig.js'
import { seriesTone } from '../lib/seriesCover.js'

export default function SeriesCover({ slug, name, className }) {
  const { design, fallbackUrl, series } = useCoverConfig()
  const row = series.get(slug)
  const image = row?.cover_url || fallbackUrl

  if (image) {
    return <img className={className} src={coverUrl(image)} alt="" />
  }

  return (
    <CoverArt
      className={className}
      name={name}
      tone={row?.cover_tone || seriesTone(slug) || design.fallbackTone}
      design={design}
    />
  )
}
