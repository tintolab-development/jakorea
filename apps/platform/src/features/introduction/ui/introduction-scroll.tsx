import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import {
  getNextIntroductionScrollY,
  resolveIntroductionScrollState,
  resolveWorldwideRevealProgress,
  type IntroductionScrollState,
} from '../lib/introduction-scroll-phase'
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
export function IntroductionScroll() {
  const trackRef = useRef<HTMLElement>(null)
  const valueContentRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isPcUp = useMediaQuery('(min-width: 1080px)')
  const [mediaReady, setMediaReady] = useState(false)
  const [scrollState, setScrollState] = useState<IntroductionScrollState>(INITIAL_STATE)
  const scrollStateRef = useRef<IntroductionScrollState>(INITIAL_STATE)
  const [worldwideRevealPx, setWorldwideRevealPx] = useState(0)

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
      setWorldwideRevealPx(0)
      return
    }

    scrollStateRef.current = INITIAL_STATE
    setScrollState(INITIAL_STATE)
    setWorldwideRevealPx(0)

    const track = trackRef.current
    if (!track) return

    let frameId = 0

    const syncState = () => {
      frameId = 0
      const scrollRange = Math.max(1, track.offsetHeight - window.innerHeight)
      const scrollPx = Math.max(0, window.scrollY)
      const next = resolveIntroductionScrollState(scrollPx, scrollRange)
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
      const content = valueContentRef.current
      const viewport = content?.parentElement
      const maxReveal = Math.max(
        0,
        (content?.offsetHeight ?? 0) - (viewport?.clientHeight ?? 0),
      )
      setWorldwideRevealPx(Math.round(maxReveal * revealProgress))
    }

    const handleScroll = () => {
      if (frameId !== 0) return
      frameId = window.requestAnimationFrame(syncState)
    }

    syncState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (frameId !== 0) window.cancelAnimationFrame(frameId)
    }
  }, [isDesktopMotion])

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
            <HeroStage activePhase={activePhase} isDesktopMotion={false} />
          </div>
        </section>
        <section className={styles.valueStage} aria-label="JA Global Value">
          <GlobalValuePanel isDesktopMotion={false} withWorldwide />
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
              <div
                ref={valueContentRef}
                className={styles.valueContent}
                style={{
                  transform: `translate3d(0, -${worldwideRevealPx}px, 0)`,
                }}
              >
                <GlobalValuePanel
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
