import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { useHomeMain } from '../api/use-home-main'
import { HOME_HERO_AUTOPLAY_MS, type HomeHeroSlide } from '../lib/home-fallback-content'
import styles from './hero-carousel.module.css'

/** hero-carousel.module.css `.slide` opacity transition과 맞춘다 */
const HERO_FADE_MS = 700

export type HeroCarouselProps = {
  slides?: readonly HomeHeroSlide[]
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

function HeroSlide({
  slide,
  active,
  appear,
}: {
  slide: HomeHeroSlide
  active: boolean
  appear: boolean
}) {
  const [visible, setVisible] = useState(active && !appear)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    if (!appear) {
      setVisible(true)
      return
    }

    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setVisible(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [active, appear])

  return (
    <div
      className={[styles.slide, visible ? styles.slideActive : ''].filter(Boolean).join(' ')}
      style={slide.imageUrl ? undefined : { background: slide.placeholderBackground }}
      aria-hidden={!active}
    >
      {slide.imageUrl ? (
        <img
          className={styles.slideImage}
          src={slide.imageUrl}
          alt=""
          decoding="async"
          fetchPriority={active ? 'high' : 'low'}
        />
      ) : null}
    </div>
  )
}

export function HeroCarousel({ slides: slidesProp, autoplayMs = HOME_HERO_AUTOPLAY_MS }: HeroCarouselProps) {
  const { heroes, source } = useHomeMain()
  const slides = slidesProp ?? heroes
  const prefersReducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const indexRef = useRef(0)

  const total = slides.length
  const shouldAutoplay = isPlaying && !prefersReducedMotion && total > 1
  const imageUrls = slides.map(slide => slide.imageUrl ?? '').join('\n')

  indexRef.current = index

  useEffect(() => {
    const urls = new Set(imageUrls.split('\n').filter(Boolean))
    for (const url of urls) {
      const image = new Image()
      image.decoding = 'async'
      image.src = url
    }
  }, [imageUrls])

  useEffect(() => {
    if (!shouldAutoplay) return

    const timer = window.setInterval(() => {
      if (document.hidden) return
      const current = indexRef.current
      setOutgoingIndex(current)
      setIndex((current + 1) % total)
    }, autoplayMs)

    return () => window.clearInterval(timer)
  }, [shouldAutoplay, autoplayMs, total])

  useEffect(() => {
    if (outgoingIndex == null) return
    const timer = window.setTimeout(() => setOutgoingIndex(null), HERO_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [outgoingIndex])

  if (source === 'pending' && !slidesProp) {
    return (
      <section className={styles.hero} aria-busy="true" aria-label="메인 배너" data-home-hero="">
        <div className={styles.skeleton} />
      </section>
    )
  }

  if (total === 0) {
    return null
  }

  const safeIndex = index % total
  const activeSlide = slides[safeIndex]!
  const titleLines = activeSlide.titleLines
    .flatMap(line => line.split(/\r?\n/))
    .map(line => line.trim())
    .filter(Boolean)
  const paintIndexes = [
    ...new Set(
      [outgoingIndex, safeIndex].filter((value): value is number => value != null && value < total),
    ),
  ]

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="메인 배너"
      data-home-hero=""
    >
      {paintIndexes.map(slideIndex => (
        <HeroSlide
          key={slides[slideIndex]!.id}
          slide={slides[slideIndex]!}
          active={slideIndex === safeIndex}
          appear={outgoingIndex != null && slideIndex === safeIndex}
        />
      ))}

      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{activeSlide.eyebrow}</p>
          <h1 className={styles.title}>
            {titleLines.map((line, lineIndex) => (
              <span className={styles.titleLine} key={`${line}-${lineIndex}`}>
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

          <div className={styles.controlsMeta}>
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
      </div>
    </section>
  )
}
