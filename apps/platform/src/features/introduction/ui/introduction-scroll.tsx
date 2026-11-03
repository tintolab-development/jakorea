import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import {
  getNextIntroductionScrollY,
  resolveIntroductionScrollState,
  resolveWorldwideRevealProgress,
  type IntroductionScrollState,
} from '../lib/introduction-scroll-phase'
import type { IntroductionPageContent } from '../model/types'
import { GlobalValuePanel } from './global-value-section'
import { HeroStage } from './hero-section'
import heroStyles from './hero-section.module.css'
import styles from './introduction-scroll.module.css'

const INITIAL_STATE: IntroductionScrollState = {
  heroPhase: 'intro',
  isFramePushed: false,
  activeValueIndex: 0,
}

/**
 * 기관소개 Desktop sticky 모션 오케스트레이터.
 * Frame Track: [Hero/Mission] + [JA Global Value panel(list + Worldwide 형제)].
 * Accordion 후 hold 구간에서 panel을 translateY 해 Worldwide를 연속 노출.
 * Mobile·reduced-motion 은 정적 스택 (.list 다음 Worldwide).
 */
export function IntroductionScroll({ view }: { view: IntroductionPageContent }) {
  const trackRef = useRef<HTMLElement>(null)
  const valueContentRef = useRef<HTMLDivElement>(null)
  const lastRevealPxRef = useRef(0)
  const scrollRangeRef = useRef(1)
  const maxRevealRef = useRef(0)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isPcUp = useMediaQuery('(min-width: 1080px)')
  const [mediaReady, setMediaReady] = useState(false)
  const [scrollState, setScrollState] = useState<IntroductionScrollState>(INITIAL_STATE)
  const scrollStateRef = useRef<IntroductionScrollState>(INITIAL_STATE)
  const valueCount = Math.max(1, view.globalValues.length)

  useEffect(() => {
    setMediaReady(true)
  }, [])

  const isDesktopMotion = mediaReady && isPcUp && !prefersReducedMotion

  const activePhase = isDesktopMotion
    ? scrollState.heroPhase
    : mediaReady && (!isPcUp || prefersReducedMotion)
      ? 'message'
      : 'intro'

  const isFramePushed = isDesktopMotion && scrollState.isFramePushed
  const activeValueIndex = isDesktopMotion ? scrollState.activeValueIndex : 0

  useEffect(() => {
    if (!isDesktopMotion) {
      scrollStateRef.current = INITIAL_STATE
      setScrollState(INITIAL_STATE)
      lastRevealPxRef.current = 0
      maxRevealRef.current = 0
      const content = valueContentRef.current
      if (content) content.style.transform = 'translate3d(0, 0, 0)'
      return
    }

    scrollStateRef.current = INITIAL_STATE
    setScrollState(INITIAL_STATE)
    lastRevealPxRef.current = 0

    const track = trackRef.current
    if (!track) return

    let frameId = 0

    const measureMetrics = () => {
      scrollRangeRef.current = Math.max(1, track.offsetHeight - window.innerHeight)
      const content = valueContentRef.current
      const viewport = content?.parentElement
      maxRevealRef.current = Math.max(
        0,
        (content?.offsetHeight ?? 0) - (viewport?.clientHeight ?? 0),
      )
    }

    const applyWorldwideReveal = (revealPx: number) => {
      const content = valueContentRef.current
      if (!content) return
      if (revealPx === lastRevealPxRef.current) return
      lastRevealPxRef.current = revealPx
      content.style.transform = `translate3d(0, -${revealPx}px, 0)`
    }

    const syncState = () => {
      frameId = 0
      const scrollRange = scrollRangeRef.current
      const scrollPx = Math.max(0, window.scrollY)
      const next = resolveIntroductionScrollState(scrollPx, scrollRange, valueCount)
      const prev = scrollStateRef.current
      if (
        next.heroPhase !== prev.heroPhase ||
        next.isFramePushed !== prev.isFramePushed ||
        next.activeValueIndex !== prev.activeValueIndex
      ) {
        scrollStateRef.current = next
        setScrollState(next)
      }

      const revealProgress = resolveWorldwideRevealProgress(scrollPx, scrollRange)
      if (revealProgress > 0 && maxRevealRef.current === 0) measureMetrics()
      applyWorldwideReveal(Math.round(maxRevealRef.current * revealProgress))
    }

    const handleScroll = () => {
      if (frameId !== 0) return
      frameId = window.requestAnimationFrame(syncState)
    }

    const handleResize = () => {
      measureMetrics()
      handleScroll()
    }

    measureMetrics()
    syncState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    const content = valueContentRef.current
    const viewport = content?.parentElement
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            measureMetrics()
          })
    if (content) resizeObserver?.observe(content)
    if (viewport) resizeObserver?.observe(viewport)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
      if (frameId !== 0) window.cancelAnimationFrame(frameId)
    }
  }, [isDesktopMotion, valueCount])

  const showMessage = activePhase !== 'intro'
  const showSplit =
    activePhase === 'inspiring' ||
    activePhase === 'vision' ||
    activePhase === 'mission' ||
    activePhase === 'exit'
  const showVisionStack =
    activePhase === 'vision' || activePhase === 'mission' || activePhase === 'exit'
  const showArrow = isDesktopMotion && (activePhase === 'intro' || activePhase === 'message')

  const handleScrollArrowClick = () => {
    const track = trackRef.current
    if (!track) return
    const scrollRange = Math.max(1, track.offsetHeight - window.innerHeight)
    const top = getNextIntroductionScrollY(
      {
        heroPhase: activePhase,
        isFramePushed,
        activeValueIndex,
      },
      scrollRange,
      valueCount,
    )
    if (top == null) return
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  /** HeroStage 자손 셀렉터용 phase 클래스 (hero-section.module.css) */
  const heroPhaseClassName = [
    showMessage ? heroStyles.isRevealed : undefined,
    showSplit ? heroStyles.isSplit : undefined,
    activePhase === 'inspiring' ? heroStyles.phaseInspiring : undefined,
    showVisionStack ? heroStyles.isVisionStack : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  /* —— Mobile / reduced-motion: 정적 스택 (media 확정 후에만) —— */
  if (mediaReady && !isDesktopMotion) {
    return (
      <div className={styles.stack}>
        <section
          className={[styles.stage, heroPhaseClassName].filter(Boolean).join(' ')}
          aria-label="기관소개 소개"
        >
          <div className={styles.stageBody}>
            <HeroStage
              hero={view.hero}
              activePhase={activePhase}
              isDesktopMotion={false}
            />
          </div>
        </section>
        <section className={styles.valueStage} aria-label="JA Global Value">
          <GlobalValuePanel
            items={view.globalValues}
            worldwide={view.worldwide}
            isDesktopMotion={false}
            withWorldwide
          />
        </section>
      </div>
    )
  }

  const rootClassName = [
    styles.root,
    styles.isMotionTrack,
    isFramePushed ? styles.isFramePushed : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={trackRef} className={rootClassName} aria-label="기관소개">
      <div className={styles.sticky}>
        <div className={styles.frameTrack}>
          <div
            className={[styles.frame, styles.frameHero, heroPhaseClassName]
              .filter(Boolean)
              .join(' ')}
          >
            <HeroStage
              hero={view.hero}
              activePhase={activePhase}
              isDesktopMotion={isDesktopMotion}
              showArrow={showArrow}
              onScrollArrowClick={handleScrollArrowClick}
            />
          </div>
          {isDesktopMotion ? (
            <div
              className={[styles.frame, styles.frameValue].join(' ')}
              aria-hidden={!isFramePushed || undefined}
            >
              {/*
                list + Worldwide 동일 panel 형제 (그라데이션 연속).
                accordion 이후 hold 스크롤로 valueContent translateY → Worldwide 노출.
              */}
              <div ref={valueContentRef} className={styles.valueContent}>
                <GlobalValuePanel
                  items={view.globalValues}
                  worldwide={view.worldwide}
                  activeValueIndex={activeValueIndex}
                  isDesktopMotion
                  withWorldwide
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
