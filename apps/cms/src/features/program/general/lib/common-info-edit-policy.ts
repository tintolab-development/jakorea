/**
 * 일반 프로그램 상세 — 공통·모집 정보 「정보 수정」 가능 여부
 * 기획: 프로그램 진행 전(진행 예정)까지만 가능
 * 표시 라벨(프로그램 진행 중/완료)과 동일 UI 버킷을 SSOT로 쓴다.
 */

import { getProgramProgressPhase, type ProgramProgressPhaseKey } from '@/shared/constants/status'
import { getProgramProgressUiBucket } from '@/shared/lib/program-typed-lifecycle'
import type { Program } from '@/types/domain'

export type GeneralProgramInfoEditBlockReason =
  | 'missing'
  | 'phase_in_progress'
  | 'phase_completed'
  | 'phase_other'

export function resolveGeneralProgramCommonInfoEditPhase(
  program: Program
): ProgramProgressPhaseKey {
  const status = program.lifecycleStatus
  if (!status) return 'scheduled'
  return getProgramProgressPhase(status)
}

export function resolveGeneralProgramInfoEditBlockReason(
  program: Program | null | undefined
): GeneralProgramInfoEditBlockReason | null {
  if (!program) return 'missing'
  const bucket = getProgramProgressUiBucket(program.lifecycleStatus)
  if (bucket === 'IN_PROGRESS') return 'phase_in_progress'
  if (bucket === 'COMPLETED') return 'phase_completed'
  return null
}

export function canGeneralProgramCommonInfoEdit(
  program: Program | null | undefined
): boolean {
  return resolveGeneralProgramInfoEditBlockReason(program) == null
}

export function getGeneralProgramCommonInfoEditBlockedAlertMessage(
  program: Program
): string {
  const reason = resolveGeneralProgramInfoEditBlockReason(program)
  if (reason === 'phase_in_progress') {
    return '프로그램 진행 중에는 공통 정보를 수정할 수 없습니다.'
  }
  if (reason === 'phase_completed') {
    return '프로그램 진행이 완료된 경우 공통 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 공통 정보를 수정할 수 없습니다.'
}

/** 모집 정보 — 공통 정보와 동일 가드 */
export function canGeneralProgramRecruitmentInfoEdit(
  program: Program | null | undefined
): boolean {
  return canGeneralProgramCommonInfoEdit(program)
}

export function getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
  program: Program
): string {
  const reason = resolveGeneralProgramInfoEditBlockReason(program)
  if (reason === 'phase_in_progress') {
    return '프로그램 진행 중에는 모집 정보를 수정할 수 없습니다.'
  }
  if (reason === 'phase_completed') {
    return '프로그램 진행이 완료된 경우 모집 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 모집 정보를 수정할 수 없습니다.'
}
