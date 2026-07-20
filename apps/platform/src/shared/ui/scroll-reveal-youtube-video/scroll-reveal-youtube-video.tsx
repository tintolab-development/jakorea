import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { buildYouTubeNocookieEmbedSrc, extractYouTubeVideoId } from '@/shared/lib/youtube'
import { PFText } from '@/shared/ui/pf-text'
import styles from './scroll-reveal-youtube-video.module.css'

export type ScrollRevealYoutubeVideoProps = {
  youtubeUrl: string
  title?: ReactNode
  iframeTitle?: string
  animateOnce?: boolean
  className?: string
}

export function ScrollRevealYoutubeVideo({
  youtubeUrl,
  title,
  iframeTitle = 'YouTube video player',
  animateOnce = false,
  className,
}: ScrollRevealYoutubeVideoProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [hasAnimated, setHasAnimated] = useState(false)

  const videoId = useMemo(() => extractYouTubeVideoId(youtubeUrl), [youtubeUrl])
  const embedSrc = useMemo(
    () => (videoId ? buildYouTubeNocookieEmbedSrc(videoId) : null),
    [videoId],
  )

  const isInView = useIntersectionObserver(sectionRef, {
    threshold: 0.35,
    rootMargin: '0px 0px -10% 0px',
    enabled: Boolean(videoId),
  })

  useEffect(() => {
    if (isInView) {
      setHasAnimated(true)
    }
  }, [isInView])

  if (!videoId || !embedSrc) {
    return null
  }

  const isActive = prefersReducedMotion || isInView || (animateOnce && hasAnimated)
  const sectionClassName = [
    styles.section,
    isActive ? styles.isInView : null,
    prefersReducedMotion ? styles.reducedMotion : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={sectionRef} className={sectionClassName} aria-label={iframeTitle}>
      {title ? (
        <PFText as="h2" typo="hd-lg" color="black" className={styles.title}>
          {title}
        </PFText>
      ) : null}

      <div className={styles.mask}>
        <div className={styles.iframeWrap}>
          <iframe
            className={styles.iframe}
            src={embedSrc}
            title={iframeTitle}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
