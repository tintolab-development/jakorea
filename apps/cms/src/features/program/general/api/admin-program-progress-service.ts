import {
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramParticipantsRemote,
  fetchProgramSchedulesViaDashboardRemote,
  fetchScheduleAttendancesRemote,
  putScheduleAttendancesRemote,
  type ProgramParticipantsListQuery,
} from '@/features/program/general/api/program-progress-api-client'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'

/**
 * 진행현황 participants / attendances — mock 폴백 없음 (API only).
 */
function assertProgramProgressRemoteReady(): void {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    throw new Error(
      '프로그램 진행현황 API가 활성화되지 않았습니다. programs(또는 1사1교 opt-in)·programProgress 모듈과 API 로그인을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
    )
  }
}

export async function fetchGeneralProgramParticipants(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ParticipatingIndividualParticipantRow[]> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 50,
    participantType: 'INDIVIDUAL',
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingIndividualRow(item, index, programId)
  )
}

export async function fetchGeneralParticipatingInstitutions(
  programId: string
): Promise<ParticipatingSchoolRow[]> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 50,
    participantType: 'ORGANIZATION',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingSchoolRow(item, index, programId)
  )
}

export async function fetchGeneralParticipatingInstructors(
  programId: string
): Promise<ParticipatingInstructorRow[]> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 50,
    participantType: 'INSTRUCTOR',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingInstructorRow(item, index, programId)
  )
}

export async function fetchGeneralParticipatingVolunteers(
  programId: string
): Promise<ParticipatingVolunteerRow[]> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 50,
    participantType: 'VOLUNTEER',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingVolunteerRow(item, index, programId)
  )
}

export async function fetchGeneralScheduleAttendances(programId: string, scheduleId: string) {
  assertProgramProgressRemoteReady()
  return fetchScheduleAttendancesRemote(programId, scheduleId)
}

export async function saveGeneralScheduleAttendances(
  scheduleId: string,
  attendances: import('@/shared/api/generated/dashboard/schemas/attendanceItemRequest').AttendanceItemRequest[]
) {
  assertProgramProgressRemoteReady()
  await putScheduleAttendancesRemote(scheduleId, { attendances })
}

/**
 * dashboard program-schedules + schedule attendances + participants.
 * mock/null 폴백 없음.
 */
export async function fetchGeneralProgressAttendanceBundle(programId: string): Promise<{
  schedules: import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
  participants: import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse[]
  attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  >
}> {
  assertProgramProgressRemoteReady()
  const [schedules, participantsPage] = await Promise.all([
    fetchProgramSchedulesViaDashboardRemote(programId),
    fetchProgramParticipantsRemote(programId, { page: 0, size: 50 }),
  ])
  const attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  > = {}
  await Promise.all(
    schedules
      .filter(s => s.scheduleId != null)
      .map(async s => {
        const scheduleId = String(s.scheduleId)
        try {
          attendancesByScheduleId[scheduleId] = await fetchScheduleAttendancesRemote(
            programId,
            scheduleId
          )
        } catch {
          attendancesByScheduleId[scheduleId] = []
        }
      })
  )
  return {
    schedules,
    participants: participantsPage.items ?? [],
    attendancesByScheduleId,
  }
}

export async function fetchGeneralProgramLectureReports(
  programId: string
): Promise<unknown[]> {
  assertProgramProgressRemoteReady()
  const { fetchProgramLectureReportsRemote } = await import(
    '@/features/program/general/api/program-progress-api-client'
  )
  return fetchProgramLectureReportsRemote(programId, { page: 0, size: 50 })
}
