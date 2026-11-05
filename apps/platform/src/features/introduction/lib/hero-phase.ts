import { HERO_PHASE_PROGRESS } from './hero-copy.ts'

/**
 * Desktop Hero 스크롤 phase.
 * Motion 1: idle → intro → message
 * Motion 2: inspiring → vision → mission
 * (Mission → Value Push/Up 은 introduction-scroll-phase 의 push 구간)
 */
export type HeroPhase =
  | 'idle'
  | 'intro'
  | 'message'
  | 'inspiring'
  | 'vision'
  | 'mission'
  | 'exit'

const PHASE_ORDER: readonly HeroPhase[] = [
  'idle',
  'intro',
  'message',
  'inspiring',
  'vision',
  'mission',
  'exit',
] as const

function clampProgress(scrollPx: number, scrollRange: number): number {
  if (scrollRange <= 0) return 1
  return Math.min(1, Math.max(0, scrollPx / scrollRange))
}

export function resolveHeroPhase(scrollPx: number, scrollRange: number): HeroPhase {
  const progress = clampProgress(scrollPx, scrollRange)

  if (progress < HERO_PHASE_PROGRESS.idle) return 'idle'
  if (progress < HERO_PHASE_PROGRESS.intro) return 'intro'
  if (progress < HERO_PHASE_PROGRESS.message) return 'message'
  if (progress < HERO_PHASE_PROGRESS.inspiring) return 'inspiring'
  if (progress < HERO_PHASE_PROGRESS.vision) return 'vision'
  /* heroRange 끝까지 Mission Active — exit/Push는 오케스트레이터 push 구간 */
  return 'mission'
}

export function isHeroPhaseAtLeast(phase: HeroPhase, target: HeroPhase): boolean {
  return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target)
}

function phaseStartProgress(phase: HeroPhase): number {
  switch (phase) {
    case 'idle':
      return 0
    case 'intro':
      return HERO_PHASE_PROGRESS.idle
    case 'message':
      return HERO_PHASE_PROGRESS.intro
    case 'inspiring':
      return HERO_PHASE_PROGRESS.message
    case 'vision':
      return HERO_PHASE_PROGRESS.inspiring
    case 'mission':
      return HERO_PHASE_PROGRESS.vision
    case 'exit':
      return 1
  }
}

function phaseEndProgress(phase: HeroPhase): number {
  switch (phase) {
    case 'idle':
      return HERO_PHASE_PROGRESS.idle
    case 'intro':
      return HERO_PHASE_PROGRESS.intro
    case 'message':
      return HERO_PHASE_PROGRESS.message
    case 'inspiring':
      return HERO_PHASE_PROGRESS.inspiring
    case 'vision':
      return HERO_PHASE_PROGRESS.vision
    case 'mission':
    case 'exit':
      return 1
  }
}

/** 해당 phase 중반 — 경계에서 바로 다음으로 넘어가지 않도록 */
export function getHeroPhaseScrollY(phase: HeroPhase, scrollRange: number): number {
  const range = Math.max(1, scrollRange)
  if (phase === 'idle') return 0
  if (phase === 'exit') return range
  const start = phaseStartProgress(phase)
  const end = phaseEndProgress(phase)
  return range * (start + (end - start) * 0.45)
}

export function getNextHeroPhase(phase: HeroPhase): HeroPhase | null {
  if (phase === 'mission' || phase === 'exit') return null
  const index = PHASE_ORDER.indexOf(phase)
  if (index < 0 || index >= PHASE_ORDER.length - 1) return null
  const next = PHASE_ORDER[index + 1] ?? null
  return next === 'exit' ? null : next
}

export function getPreviousHeroPhase(phase: HeroPhase): HeroPhase | null {
  if (phase === 'idle' || phase === 'exit') return null
  const index = PHASE_ORDER.indexOf(phase)
  if (index <= 0) return null
  return PHASE_ORDER[index - 1] ?? null
}
