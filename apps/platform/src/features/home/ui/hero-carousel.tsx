import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { PFText } from '@/shared/ui'
import { HOME_HERO_AUTOPLAY_MS, type HomeHeroSlide } from '../lib/mock'
import styles from './hero-carousel.module.css'

export type HeroCarouselProps = {
  slides: readonly HomeHeroSlide[]
  autoplayMs?: number
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 1.8V12.2C3.5 12.98 4.36 13.46 5.02 13.04L13.2 7.84C13.82 7.45 13.82 6.55 13.2 6.16L5.02 0.96C4.36 0.54 3.5 1.02 3.5 1.8Z" fill="currentColor" />
    </svg>
  )
}

export function HeroCarousel({ slides, autoplayMs = HOME_HERO_AUTOPLAY_MS }: HeroCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const total = slides.length
  const shouldAutoplay = isPlaying && !prefersReducedMotion && total > 1

  useEffect(() => {
    if (!shouldAutoplay) return

    const timer = window.setInterval(() => {
      if (document.hidden) return
      setIndex(current => (current + 1) % total)
    }, autoplayMs)

    return () => window.clearInterval(timer)
  }, [shouldAutoplay, autoplayMs, total])

  if (total === 0) {
    return null
  }

  const safeIndex = index % total
  const activeSlide = slides[safeIndex]!

  return (
    <section className={styles.hero} aria-roledescription="carousel" aria-label="메인 배너">
      {slides.map((slide, slideIndex) => (
        <div
          className={[styles.slide, slideIndex === safeIndex ? styles.slideActive : '']
            .filter(Boolean)
            .join(' ')}
          style={
            slide.imageUrl ? undefined : { background: slide.placeholderBackground }
          }
          aria-hidden={slideIndex !== safeIndex}
          key={slide.id}
        >
          {slide.imageUrl ? (
            <img className={styles.slideImage} src={slide.imageUrl} alt="" />
          ) : null}
        </div>
      ))}

      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy} key={activeSlide.id}>
          <PFText as="p" typo="bd-lg-sb" color="white" className={styles.eyebrow}>
            {activeSlide.eyebrow}
          </PFText>
          <h1 className={styles.title}>
            {activeSlide.titleLines.map(line => (
              <span className={styles.titleLine} key={line}>
                {line}
              </span>
            ))}
          </h1>
          <p className={styles.description}>{activeSlide.description}</p>
        </div>

        <div className={styles.controls}>
          <button
            className={styles.playToggle}
            type="button"
            aria-label={isPlaying ? '배너 자동 재생 일시정지' : '배너 자동 재생 시작'}
            aria-pressed={!isPlaying}
            onClick={() => setIsPlaying(playing => !playing)}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <span className={styles.counter} aria-live="polite">
            <span className={styles.counterCurrent}>{safeIndex + 1}</span>
            <span className={styles.counterDivider} aria-hidden="true">
              /
            </span>
            <span className={styles.counterTotal}>{total}</span>
          </span>

          <span className={styles.progressTrack} aria-hidden="true">
            <span
              className={styles.progressFill}
              style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
            />
          </span>
        </div>
      </div>
    </section>
  )
}
