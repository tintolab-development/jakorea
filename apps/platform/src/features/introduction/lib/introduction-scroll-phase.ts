import { GLOBAL_VALUE_COUNT } from './global-value-data'
import { resolveActiveValueIndex } from './global-value-phase'
import {
  getHeroPhaseScrollY,
  getNextHeroPhase,
  resolveHeroPhase,
  type HeroPhase,
} from './hero-phase'

/**
 * Desktop 기관소개 sticky track 단일 오케스트레이션.
 *
 * Scroll 단계 분리:
 * 1) Hero Motion 1·2 … Global Mission (heroPhase !== 'exit')
 * 2) Mission → Value Push/Up (heroPhase === 'exit', valueIndex 고정 0)
 *    — heroRange 내 exit 구간(progress ≥ 0.74). 이 동안 accordion 진행 없음.
 * 3) Value 01…05 accordion (heroRange 이후)
 *
 * track 높이 비율: Hero(+Push) 520vh + Value accordion 500vh
 */
export const INTRODUCTION_HERO_VH = 520
export const INTRODUCTION_VALUE_VH = 500
export const INTRODUCTION_TRACK_VH = INTRODUCTION_HERO_VH + INTRODUCTION_VALUE_VH

export type IntroductionScrollState = {
  heroPhase: HeroPhase
  /**
   * Frame Track Push/Up 여부.
   * true → translateY(-100vh). Mission 동안에는 반드시 false.
   */
  isFramePushed: boolean
  /**
   * JA Global Value accordion index.
   * Push 완료(heroRange 통과) 이후에만 0 초과로 진행.
   */
  activeValueIndex: number
}

function heroScrollRange(totalScrollRange: number): number {
  return Math.max(
    1,
    totalScrollRange * (INTRODUCTION_HERO_VH / INTRODUCTION_TRACK_VH),
  )
}

export function resolveIntroductionScrollState(
  scrollPx: number,
  totalScrollRange: number,
): IntroductionScrollState {
  const range = Math.max(1, totalScrollRange)
  const heroRange = heroScrollRange(range)

  if (scrollPx <= heroRange) {
    const heroPhase = resolveHeroPhase(scrollPx, heroRange)
    const isFramePushed = heroPhase === 'exit'
    return {
      heroPhase,
      isFramePushed,
      // Push 구간에서는 01 Active만 — accordion은 heroRange 이후
      activeValueIndex: 0,
    }
  }

  const valueRange = Math.max(1, range - heroRange)
  const valueProgress = Math.min(1, Math.max(0, (scrollPx - heroRange) / valueRange))

  return {
    heroPhase: 'exit',
    isFramePushed: true,
    activeValueIndex: resolveActiveValueIndex(valueProgress, GLOBAL_VALUE_COUNT),
  }
}

export function getIntroductionScrollY(
  state: IntroductionScrollState,
  totalScrollRange: number,
): number {
  const range = Math.max(1, totalScrollRange)
  const heroRange = heroScrollRange(range)

  if (state.heroPhase !== 'exit') {
    return getHeroPhaseScrollY(state.heroPhase, heroRange)
  }

  if (state.activeValueIndex <= 0) {
    // Push 안착: exit 임계값 (01 Active, accordion 전)
    return getHeroPhaseScrollY('exit', heroRange)
  }

  const valueRange = Math.max(1, range - heroRange)
  const count = Math.max(1, GLOBAL_VALUE_COUNT)
  const progress = (state.activeValueIndex + 0.5) / count
  return heroRange + valueRange * progress
}

/** 화살표: Hero phase만 다음으로 (exit/Push 진입까지). Value 구간은 스크롤로만 */
export function getNextIntroductionScrollY(
  state: IntroductionScrollState,
  totalScrollRange: number,
): number | null {
  if (state.heroPhase === 'exit') return null
  const next = getNextHeroPhase(state.heroPhase)
  if (!next) return null
  return getIntroductionScrollY(
    { heroPhase: next, isFramePushed: next === 'exit', activeValueIndex: 0 },
    totalScrollRange,
  )
}
