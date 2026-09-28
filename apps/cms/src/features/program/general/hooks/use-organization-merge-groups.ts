import { useQuery } from '@tanstack/react-query'
import { fetchOrganizationMergeGroups } from '@/features/program/general/api/organization-merge-groups-service'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isGeneralOrganizationProgramType } from '@/features/program/general/lib/organization-merge-program-type'

export function useOrganizationMergeGroups(
  programId: string | undefined,
  programType: string | null | undefined,
  enabled = true
) {
  const typeAllowed = isGeneralOrganizationProgramType(programType)
  const remoteEnabled =
    shouldUseOrganizationMergeGroupsRemoteApi() && Boolean(programId) && enabled && typeAllowed

  return useQuery({
    queryKey: generalProgramProgressQueryKeys.mergeGroups(programId ?? ''),
    queryFn: () => fetchOrganizationMergeGroups(programId!, programType),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}
