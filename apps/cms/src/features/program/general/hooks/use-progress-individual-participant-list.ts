import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramParticipants } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'

/** 개인 참여자 목록 — API only (gate OFF = 빈 목록) */
export function useProgressIndividualParticipantList(programId: string | undefined) {
  const remoteEnabled = shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId)

  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.participants(programId ?? ''),
    queryFn: () => fetchGeneralProgramParticipants(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const participantList: ParticipatingIndividualParticipantRow[] = remoteEnabled
    ? (remoteQuery.data ?? [])
    : []

  return {
    participantList,
    loading: remoteEnabled ? remoteQuery.isFetching && remoteQuery.data === undefined : false,
    isRemoteDataSource: remoteEnabled,
  }
}
