import type { Program } from '@/types/domain'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'

const sessionByProgramId = new Map<string, Program>()

/** 공통정보 수정 — API 연동 전 세션 내 표시용 스냅샷 */
export function setGeneralProgramDetailSession(program: Program): void {
  sessionByProgramId.set(program.id, program)
}

export function getGeneralProgramDetailSession(programId: string): Program | undefined {
  return sessionByProgramId.get(programId)
}

export function clearGeneralProgramDetailSession(programId?: string): void {
  if (programId) sessionByProgramId.delete(programId)
  else sessionByProgramId.clear()
}

export function applyGeneralProgramDetailSession(program: Program): Program {
  const session = sessionByProgramId.get(program.id)
  if (session == null) return program

  const baseCommon = resolveGeneralProgramCommonInfo(program)
  return {
    ...program,
    ...session,
    generalCommonInfo: {
      ...baseCommon,
      ...program.generalCommonInfo,
      ...session.generalCommonInfo,
    },
  }
}
