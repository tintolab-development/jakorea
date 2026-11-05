import { resolveActiveValueIndex } from './global-value-phase.ts'
import {
  getHeroPhaseScrollY,
  getNextHeroPhase,
  getPreviousHeroPhase,
  resolveHeroPhase,
  type HeroPhase,
} from './hero-phase.ts'

/** Admin 고정 5항목. 응답 길이가 달라도 accordion 분모로 사용 */
export const DEFAULT_GLOBAL_VALUE_COUNT = 5

/**
 * Desktop 기관소개 sticky track 단일 오케스트레이션.
 *
 * Scroll 단계 분리:
 * 1) Hero Motion 1·2 … Global Mission (isFramePushed=false, Value 비가시)
 * 2) Mission → Value Push/Up (isFramePushed=true, valueIndex 고정 0)
 *    — heroRange 이후 전용 push 구간. accordion 진행 없음.
 * 3) Value accordion (push 완료 이후)
 *    — frontier=0 전체 펼침 → 스크롤 다운 시 위에서부터 순차 접힘
 * 4) end hold + JA Worldwide reveal (frontier=마지막, panel translateY로 Worldwide 노출)
 *
 * track 높이 비율:
 * Hero 680vh + Push 100vh + Value accordion 500vh + hold/reveal 200vh
 */
export const INTRODUCTION_HERO_VH = 680
/** Mission → Value Push/Up 전용 스크롤 (CSS 600ms와 별개로 accordion과 구간 분리) */
export const INTRODUCTION_PUSH_VH = 100
export const INTRODUCTION_VALUE_VH = 500
/**
 * 05 Active 안착 후 JA Worldwide를 sticky viewport 안으로 끌어올리는 구간.
 * (list·Worldwide 동일 panel 형제 — overflow frame 안에서 translate로 연속 노출)
 */
export const INTRODUCTION_VALUE_HOLD_VH = 200
export const INTRODUCTION_TRACK_VH =
  INTRODUCTION_HERO_VH +
  INTRODUCTION_PUSH_VH +
  INTRODUCTION_VALUE_VH +
  INTRODUCTION_VALUE_HOLD_VH

/** hold 구간에서 Worldwide reveal 진행도 0..1 */
export function resolveWorldwideRevealProgress(
  scrollPx: number,
  totalScrollRange: number,
): number {
  const range = Math.max(1, totalScrollRange)
  const heroRange = Math.max(1, range * (INTRODUCTION_HERO_VH / INTRODUCTION_TRACK_VH))
  const pushRange = Math.max(1, range * (INTRODUCTION_PUSH_VH / INTRODUCTION_TRACK_VH))
  const valueRange = Math.max(1, range * (INTRODUCTION_VALUE_VH / INTRODUCTION_TRACK_VH))
  const holdRange = Math.max(1, range * (INTRODUCTION_VALUE_HOLD_VH / INTRODUCTION_TRACK_VH))
  const holdScroll = scrollPx - heroRange - pushRange - valueRange
  if (holdScroll <= 0) return 0
  return Math.min(1, holdScroll / holdRange)
}

export type IntroductionScrollState = {
  heroPhase: HeroPhase
  /**
   * Frame Track Push/Up 여부.
   * true → translateY(-100vh). Mission Active 동안에는 반드시 false.
   */
  isFramePushed: boolean
  /**
   * JA Global Value accordion frontier.
   * index < frontier → 접힘 / index >= frontier → 펼침.
   * Push 구간 완료 이후에만 0 초과로 진행.
   */
  activeValueIndex: number
}

function heroScrollRange(totalScrollRange: number): number {
  return Math.max(
    1,
    totalScrollRange * (INTRODUCTION_HERO_VH / INTRODUCTION_TRACK_VH),
  )
}

function pushScrollRange(totalScrollRange: number): number {
  return Math.max(
    1,
    totalScrollRange * (INTRODUCTION_PUSH_VH / INTRODUCTION_TRACK_VH),
  )
}

function valueAccordionScrollRange(totalScrollRange: number): number {
  return Math.max(
    1,
    totalScrollRange * (INTRODUCTION_VALUE_VH / INTRODUCTION_TRACK_VH),
  )
}

function normalizeValueCount(valueCount?: number): number {
  if (typeof valueCount === 'number' && valueCount > 0) return valueCount
  return DEFAULT_GLOBAL_VALUE_COUNT
}

export function resolveIntroductionScrollState(
  scrollPx: number,
  totalScrollRange: number,
  valueCount = DEFAULT_GLOBAL_VALUE_COUNT,
): IntroductionScrollState {
  const count = normalizeValueCount(valueCount)
  const range = Math.max(1, totalScrollRange)
  const heroRange = heroScrollRange(range)
  const pushRange = pushScrollRange(range)

  /* 1) Hero … Global Mission — Value Frame은 sticky 아래(클립) + 비가시 */
  if (scrollPx <= heroRange) {
    const heroPhase = resolveHeroPhase(scrollPx, heroRange)
    return {
      heroPhase,
      isFramePushed: false,
      activeValueIndex: 0,
    }
  }

  /* 2) Push / Up — Frame Track 이동, accordion 고정(01 Active) */
  if (scrollPx <= heroRange + pushRange) {
    return {
      // Frame 01에는 Mission UI 유지한 채 Track이 위로 이동
      heroPhase: 'mission',
      isFramePushed: true,
      activeValueIndex: 0,
    }
  }

  const valueRange = valueAccordionScrollRange(range)
  const valueScrollPx = scrollPx - heroRange - pushRange

  /* 4) end hold */
  if (valueScrollPx >= valueRange) {
    return {
      heroPhase: 'exit',
      isFramePushed: true,
      activeValueIndex: count - 1,
    }
  }

  /* 3) Value accordion */
  const valueProgress = Math.min(1, Math.max(0, valueScrollPx / valueRange))
  return {
    heroPhase: 'exit',
    isFramePushed: true,
    activeValueIndex: resolveActiveValueIndex(valueProgress, count),
  }
}

export function getIntroductionScrollY(
  state: IntroductionScrollState,
  totalScrollRange: number,
  valueCount = DEFAULT_GLOBAL_VALUE_COUNT,
): number {
  const count = normalizeValueCount(valueCount)
  const range = Math.max(1, totalScrollRange)
  const heroRange = heroScrollRange(range)
  const pushRange = pushScrollRange(range)

  if (!state.isFramePushed && state.heroPhase !== 'exit') {
    return getHeroPhaseScrollY(state.heroPhase, heroRange)
  }

  /* Push 안착(Value 01 Active, accordion 전) */
  if (state.isFramePushed && state.activeValueIndex <= 0) {
    return heroRange + pushRange * 0.5
  }

  const valueRange = valueAccordionScrollRange(range)
  const progress = (state.activeValueIndex + 0.5) / Math.max(1, count)
  return heroRange + pushRange + valueRange * progress
}

/**
 * 화살표: Hero phase만 다음으로.
 * Mission → Push 진입. Value 구간은 스크롤로만.
 */
export function getNextIntroductionScrollY(
  state: IntroductionScrollState,
  totalScrollRange: number,
  valueCount = DEFAULT_GLOBAL_VALUE_COUNT,
): number | null {
  if (state.isFramePushed || state.heroPhase === 'exit') return null

  if (state.heroPhase === 'mission') {
    const range = Math.max(1, totalScrollRange)
    const heroRange = heroScrollRange(range)
    const pushRange = pushScrollRange(range)
    return heroRange + pushRange * 0.5
  }

  const next = getNextHeroPhase(state.heroPhase)
  if (!next || next === 'exit') return null
  return getIntroductionScrollY(
    { heroPhase: next, isFramePushed: false, activeValueIndex: 0 },
    totalScrollRange,
    valueCount,
  )
}

/** 휠 역방향: Hero phase 하나만 이전. idle·Value 구간은 null */
export function resolveHeroPhaseWheelStep(
  accumulated: number,
  delta: number,
  threshold: number,
): { accumulated: number; direction: 1 | -1 | 0 } {
  const next = accumulated + delta
  if (next >= threshold) return { accumulated: 0, direction: 1 }
  if (next <= -threshold) return { accumulated: 0, direction: -1 }
  return { accumulated: next, direction: 0 }
}

export function getPreviousIntroductionScrollY(
  state: IntroductionScrollState,
  totalScrollRange: number,
  valueCount = DEFAULT_GLOBAL_VALUE_COUNT,
): number | null {
  if (state.isFramePushed || state.heroPhase === 'exit') return null
  const previous = getPreviousHeroPhase(state.heroPhase)
  if (!previous) return null
  return getIntroductionScrollY(
    { heroPhase: previous, isFramePushed: false, activeValueIndex: 0 },
    totalScrollRange,
    valueCount,
  )
}
