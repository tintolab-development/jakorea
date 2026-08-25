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
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'
import {
  getParticipatingSchoolsForProgram,
  type ParticipatingSchoolRow,
} from '@/data/mock/participating-schools'
import {
  MOCK_PARTICIPATING_INSTRUCTORS,
  type ParticipatingInstructorRow,
} from '@/data/mock/participating-instructors'
import {
  MOCK_PARTICIPATING_VOLUNTEERS,
  type ParticipatingVolunteerRow,
} from '@/data/mock/participating-volunteers'

/**
 * 진행현황 participants / attendances.
 * remote 게이트: programs(+1사1교/TT opt-in) · programProgress + JWT.
 * mock 폴백: 게이트 OFF 시만.
 */
const FORCE_PROGRAM_PROGRESS_MOCK = false

function useProgramProgressMock(): boolean {
  return FORCE_PROGRAM_PROGRESS_MOCK || !shouldUseProgramProgressHttpRemoteApi()
}

function assertProgramProgressRemoteReady(): void {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    throw new Error(
      '프로그램 진행현황 API가 활성화되지 않았습니다. programs(또는 1사1교 opt-in)·programProgress 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchGeneralProgramParticipants(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ParticipatingIndividualParticipantRow[]> {
  if (useProgramProgressMock()) {
    return getParticipatingIndividualParticipantsForProgram(programId)
  }

  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 500,
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
  if (useProgramProgressMock()) {
    return getParticipatingSchoolsForProgram(programId)
  }

  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 500,
    participantType: 'ORGANIZATION',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingSchoolRow(item, index, programId)
  )
}

export async function fetchGeneralParticipatingInstructors(
  programId: string
): Promise<ParticipatingInstructorRow[]> {
  if (useProgramProgressMock()) {
    return [...MOCK_PARTICIPATING_INSTRUCTORS]
  }

  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 500,
    participantType: 'INSTRUCTOR',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingInstructorRow(item, index, programId)
  )
}

export async function fetchGeneralParticipatingVolunteers(
  programId: string
): Promise<ParticipatingVolunteerRow[]> {
  if (useProgramProgressMock()) {
    return [...MOCK_PARTICIPATING_VOLUNTEERS]
  }

  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: 500,
    participantType: 'VOLUNTEER',
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingVolunteerRow(item, index, programId)
  )
}

export async function fetchGeneralScheduleAttendances(programId: string, scheduleId: string) {
  if (useProgramProgressMock()) return []
  assertProgramProgressRemoteReady()
  return fetchScheduleAttendancesRemote(programId, scheduleId)
}

export async function saveGeneralScheduleAttendances(
  scheduleId: string,
  attendances: import('@/shared/api/generated/dashboard/schemas/attendanceItemRequest').AttendanceItemRequest[]
) {
  if (useProgramProgressMock()) return
  assertProgramProgressRemoteReady()
  await putScheduleAttendancesRemote(scheduleId, { attendances })
}

/**
 * remote ON: dashboard program-schedules + schedule attendances + participants (P2-2 우회).
 * remote OFF / 실패: null → 호출부 mock.
 */
export async function fetchGeneralProgressAttendanceBundle(programId: string): Promise<{
  schedules: import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
  participants: import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse[]
  attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  >
} | null> {
  if (useProgramProgressMock()) return null
  assertProgramProgressRemoteReady()
  try {
    const [schedules, participantsPage] = await Promise.all([
      fetchProgramSchedulesViaDashboardRemote(programId),
      fetchProgramParticipantsRemote(programId, { page: 0, size: 500 }),
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
  } catch {
    return null
  }
}

export async function fetchGeneralProgramLectureReports(programId: string): Promise<unknown[] | null> {
  if (useProgramProgressMock()) return null
  assertProgramProgressRemoteReady()
  try {
    const { fetchProgramLectureReportsRemote } = await import(
      '@/features/program/general/api/program-progress-api-client'
    )
    return await fetchProgramLectureReportsRemote(programId, { page: 0, size: 50 })
  } catch {
    return null
  }
}
