import { adminMeQueryKeys } from '@/features/auth/api/admin-me-query-keys'
import { fetchAdminMeProfile } from '@/features/auth/api/admin-me-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { resolveHomepageActionPermissions } from '@/shared/lib/homepage-action-guard'
import { queryClient } from '@/shared/lib/query-client'

/** `useAdminMeProfile`과 같은 캐시 기준 */
const PROFILE_STALE_MS = 60_000

/**
 * 신청 상세 조회의 `revealPii` 값.
 * 권한 설정 V1.2 '신청자 개인정보 확인': HOMEPAGE_PII_VIEW 보유자(Master·Accounting Manager·Program Manager)만 원문,
 * Program Viewer는 상세에서도 마스킹 유지. 미보유자가 `revealPii=true`를 보내면 BE(main)가 403을 줘서
 * 상세 모달이 열렸다 닫히므로, 권한이 있을 때만 true로 보낸다. 프로필 조회 실패 시 마스킹(false)으로 본다.
 */
export async function resolveApplicantRevealPii(): Promise<boolean> {
  const adminId = useAuthStore.getState().user?.id
  if (!adminId) return false
  try {
    const profile = await queryClient.fetchQuery({
      queryKey: adminMeQueryKeys.profile(adminId),
      queryFn: fetchAdminMeProfile,
      staleTime: PROFILE_STALE_MS,
    })
    return resolveHomepageActionPermissions({
      resolved: true,
      roleCode: profile?.roleCode,
      permissions: profile?.permissions,
    }).pii
  } catch {
    return false
  }
}
