import type { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  fetchProgramMyAssignment,
  programMyAssignmentQueryKey,
} from '@/features/program/shared/lib/program-my-assignment'
import {
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { queryClient as sharedQueryClient } from '@/shared/lib/query-client'

/**
 * 권한 설정 V1.2 원칙 3·7: Master를 제외한 관리자는 담당자로 지정된 프로그램만 상세에 진입한다.
 * 진입 전에 확인이 필요 없으면(Master, 원격 미사용) false — 호출부는 동기로 바로 이동할 수 있다.
 */
export function isProgramDetailAccessCheckRequired(): boolean {
  if (!shouldUseProgramsHttpRemoteApi()) return false
  return resolveAdminRoleCodeFromUser(useAuthStore.getState().user) !== 'MASTER'
}

/**
 * 프로그램 상세 진입 가능 여부. 미배정이면 BE …/my-assignment가 403을 주고 axios 공통 처리가
 * '접근 권한이 없습니다.' 팝업을 띄운다. 403이 아닌 실패(네트워크 등)는 상세 화면의 기존 오류 처리에 맡긴다.
 */
export async function checkProgramDetailAccess(
  programId: string,
  client: QueryClient = sharedQueryClient
): Promise<boolean> {
  const id = programId.trim()
  if (!id || !isProgramDetailAccessCheckRequired()) return true
  const adminAccountId = useAuthStore.getState().user?.adminAccountId ?? null
  try {
    const assignment = await client.fetchQuery({
      queryKey: programMyAssignmentQueryKey(id, adminAccountId),
      queryFn: () => fetchProgramMyAssignment(id),
      staleTime: 30_000,
    })
    if (assignment?.masterBypass === true || assignment?.assigned === true) return true
    showAdminAccessDeniedAlert()
    return false
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) return false
    return true
  }
}
