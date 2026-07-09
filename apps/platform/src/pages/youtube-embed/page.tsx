import { useEffect, useMemo, useRef, useState } from 'react'
import { PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'

const DEFAULT_VIDEO_ID = 'ts_hit5wXqg'
const BANNER_IMAGE_SRC =
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=80'

function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) {
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

function getInitialVideoId(): string {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('v') ?? params.get('url') ?? ''
  return extractYouTubeVideoId(fromQuery) ?? DEFAULT_VIDEO_ID
}

function buildEmbedSrc(videoId: string, shouldAutoplay: boolean) {
  const params = new URLSearchParams({
    rel: '0',
    enablejsapi: '1',
  })

  if (shouldAutoplay) {
    params.set('autoplay', '1')
    params.set('mute', '1')
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function YoutubeEmbedPage() {
  const playerRef = useRef<HTMLDivElement>(null)
  const [videoInput, setVideoInput] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('url') ?? params.get('v') ?? DEFAULT_VIDEO_ID
  })
  const [activeVideoId, setActiveVideoId] = useState(getInitialVideoId)
  const [shouldAutoplay, setShouldAutoplay] = useState(false)

  useEffect(() => {
    const playerElement = playerRef.current
    if (!playerElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShouldAutoplay(entry.isIntersecting)
      },
      {
        threshold: 0.55,
        rootMargin: '-8% 0px',
      },
    )

    observer.observe(playerElement)
    return () => observer.disconnect()
  }, [])

  const embedSrc = useMemo(
    () => buildEmbedSrc(activeVideoId, shouldAutoplay),
    [activeVideoId, shouldAutoplay],
  )

  const handleApply = () => {
    const nextId = extractYouTubeVideoId(videoInput)
    if (!nextId) return

    setActiveVideoId(nextId)

    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('v', nextId)
    window.history.replaceState(null, '', nextUrl.toString())
  }

  const isInvalidInput = videoInput.trim().length > 0 && !extractYouTubeVideoId(videoInput)

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <img className={styles.bannerImage} src={BANNER_IMAGE_SRC} alt="" />
        <div className={styles.bannerOverlay}>
          <PFText as="p" typo="hd-lg" color="black">
            JA Korea 소개 배너 (임시)
          </PFText>
        </div>
      </div>

      <section className={styles.content}>
        <div className={styles.header}>
          <PFText as="h1" typo="hd-lg" color="black">
            YouTube 임베드 (임시)
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            아래로 스크롤해 동영상 영역에 도달하면 자동 재생됩니다.
          </PFText>
        </div>

        <div className={styles.scrollSection}>
          <PFText as="h2" typo="hl-sm" color="black">
            스크롤 데모 영역
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            상단 배너를 지나 아래로 내려오면 동영상 플레이어가 화면에 들어올 때 재생이 시작됩니다.
            브라우저 정책상 자동 재생은 음소거 상태로 시작됩니다.
          </PFText>
        </div>

        <div className={styles.controls}>
          <PFTextInput
            size="large"
            label="YouTube URL 또는 영상 ID"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoInput}
            onChange={(event) => setVideoInput(event.target.value)}
            error={isInvalidInput}
          />
          <button type="button" className={styles.applyButton} onClick={handleApply}>
            적용
          </button>
        </div>

        {isInvalidInput ? (
          <PFText as="p" typo="bd-sm-rg" color="error">
            올바른 YouTube URL 또는 11자리 영상 ID를 입력해 주세요.
          </PFText>
        ) : null}

        <div className={styles.player} ref={playerRef}>
          <iframe
            key={`${activeVideoId}-${shouldAutoplay ? 'play' : 'pause'}`}
            className={styles.iframe}
            src={embedSrc}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <PFText as="p" typo="caption-rg" color="neutral-cool-500">
          {shouldAutoplay ? '동영상 영역 진입 · 재생 중' : '동영상 영역 밖 · 대기 중'}
        </PFText>
      </section>
    </div>
  )
}
