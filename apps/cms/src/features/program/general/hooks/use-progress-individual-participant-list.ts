import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramParticipants } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'

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
    : programId
      ? getParticipatingIndividualParticipantsForProgram(programId)
      : []

  return {
    participantList,
    loading: remoteEnabled ? remoteQuery.isFetching && remoteQuery.data === undefined : false,
    isRemoteDataSource: remoteEnabled,
  }
}
