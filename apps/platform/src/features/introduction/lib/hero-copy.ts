/**
 * Hero Motion 타이밍·라벨 — 카피 본문은 API.
 *
 * idle(배경만) → intro(헤드라인) → message(서브 카피)
 * → inspiring → vision → mission
 *
 * 값은 hero 스크롤 구간(0..1) 상한. 다음 phase 직전까지 해당 카피가 유지된다.
 */

export const HERO_PHASE_PROGRESS = {
  idle: 0.08,
  intro: 0.24,
  message: 0.42,
  inspiring: 0.6,
  vision: 0.78,
} as const

export const HERO_MOTION_MS = 700

/** 휠/트랙패드 누적 후 1 phase 이동 */
export const HERO_PHASE_STEP_DELTA = 64

/** phase 전환 중 추가 휠 무시 */
export const HERO_PHASE_STEP_MS = 820

export const VISION_LABEL = 'Global Vision'
export const MISSION_LABEL = 'Global Mission'
