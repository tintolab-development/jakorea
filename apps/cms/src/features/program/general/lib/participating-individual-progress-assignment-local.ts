import type { Program } from '@/types/domain'
import { isGeneralProgramTempMockIndividualProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { buildTempMockIndividualProgressAssignmentSessions } from '@/features/program/general/lib/temp-mock-individual-progress-surfaces'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

const tempMockAssignmentSeedCache: Record<
  string,
  ParticipatingIndividualProgressAssignmentSessionGroup[]
> = {}

function tempMockAssignmentSessionsForProgram(
  program: Program
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  if (!isGeneralProgramTempMockIndividualProgramId(program.id)) return []
  if (!tempMockAssignmentSeedCache[program.id]) {
    tempMockAssignmentSeedCache[program.id] =
      buildTempMockIndividualProgressAssignmentSessions(program)
  }
  return tempMockAssignmentSeedCache[program.id]!
}

/** 개인 프로그램 진행 — 과제 제출 (remote API 연동 전 빈 목록) */
export function getParticipatingIndividualProgressAssignmentSessions(
  program: Program
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  return tempMockAssignmentSessionsForProgram(program)
}

export function getParticipatingIndividualProgressAssignmentEducationScheduleOptions(
  program: Program
): Array<{ label: string; value: string }> {
  return tempMockAssignmentSessionsForProgram(program).map(session => ({
    value: session.filterValue,
    label: session.filterLabel,
  }))
}

export function getParticipatingIndividualProgressAssignmentSessionParticipants(
  program: Program,
  sessionId: string
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  const session = tempMockAssignmentSessionsForProgram(program).find(s => s.id === sessionId)
  return session?.participants ?? []
}
