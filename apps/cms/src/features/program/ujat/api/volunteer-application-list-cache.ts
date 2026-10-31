import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'

function isVolunteerApplicationsListQuery(queryKey: readonly unknown[]): boolean {
  const last = queryKey[queryKey.length - 1]
  return typeof last === 'object' && last != null && 'stage' in last && 'half' in last
}

export function patchUjatVolunteerApplicationListCaches(
  queryClient: QueryClient,
  programId: string,
  applicationId: string,
  patch: Partial<UjatVolunteerApplicantRow>
): void {
  queryClient.setQueriesData<InfiniteData<UjatVolunteerApplicationsPage>>(
    {
      queryKey: ujatQueryKeys.volunteerApplicationsRoot(programId),
      predicate: query => isVolunteerApplicationsListQuery(query.queryKey),
    },
    old => {
      if (!old || !Array.isArray(old.pages)) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          rows: page.rows.map(row => (row.id === applicationId ? { ...row, ...patch } : row)),
        })),
      }
    }
  )
}

/** 활성·비활성(다른 탭) 봉사자 목록을 모두 다시 불러 면접 대상자 캐시를 맞춘다. */
export async function invalidateUjatVolunteerApplicationLists(
  queryClient: QueryClient,
  programId: string
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: ujatQueryKeys.volunteerApplicationsRoot(programId),
    refetchType: 'all',
  })
}
