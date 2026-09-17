import { useQuery } from '@tanstack/react-query'
import { fetchOrganizationMergeGroups } from '@/features/program/general/api/organization-merge-groups-service'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

export function useOrganizationMergeGroups(programId: string | undefined, enabled = true) {
  const remoteEnabled = shouldUseOrganizationMergeGroupsRemoteApi() && Boolean(programId) && enabled

  return useQuery({
    queryKey: generalProgramProgressQueryKeys.mergeGroups(programId ?? ''),
    queryFn: () => fetchOrganizationMergeGroups(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
