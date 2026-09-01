/**
 * BE 숫자 programId 등 prefix로 유형을 알 수 없을 때 navigation API로 상세 URL 확정.
 */

import type { QueryClient } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'
import { fetchAdminProgramNavigationRemote } from '@/features/program/general/api/programs-api-client'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  getProgramAdminDetailInfoTabUrl,
  getProgramAdminDetailInfoTabUrlForProgramType,
  tryGetProgramAdminDetailInfoTabUrlByIdPrefix,
} from '@/features/program/general/lib/program-admin-detail-url'

export function programAdminNavigationQueryOptions(programId: string) {
  return queryOptions({
    queryKey: generalProgramQueryKeys.navigation(programId),
    queryFn: () => fetchAdminProgramNavigationRemote(programId),
    staleTime: 60_000,
    retry: false,
  })
}

/** 이력 테이블 노출 중 programId navigation을 미리 채워 클릭 시 동기 이동 */
export function prefetchProgramAdminNavigation(
  queryClient: QueryClient,
  programIds: readonly string[]
): void {
  if (!shouldUseProgramsHttpRemoteApi()) return
  const unique = [...new Set(programIds.map(id => id.trim()).filter(Boolean))]
  for (const id of unique) {
    if (tryGetProgramAdminDetailInfoTabUrlByIdPrefix(id)) continue
    void queryClient.prefetchQuery(programAdminNavigationQueryOptions(id))
  }
}

/**
 * 회원 이력·후원 이력 등에서 프로그램 상세 풀페이지로 이동할 URL.
 * - mock/prefix 확정 → sync
 * - remote → GET …/navigation 의 canonicalProgramType (RQ 캐시)
 * - 실패/비원격 → general 목록(URL programId로 모달 오픈; 루트 `/programs` 금지)
 */
export async function resolveProgramAdminDetailInfoTabUrl(
  programId: string,
  queryClient?: QueryClient
): Promise<string> {
  const id = programId.trim()
  if (!id) return getProgramAdminDetailInfoTabUrl(id)

  const byPrefix = tryGetProgramAdminDetailInfoTabUrlByIdPrefix(id)
  if (byPrefix) return byPrefix

  if (shouldUseProgramsHttpRemoteApi()) {
    try {
      const nav = queryClient
        ? await queryClient.ensureQueryData(programAdminNavigationQueryOptions(id))
        : await fetchAdminProgramNavigationRemote(id)
      const programType = nav.canonicalProgramType ?? nav.rawProgramType
      if (programType?.trim()) {
        return getProgramAdminDetailInfoTabUrlForProgramType(id, programType)
      }
    } catch {
      // 404 등 — general로 열어 상세 GET 에러 UI에 맡김
    }
  }

  return getProgramAdminDetailInfoTabUrl(id)
}
