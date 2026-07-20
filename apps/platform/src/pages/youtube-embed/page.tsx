import { useMemo, useState } from 'react'
import { extractYouTubeVideoId } from '@/shared/lib/youtube'
import { PFText, PFTextInput, ScrollRevealYoutubeVideo } from '@/shared/ui'
import styles from './page.module.css'

const DEFAULT_VIDEO_ID = 'ts_hit5wXqg'
const BANNER_IMAGE_SRC =
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=80'

function getInitialVideoId(): string {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('v') ?? params.get('url') ?? ''
  return extractYouTubeVideoId(fromQuery) ?? DEFAULT_VIDEO_ID
}

function toWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function YoutubeEmbedPage() {
  const [videoInput, setVideoInput] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('url') ?? params.get('v') ?? DEFAULT_VIDEO_ID
  })
  const [activeVideoId, setActiveVideoId] = useState(getInitialVideoId)

  const activeYoutubeUrl = useMemo(() => toWatchUrl(activeVideoId), [activeVideoId])

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
            YouTube 스크롤 리빌 (임시)
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            아래로 스크롤해 동영상 영역에 도달하면 마스크가 열리며 음소거 자동 재생됩니다.
          </PFText>
        </div>

        <div className={styles.scrollSection}>
          <PFText as="h2" typo="hl-sm" color="black">
            스크롤 데모 영역
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            상단 배너를 지나 아래로 내려오면 제목이 먼저 나타나고, 영상 영역이 중앙에서 좌우로
            열리며 재생됩니다.
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
      </section>

      <ScrollRevealYoutubeVideo
        key={activeVideoId}
        youtubeUrl={activeYoutubeUrl}
        title={
          <>
            JA Korea 와 함께
            <br />
            청소년의 가능성을 넓혀 주세요
          </>
        }
        iframeTitle="JA Korea 소개 영상"
        className={styles.revealSection}
      />
    </div>
  )
}
