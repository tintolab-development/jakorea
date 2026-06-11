/**
 * 일반 프로그램 상세 — 공통 정보 「정보 수정」 가능 여부
 * 프로그램 진행 예정 단계에서만 수정 허용
 */

import {
  getProgramProgressPhase,
  type ProgramProgressPhaseKey,
} from '@/shared/constants/status'
import type { Program } from '@/types/domain'

export function resolveGeneralProgramCommonInfoEditPhase(
  program: Program
): ProgramProgressPhaseKey {
  const status = program.lifecycleStatus
  if (!status) return 'scheduled'
  return getProgramProgressPhase(status)
}

export function canGeneralProgramCommonInfoEdit(
  program: Program | null | undefined
): boolean {
  if (!program) return false
  return resolveGeneralProgramCommonInfoEditPhase(program) === 'scheduled'
}

export function getGeneralProgramCommonInfoEditBlockedAlertMessage(
  program: Program
): string {
  const phase = resolveGeneralProgramCommonInfoEditPhase(program)
  if (phase === 'inProgress') {
    return '프로그램 진행 중에는 공통 정보를 수정할 수 없습니다.'
  }
  if (phase === 'completed') {
    return '프로그램 진행이 완료된 경우 공통 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 공통 정보를 수정할 수 없습니다.'
}
