import type { Program } from '@/types/domain'
import type {
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

type AttendancePatch = {
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
}

/** programId → sessionId → participantRowId → patch (UI 세션 패치용) */
const attendancePatchStore: Record<string, Record<string, Record<string, AttendancePatch>>> = {}

/** 개인 프로그램 진행 — 출결 (remote API 연동 전 빈 목록) */
export function getParticipatingIndividualProgressAttendanceSessions(
  _program: Program
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  return []
}

export function getParticipatingIndividualProgressAttendanceEducationScheduleOptions(
  _program: Program
): Array<{ label: string; value: string }> {
  return []
}

export function patchParticipatingIndividualProgressAttendanceParticipant(
  programId: string,
  sessionId: string,
  participantRowId: string,
  patch: AttendancePatch
): void {
  if (!attendancePatchStore[programId]) {
    attendancePatchStore[programId] = {}
  }
  if (!attendancePatchStore[programId][sessionId]) {
    attendancePatchStore[programId][sessionId] = {}
  }
  attendancePatchStore[programId][sessionId]![participantRowId] = patch
}

export function getParticipatingIndividualProgressAttendanceSessionParticipants(
  _program: Program,
  _sessionId: string
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  return []
}
