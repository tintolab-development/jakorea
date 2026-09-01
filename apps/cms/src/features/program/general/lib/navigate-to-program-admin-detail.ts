/**
 * 회원/후원 이력 행 → 프로그램 관리자 상세 이동.
 *
 * - 클릭 즉시(동기) 이동 가능한 경우 await 없이 navigate(string)
 * - React Query navigation 캐시 hit 시에도 동기 navigate
 * - miss 시에만 resolve 후 한 번 navigate (optimistic hop 금지)
 */

import type { QueryClient } from '@tanstack/react-query'
import type { NavigateFunction } from 'react-router-dom'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  getProgramAdminDetailInfoTabUrlForProgramType,
  tryGetProgramAdminDetailInfoTabUrlByIdPrefix,
} from '@/features/program/general/lib/program-admin-detail-url'
import { resolveProgramAdminDetailInfoTabUrl } from '@/features/program/general/lib/resolve-program-admin-detail-url'
import type { ProgramNavigationResponse } from '@/shared/api/generated/dashboard/schemas/programNavigationResponse'

function urlFromNavigationCache(
  programId: string,
  nav: ProgramNavigationResponse | undefined
): string | null {
  const programType = nav?.canonicalProgramType ?? nav?.rawProgramType
  if (!programType?.trim()) return null
  return getProgramAdminDetailInfoTabUrlForProgramType(programId, programType)
}

export function navigateToProgramAdminDetail(
  navigate: NavigateFunction,
  programId: string,
  options?: {
    /** 회원 상세 URL sync가 이탈 후 search를 덮어쓰지 않도록 먼저 호출 */
    onBeforeNavigate?: () => void
    queryClient?: QueryClient
  }
): void {
  const id = programId.trim()
  if (!id) return

  options?.onBeforeNavigate?.()

  const known = tryGetProgramAdminDetailInfoTabUrlByIdPrefix(id)
  if (known) {
    navigate(known)
    return
  }

  const cachedUrl = urlFromNavigationCache(
    id,
    options?.queryClient?.getQueryData<ProgramNavigationResponse>(
      generalProgramQueryKeys.navigation(id)
    )
  )
  if (cachedUrl) {
    navigate(cachedUrl)
    return
  }

  void resolveProgramAdminDetailInfoTabUrl(id, options?.queryClient).then(resolved => {
    navigate(resolved)
  })
}
