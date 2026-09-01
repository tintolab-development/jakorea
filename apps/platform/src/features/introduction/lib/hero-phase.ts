import { HERO_SCROLL_TRIGGER_PX } from './hero-copy'

/**
 * Desktop Hero 스크롤 phase.
 * Motion 1: intro → message
 * Motion 2: inspiring → vision → mission
 * (Mission → Value Push/Up 은 introduction-scroll-phase 의 push 구간)
 */
export type HeroPhase =
  | 'intro'
  | 'message'
  | 'inspiring'
  | 'vision'
  | 'mission'
  | 'exit'

const PHASE_ORDER: readonly HeroPhase[] = [
  'intro',
  'message',
  'inspiring',
  'vision',
  'mission',
  'exit',
] as const

export function resolveHeroPhase(scrollPx: number, scrollRange: number): HeroPhase {
  if (scrollPx < HERO_SCROLL_TRIGGER_PX) return 'intro'

  const progress = scrollRange <= 0 ? 1 : Math.min(1, Math.max(0, scrollPx / scrollRange))

  if (progress < 0.22) return 'message'
  if (progress < 0.42) return 'inspiring'
  if (progress < 0.58) return 'vision'
  /* heroRange 끝까지 Mission Active — exit/Push는 오케스트레이터 push 구간 */
  return 'mission'
}

export function isHeroPhaseAtLeast(phase: HeroPhase, target: HeroPhase): boolean {
  return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target)
}

/** 해당 phase에 안정적으로 진입하는 scrollY (임계값 + 여유) */
export function getHeroPhaseScrollY(phase: HeroPhase, scrollRange: number): number {
  const range = Math.max(1, scrollRange)
  switch (phase) {
    case 'intro':
      return 0
    case 'message':
      return HERO_SCROLL_TRIGGER_PX
    case 'inspiring':
      return range * 0.22
    case 'vision':
      return range * 0.42
    case 'mission':
      return range * 0.58
    case 'exit':
      /* Push는 오케스트레이터가 heroRange 이후로 처리 */
      return range
  }
}

export function getNextHeroPhase(phase: HeroPhase): HeroPhase | null {
  if (phase === 'mission' || phase === 'exit') return null
  const index = PHASE_ORDER.indexOf(phase)
  if (index < 0 || index >= PHASE_ORDER.length - 1) return null
  const next = PHASE_ORDER[index + 1] ?? null
  return next === 'exit' ? null : next
}
