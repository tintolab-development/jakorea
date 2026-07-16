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
  if (!shouldUseProgramProgressHttpRemoteApi()) {
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
  if (!shouldUseProgramProgressHttpRemoteApi()) {
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
