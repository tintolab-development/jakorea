import type { Program } from '@/types/domain'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

/** 개인 프로그램 진행 — 과제 제출 (remote API 연동 전 빈 목록) */
export function getParticipatingIndividualProgressAssignmentSessions(
  _program: Program
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  return []
}

export function getParticipatingIndividualProgressAssignmentEducationScheduleOptions(
  _program: Program
): Array<{ label: string; value: string }> {
  return []
}

export function getParticipatingIndividualProgressAssignmentSessionParticipants(
  _program: Program,
  _sessionId: string
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  return []
}
