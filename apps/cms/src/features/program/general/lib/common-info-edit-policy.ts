/**
 * 일반 프로그램 상세 — 공통 정보 「정보 수정」 가능 여부
 * - lifecycle: 프로그램 진행 예정 단계
 * - BE 계약: business_start_date(사업 시작일) 이전만 PATCH 허용
 *   (CONFLICT: Program can only be modified before business_start_date …)
 */

import dayjs, { type ConfigType } from 'dayjs'
import {
  getProgramProgressPhase,
  type ProgramProgressPhaseKey,
} from '@/shared/constants/status'
import type { Program } from '@/types/domain'

export type GeneralProgramInfoEditBlockReason =
  | 'missing'
  | 'phase_in_progress'
  | 'phase_completed'
  | 'phase_other'
  | 'business_start_locked'

/** CMS `Program.startDate` = API businessStartDate / startDate */
export function resolveGeneralProgramBusinessStartDate(
  program: Program
): string | undefined {
  const raw = program.startDate
  if (raw == null) return undefined
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed || undefined
  }
  const asDay = dayjs(raw)
  return asDay.isValid() ? asDay.toISOString() : undefined
}

/**
 * BE: business_start_date **이전**만 수정 가능 (당일 포함 잠금).
 * startDate 없으면 lifecycle 가드만 적용(날짜 잠금 미적용).
 */
export function isGeneralProgramLockedByBusinessStartDate(
  program: Program,
  now: ConfigType = dayjs()
): boolean {
  const start = resolveGeneralProgramBusinessStartDate(program)
  if (!start) return false
  const startDay = dayjs(start)
  if (!startDay.isValid()) return false
  return !dayjs(now).isBefore(startDay, 'day')
}

export function resolveGeneralProgramCommonInfoEditPhase(
  program: Program
): ProgramProgressPhaseKey {
  const status = program.lifecycleStatus
  if (!status) return 'scheduled'
  return getProgramProgressPhase(status)
}

export function resolveGeneralProgramInfoEditBlockReason(
  program: Program | null | undefined,
  now: ConfigType = dayjs()
): GeneralProgramInfoEditBlockReason | null {
  if (!program) return 'missing'
  const phase = resolveGeneralProgramCommonInfoEditPhase(program)
  if (phase === 'inProgress') return 'phase_in_progress'
  if (phase === 'completed') return 'phase_completed'
  if (phase !== 'scheduled') return 'phase_other'
  if (isGeneralProgramLockedByBusinessStartDate(program, now)) {
    return 'business_start_locked'
  }
  return null
}

export function canGeneralProgramCommonInfoEdit(
  program: Program | null | undefined,
  now: ConfigType = dayjs()
): boolean {
  return resolveGeneralProgramInfoEditBlockReason(program, now) == null
}

export function getGeneralProgramCommonInfoEditBlockedAlertMessage(
  program: Program,
  now: ConfigType = dayjs()
): string {
  const reason = resolveGeneralProgramInfoEditBlockReason(program, now)
  if (reason === 'phase_in_progress') {
    return '프로그램 진행 중에는 공통 정보를 수정할 수 없습니다.'
  }
  if (reason === 'phase_completed') {
    return '프로그램 진행이 완료된 경우 공통 정보를 수정할 수 없습니다.'
  }
  if (reason === 'business_start_locked') {
    const start = resolveGeneralProgramBusinessStartDate(program)
    const startLabel = start ? dayjs(start).format('YYYY-MM-DD') : ''
    return startLabel
      ? `사업 시작일(${startLabel})부터는 공통 정보를 수정할 수 없습니다.`
      : '사업 시작일이 지난 프로그램은 공통 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 공통 정보를 수정할 수 없습니다.'
}

/** 모집 정보 — 공통 정보와 동일 가드 (동일 PATCH 계약) */
export function canGeneralProgramRecruitmentInfoEdit(
  program: Program | null | undefined,
  now: ConfigType = dayjs()
): boolean {
  return canGeneralProgramCommonInfoEdit(program, now)
}

export function getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
  program: Program,
  now: ConfigType = dayjs()
): string {
  const reason = resolveGeneralProgramInfoEditBlockReason(program, now)
  if (reason === 'phase_in_progress') {
    return '프로그램 진행 중에는 모집 정보를 수정할 수 없습니다.'
  }
  if (reason === 'phase_completed') {
    return '프로그램 진행이 완료된 경우 모집 정보를 수정할 수 없습니다.'
  }
  if (reason === 'business_start_locked') {
    const start = resolveGeneralProgramBusinessStartDate(program)
    const startLabel = start ? dayjs(start).format('YYYY-MM-DD') : ''
    return startLabel
      ? `사업 시작일(${startLabel})부터는 모집 정보를 수정할 수 없습니다.`
      : '사업 시작일이 지난 프로그램은 모집 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 모집 정보를 수정할 수 없습니다.'
}
