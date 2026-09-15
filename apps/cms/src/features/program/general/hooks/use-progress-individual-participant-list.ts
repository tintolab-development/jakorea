import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramParticipants } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { shouldPreferGeneralProgramProgressMock } from '@/features/program/general/lib/prefer-general-application-list-mock'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'

/** 개인 참여자 목록 — prefer mock 또는 remote OFF 시 FE mock */
export function useProgressIndividualParticipantList(
  programId: string | undefined,
  program?: Program | null
) {
  const preferMock = shouldPreferGeneralProgramProgressMock(program ?? null)
  const remoteEnabled =
    !preferMock && shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId)

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.participants(programId ?? ''),
    queryFn: () => fetchGeneralProgramParticipants(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const mockList = useMemo(
    () => (programId ? getParticipatingIndividualParticipantsForProgram(programId) : []),
    [programId]
  )

  const participantList: ParticipatingIndividualParticipantRow[] = remoteEnabled
    ? (remoteQuery.data ?? [])
    : mockList

  return {
    participantList,
    loading: remoteEnabled ? remoteQuery.isFetching && remoteQuery.data === undefined : false,
    isRemoteDataSource: remoteEnabled,
  }
}
