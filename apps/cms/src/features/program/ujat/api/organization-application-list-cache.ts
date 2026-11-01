import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { UjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionTempAssignmentStatus,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

/** 목록 infinite query만 — detail / temporary-schedule 키는 제외 */
function isOrganizationApplicationsListQuery(queryKey: readonly unknown[]): boolean {
  const last = queryKey[queryKey.length - 1]
  return typeof last === 'object' && last != null && !Array.isArray(last)
}

export function patchUjatOrganizationApplicationListCaches(
  queryClient: QueryClient,
  programId: string,
  applicationIds: readonly string[],
  patch: Partial<Pick<UjatInstitutionApplicationRow, 'tempAssignmentStatus'>>
): void {
  if (!programId || applicationIds.length === 0) return
  const idSet = new Set(applicationIds.map(String))
  queryClient.setQueriesData<InfiniteData<UjatInstitutionApplicationsPage>>(
    {
      queryKey: ujatQueryKeys.organizationApplicationsRoot(programId),
      predicate: query => isOrganizationApplicationsListQuery(query.queryKey),
    },
    old => {
      if (!old || !Array.isArray(old.pages)) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          rows: page.rows.map(row => (idSet.has(row.id) ? { ...row, ...patch } : row)),
        })),
      }
    }
  )
}

export function patchUjatOrganizationApplicationTempAssignmentStatus(
  queryClient: QueryClient,
  programId: string,
  applicationIds: readonly string[],
  status: UjatInstitutionTempAssignmentStatus
): void {
  patchUjatOrganizationApplicationListCaches(queryClient, programId, applicationIds, {
    tempAssignmentStatus: status,
  })
}

export async function invalidateUjatOrganizationApplicationLists(
  queryClient: QueryClient,
  programId: string
): Promise<void> {
  if (!programId) return
  await queryClient.invalidateQueries({
    queryKey: ujatQueryKeys.organizationApplicationsRoot(programId),
    refetchType: 'active',
  })
}
