import { mapParticipantToParticipatingIndividualRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramParticipantsRemote,
  type ProgramParticipantsListQuery,
} from '@/features/program/general/api/program-progress-api-client'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'

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
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingIndividualRow(item, index, programId)
  )
}
