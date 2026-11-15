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
  patch: Partial<
    Pick<UjatInstitutionApplicationRow, 'tempAssignmentStatus' | 'temporaryScheduleAssigned'>
  >
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

/**
 * 임시 배정·임시 배정 취소 POST의 `processed[]`를 목록 캐시에 반영한다(서버가 돌려준 값만 사용).
 * 화면은 이어서 재조회로 서버 값을 덮어쓴다.
 */
export function patchUjatOrganizationApplicationTemporaryAssignmentProcessed(
  queryClient: QueryClient,
  programId: string,
  processed: ReadonlyArray<{
    applicationId: number | string
    temporaryAssignmentStatus: string | null
    temporaryScheduleAssigned: boolean | null
  }>
): void {
  for (const item of processed) {
    const status = String(item.temporaryAssignmentStatus ?? '').trim().toUpperCase()
    const tempAssignmentStatus: UjatInstitutionTempAssignmentStatus | null =
      status === 'TEMP_ASSIGNED'
        ? 'temp_assigned'
        : status === '' || status === 'EVALUATION_PENDING'
          ? 'evaluation_pending'
          : null
    if (!tempAssignmentStatus) continue
    patchUjatOrganizationApplicationListCaches(queryClient, programId, [String(item.applicationId)], {
      tempAssignmentStatus,
      temporaryScheduleAssigned:
        tempAssignmentStatus === 'temp_assigned' ? item.temporaryScheduleAssigned : null,
    })
  }
}
