import {
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramParticipantsRemote,
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
  if (!shouldUseGeneralProgramProgressRemoteApi()) {
    throw new Error(
      '일반 프로그램 진행현황 API가 활성화되지 않았습니다. programs·programProgress 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchGeneralProgramParticipants(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ParticipatingIndividualParticipantRow[]> {
  if (!shouldUseGeneralProgramProgressRemoteApi()) {
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
  if (!shouldUseGeneralProgramProgressRemoteApi()) {
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
  if (!shouldUseGeneralProgramProgressRemoteApi()) {
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
  if (!shouldUseGeneralProgramProgressRemoteApi()) {
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
