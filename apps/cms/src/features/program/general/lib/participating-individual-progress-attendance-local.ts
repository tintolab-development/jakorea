import type { Program } from '@/types/domain'
import { isGeneralProgramTempMockIndividualProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { buildTempMockIndividualProgressAttendanceSessions } from '@/features/program/general/lib/temp-mock-individual-progress-surfaces'
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

const tempMockAttendanceSeedCache: Record<
  string,
  ParticipatingIndividualProgressAttendanceSessionGroup[]
> = {}

function tempMockAttendanceSessionsForProgram(
  program: Program
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  if (!isGeneralProgramTempMockIndividualProgramId(program.id)) return []
  if (!tempMockAttendanceSeedCache[program.id]) {
    tempMockAttendanceSeedCache[program.id] =
      buildTempMockIndividualProgressAttendanceSessions(program)
  }
  return tempMockAttendanceSeedCache[program.id]!
}

function withAttendancePatches(
  programId: string,
  sessions: ParticipatingIndividualProgressAttendanceSessionGroup[]
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const programPatches = attendancePatchStore[programId]
  if (!programPatches) return sessions
  return sessions.map(session => {
    const sessionPatches = programPatches[session.id]
    if (!sessionPatches) return session
    return {
      ...session,
      participants: session.participants.map(participant => {
        const patch = sessionPatches[participant.id]
        if (!patch) return participant
        return {
          ...participant,
          attendanceStatus: patch.attendanceStatus,
          lateTime: patch.lateTime,
          remark: patch.remark,
        }
      }),
    }
  })
}

/** 개인 프로그램 진행 — 출결 (remote API 연동 전 빈 목록) */
export function getParticipatingIndividualProgressAttendanceSessions(
  program: Program
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  return withAttendancePatches(program.id, tempMockAttendanceSessionsForProgram(program))
}

export function getParticipatingIndividualProgressAttendanceEducationScheduleOptions(
  program: Program
): Array<{ label: string; value: string }> {
  return tempMockAttendanceSessionsForProgram(program).map(session => ({
    value: session.filterValue,
    label: session.filterLabel,
  }))
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
  program: Program,
  sessionId: string
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  const session = tempMockAttendanceSessionsForProgram(program).find(s => s.id === sessionId)
  return session?.participants ?? []
}
