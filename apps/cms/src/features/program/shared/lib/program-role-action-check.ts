import type { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isProgramDetailAccessCheckRequired } from '@/features/program/shared/lib/program-detail-access'
import { resolveProgramDetailActionPermissions } from '@/features/program/shared/lib/program-detail-action-guard'
import {
  fetchProgramMyAssignment,
  programMyAssignmentQueryKey,
} from '@/features/program/shared/lib/program-my-assignment'
import {
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { queryClient as sharedQueryClient } from '@/shared/lib/query-client'

/** 상세 진입 확인·상세 가드와 같은 캐시 */
const ASSIGNMENT_STALE_TIME_MS = 30_000

/**
 * 권한 설정 V1.2 '역할 연동' 처리(프로그램 삭제, 지급조서 확인·발급, 회원 수료증·인증서 발급 등)를
 * 프로그램 상세 밖에서 실행하기 전에 확인한다. 대상 프로그램마다 내 프로그램 역할(my-assignment)이
 * Program Owner·Program Assistant(PROGRAM_EDIT)여야 하며, 하나라도 아니면 접근 불가 안내를 띄우고 false.
 *
 * - Master·원격 미사용은 확인하지 않는다(true).
 * - 미배정(403)은 axios 공통 처리가 이미 안내를 띄우므로 추가 안내 없이 false.
 * - 그 밖의 조회 실패는 서버 판정에 맡긴다(true).
 */
export async function ensureProgramWriteAllowed(
  programIds: readonly (string | number | null | undefined)[],
  client: QueryClient = sharedQueryClient
): Promise<boolean> {
  if (!isProgramDetailAccessCheckRequired()) return true
  const ids = [
    ...new Set(
      programIds.map(id => (id == null ? '' : String(id).trim())).filter(id => id.length > 0)
    ),
  ]
  if (ids.length === 0) return true
  const user = useAuthStore.getState().user
  const roleCode = resolveAdminRoleCodeFromUser(user)
  const adminAccountId = user?.adminAccountId ?? null

  const results = await Promise.all(
    ids.map(async id => {
      try {
        const assignment = await client.fetchQuery({
          queryKey: programMyAssignmentQueryKey(id, adminAccountId),
          queryFn: () => fetchProgramMyAssignment(id),
          staleTime: ASSIGNMENT_STALE_TIME_MS,
        })
        return resolveProgramDetailActionPermissions({ roleCode, assignment }).write
          ? 'allowed'
          : 'denied'
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) return 'unassigned'
        return 'allowed'
      }
    })
  )
  if (results.includes('unassigned')) return false
  if (results.includes('denied')) {
    showAdminAccessDeniedAlert()
    return false
  }
  return true
}
