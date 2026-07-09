const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && YOUTUBE_VIDEO_ID_PATTERN.test(fromQuery)) {
        return fromQuery
      }

      const pathMatch = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/)
      if (pathMatch?.[1]) {
        return pathMatch[1]
      }
    }
  } catch {
    return null
  }

  return null
}

export function buildYouTubeNocookieEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    playsinline: '1',
    rel: '0',
  })

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
