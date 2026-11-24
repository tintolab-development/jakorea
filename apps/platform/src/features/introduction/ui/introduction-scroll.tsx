import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { HERO_PHASE_STEP_DELTA, HERO_PHASE_STEP_MS } from '../lib/hero-copy'
import {
  DEFAULT_WORLDWIDE_STOP_PROGRESS,
  getNextIntroductionScrollY,
  getPreviousIntroductionScrollY,
  getValueStepScrollY,
  isWheelInertia,
  resolveHeroPhaseWheelStep,
  resolveIntroductionScrollState,
  resolveWorldwideRevealProgress,
  resolveWorldwideStopProgress,
  WHEEL_GESTURE_GAP_MS,
  type IntroductionScrollState,
} from '../lib/introduction-scroll-phase'
import type { IntroductionPageContent } from '../model/types'
import { GlobalValuePanel } from './global-value-section'
import { HeroStage } from './hero-section'
import heroStyles from './hero-section.module.css'
import styles from './introduction-scroll.module.css'

/** 스텝 부드러운 스크롤이 목표에 도착하지 못해도 휠 차단을 푸는 상한 */
const STEP_MAX_FLIGHT_MS = 1500

const INITIAL_STATE: IntroductionScrollState = {
  heroPhase: 'idle',
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
  /** 06 다음 정지점: Worldwide 프레임 상단이 화면 맨 위에 오는 hold 진행도 */
  const worldwideStopRef = useRef(DEFAULT_WORLDWIDE_STOP_PROGRESS)
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
      : 'idle'

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
    let wheelAccum = 0
    let stepLockedUntil = 0
    let lastWheelEventAt = 0
    let lastWheelAbsDelta = 0
    /** 진행 중인 스텝의 목표 위치 — 도착 전에는 휠이 기본 스크롤로 새어 부드러운 스크롤을 끊지 않게 막는다 */
    let stepTargetY: number | null = null
    let stepStartedAt = 0
    /** 마지막 스텝을 일으킨 손짓이 아직 이어지는 중인지(간격 WHEEL_GESTURE_GAP_MS 미만) */
    let stepGesture = false

    const startStep = (top: number, now: number) => {
      stepLockedUntil = now + HERO_PHASE_STEP_MS
      stepTargetY = top
      stepStartedAt = now
      stepGesture = true
      wheelAccum = 0
      window.scrollTo({ top, behavior: 'smooth' })
    }

    /** 잠금 시간 안이거나 목표에 아직 도착하지 않음(최대 STEP_MAX_FLIGHT_MS) */
    const isStepInFlight = (now: number) => {
      if (now < stepLockedUntil) return true
      if (stepTargetY == null) return false
      if (Math.abs(window.scrollY - stepTargetY) <= 2 || now - stepStartedAt > STEP_MAX_FLIGHT_MS) {
        stepTargetY = null
        return false
      }
      return true
    }

    const currentHeroState = (): IntroductionScrollState => scrollStateRef.current

    const stepHeroPhase = (direction: 1 | -1) => {
      const now = performance.now()
      if (now < stepLockedUntil) return false
      const state = currentHeroState()
      const top =
        direction > 0
          ? getNextIntroductionScrollY(state, scrollRangeRef.current, valueCount)
          : getPreviousIntroductionScrollY(state, scrollRangeRef.current, valueCount)
      if (top == null) return false
      startStep(top, now)
      return true
    }

    const measureMetrics = () => {
      scrollRangeRef.current = Math.max(1, track.offsetHeight - window.innerHeight)
      const content = valueContentRef.current
      const viewport = content?.parentElement
      maxRevealRef.current = Math.max(
        0,
        (content?.offsetHeight ?? 0) - (viewport?.clientHeight ?? 0),
      )
      measureWorldwideStop()
    }

    /*
     * Worldwide 상단(content 기준) → 정지 진행도. 목록 영역은 항상 100vh라 단계와 무관하게 일정하고,
     * reveal transform은 content 전체에 걸려 상대 위치에 영향이 없다.
     */
    const measureWorldwideStop = () => {
      const content = valueContentRef.current
      const worldwide = content?.querySelector<HTMLElement>('[data-ja-worldwide]')
      const worldwideTop =
        content && worldwide
          ? worldwide.getBoundingClientRect().top - content.getBoundingClientRect().top
          : 0
      worldwideStopRef.current = resolveWorldwideStopProgress(worldwideTop, maxRevealRef.current)
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

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return

      const now = performance.now()
      const gap = now - lastWheelEventAt
      const absDelta = Math.abs(event.deltaY)
      const prevAbsDelta = lastWheelAbsDelta
      lastWheelEventAt = now
      lastWheelAbsDelta = absDelta
      if (gap >= WHEEL_GESTURE_GAP_MS) stepGesture = false
      /*
       * 스텝 이동 중, 그리고 그 스텝을 일으킨 손짓의 관성 꼬리는 막는다.
       * 막지 않으면 06 구간을 지난 뒤(정지점 계산상 '일반 스크롤')의 휠이 기본 스크롤로 새어
       * 부드러운 스크롤을 끊고 지나쳐 Worldwide 상단이 잘린 채 멈춘다.
       */
      if (isStepInFlight(now) || (stepGesture && isWheelInertia(gap, absDelta, prevAbsDelta))) {
        event.preventDefault()
        wheelAccum = 0
        return
      }

      const state = currentHeroState()
      const goingDown = event.deltaY > 0
      /* Mission 이후(Push·accordion·Worldwide 진입)는 정지점 스텝 */
      const isValuePhase =
        getValueStepScrollY(
          Math.max(0, window.scrollY), scrollRangeRef.current, valueCount, goingDown ? 1 : -1, worldwideStopRef.current,
        ) != null
      if (!isValuePhase) {
        if (state.isFramePushed || state.heroPhase === 'exit') return
        if (goingDown && state.heroPhase === 'mission') return
        if (!goingDown && state.heroPhase === 'idle') return
      }

      event.preventDefault()
      if (gap > 220) wheelAccum = 0
      const stepped = resolveHeroPhaseWheelStep(wheelAccum, event.deltaY, HERO_PHASE_STEP_DELTA)
      wheelAccum = stepped.accumulated
      if (stepped.direction === 0) return

      if (isValuePhase) {
        const top = getValueStepScrollY(
          Math.max(0, window.scrollY), scrollRangeRef.current, valueCount, stepped.direction, worldwideStopRef.current,
        )
        if (top == null) return
        startStep(top, now)
        return
      }
      stepHeroPhase(stepped.direction)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.closest('input, textarea, select, [contenteditable="true"]') ||
          target.getAttribute('role') === 'textbox')
      ) {
        return
      }

      const state = currentHeroState()

      const downKeys = new Set(['ArrowDown', 'PageDown', ' '])
      const upKeys = new Set(['ArrowUp', 'PageUp'])
      let direction: 1 | -1 | 0 = 0
      if (downKeys.has(event.key)) direction = 1
      if (upKeys.has(event.key)) direction = -1
      if (direction === 0) return
      /* 스텝 이동 중 키 입력이 기본 스크롤로 새어 부드러운 스크롤을 끊지 않게 */
      if (isStepInFlight(performance.now())) {
        event.preventDefault()
        return
      }
      const valueTop = getValueStepScrollY(
        Math.max(0, window.scrollY), scrollRangeRef.current, valueCount, direction, worldwideStopRef.current,
      )
      if (valueTop != null) {
        const top = valueTop
        event.preventDefault()
        const now = performance.now()
        if (isStepInFlight(now)) return
        startStep(top, now)
        return
      }
      if (state.isFramePushed || state.heroPhase === 'exit') return
      if (direction > 0 && state.heroPhase === 'mission') return
      if (direction < 0 && state.heroPhase === 'idle') return

      if (!stepHeroPhase(direction)) return
      event.preventDefault()
    }

    measureMetrics()
    syncState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

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
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      resizeObserver?.disconnect()
      if (frameId !== 0) window.cancelAnimationFrame(frameId)
    }
  }, [isDesktopMotion, valueCount])

  const showHeadline = activePhase === 'intro'
  const showMessage =
    activePhase === 'message' ||
    activePhase === 'inspiring' ||
    activePhase === 'vision' ||
    activePhase === 'mission' ||
    activePhase === 'exit'
  const showSplit =
    activePhase === 'inspiring' ||
    activePhase === 'vision' ||
    activePhase === 'mission' ||
    activePhase === 'exit'
  const showVisionStack =
    activePhase === 'vision' || activePhase === 'mission' || activePhase === 'exit'
  const showArrow =
    isDesktopMotion &&
    (activePhase === 'idle' || activePhase === 'intro' || activePhase === 'message')

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
    showHeadline ? heroStyles.isHeadline : undefined,
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
