import {
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramParticipantsRemote,
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
  if (!shouldUseProgramProgressHttpRemoteApi()) {
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
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    return getParticipatingSchoolsForProgram(programId)
  }

  assertProgramProgressRemoteReady()
  try {
    const page = await fetchProgramParticipantsRemote(programId, {
      page: 0,
      size: 500,
      participantType: 'ORGANIZATION',
    })
    const rows = (page.items ?? []).map((item, index) =>
      mapParticipantToParticipatingSchoolRow(item, index, programId)
    )
    // API 전환 중: ORGANIZATION 참여자 미시드·빈 응답이면 목록 mock으로 UI 유지
    if (rows.length > 0) return rows
  } catch {
    // remote 실패 시에도 참여 기관 목록만 mock 유지
  }
  return getParticipatingSchoolsForProgram(programId)
}

export async function fetchGeneralParticipatingInstructors(
  programId: string
): Promise<ParticipatingInstructorRow[]> {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    return [...MOCK_PARTICIPATING_INSTRUCTORS]
  }

  assertProgramProgressRemoteReady()
  try {
    const page = await fetchProgramParticipantsRemote(programId, {
      page: 0,
      size: 500,
      participantType: 'INSTRUCTOR',
    })
    const rows = (page.items ?? []).map((item, index) =>
      mapParticipantToParticipatingInstructorRow(item, index, programId)
    )
    // API 전환 중: INSTRUCTOR 미시드·빈 응답이면 목록 mock으로 UI 유지
    if (rows.length > 0) return rows
  } catch {
    // remote 실패 시에도 참여 강사 목록만 mock 유지
  }
  return [...MOCK_PARTICIPATING_INSTRUCTORS]
}

export async function fetchGeneralParticipatingVolunteers(
  programId: string
): Promise<ParticipatingVolunteerRow[]> {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    return [...MOCK_PARTICIPATING_VOLUNTEERS]
  }

  assertProgramProgressRemoteReady()
  try {
    const page = await fetchProgramParticipantsRemote(programId, {
      page: 0,
      size: 500,
      participantType: 'VOLUNTEER',
    })
    const rows = (page.items ?? []).map((item, index) =>
      mapParticipantToParticipatingVolunteerRow(item, index, programId)
    )
    // API 전환 중: VOLUNTEER 미시드·빈 응답이면 목록 mock으로 UI 유지
    if (rows.length > 0) return rows
  } catch {
    // remote 실패 시에도 참여 봉사자 목록만 mock 유지
  }
  return [...MOCK_PARTICIPATING_VOLUNTEERS]
}

export async function fetchGeneralScheduleAttendances(programId: string, scheduleId: string) {
  if (!shouldUseProgramProgressHttpRemoteApi()) return []
  assertProgramProgressRemoteReady()
  return fetchScheduleAttendancesRemote(programId, scheduleId)
}

export async function saveGeneralScheduleAttendances(
  scheduleId: string,
  attendances: import('@/shared/api/generated/dashboard/schemas/attendanceItemRequest').AttendanceItemRequest[]
) {
  if (!shouldUseProgramProgressHttpRemoteApi()) return
  assertProgramProgressRemoteReady()
  await putScheduleAttendancesRemote(scheduleId, { attendances })
}
