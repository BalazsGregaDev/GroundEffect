export function embedUrl(youtubeId) {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`
}

export function thumbnailUrl(video) {
  return video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`
}

export const playerPermissions = 'accelerometer; autoplay; encrypted-media; picture-in-picture'
