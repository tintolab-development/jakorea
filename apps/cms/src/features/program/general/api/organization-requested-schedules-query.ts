import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { fetchOrganizationApplicationRequestedSchedulesRemote } from '@/features/program/general/api/applications-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

const ORGANIZATION_REQUESTED_SCHEDULES_STALE_MS = 30_000

export type OrganizationRequestedSchedulesData = Awaited<
  ReturnType<typeof fetchOrganizationApplicationRequestedSchedulesRemote>
>

export function organizationRequestedSchedulesQueryOptions(applicationId: string) {
  return queryOptions({
    queryKey: generalApplicationsQueryKeys.organizationRequestedSchedules(applicationId),
    queryFn: () => fetchOrganizationApplicationRequestedSchedulesRemote(applicationId),
    staleTime: ORGANIZATION_REQUESTED_SCHEDULES_STALE_MS,
    retry: false,
  })
}

/** 목록·모달 등에서 상세 useQuery와 동일 캐시·in-flight dedupe */
export async function ensureOrganizationRequestedSchedules(
  queryClient: QueryClient,
  applicationId: string
): Promise<OrganizationRequestedSchedulesData> {
  const id = applicationId.trim()
  if (!id) return []
  try {
    return await queryClient.fetchQuery(organizationRequestedSchedulesQueryOptions(id))
  } catch {
    return []
  }
}
