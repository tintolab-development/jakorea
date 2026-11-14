import {
  isAdminAuthForbiddenError,
  isAdminAuthUnauthorizedError,
  postAdminAuthActivity,
} from '@/features/auth/api/admin-session-fetcher'
import { notifyAdminActivityRecorded } from '@/features/auth/lib/admin-activity-signal'
import { endExpiredSession, shouldRefreshAccessToken, useAuthStore } from '@/features/auth/model/auth-store'
import { isSessionEndConfirmPending } from '@/features/auth/lib/session-ended-confirm'

/**
 * 전역 입력 Activity 전송. 이 탭의 access token이 만료됐거나 곧 만료되면 먼저 refresh한다.
 * 만료 점검 주기 사이나 절전 복귀 직후 만료된 토큰으로 보내면 Activity 401 → 재로그인이 되므로,
 * 핸드오프 계약이 허용하는 「Activity 전 선제 Refresh」로 막는다.
 * refresh가 성공하지 않으면 이번 Activity는 보내지 않고, 판정은 만료 점검·요청 401 처리에 맡긴다.
 */
export async function sendUserActivity(): Promise<void> {
  const initial = useAuthStore.getState()
  if (!initial.isAuthenticated || !initial.token) return
  // 세션 종료 안내가 떠 있는 동안에는 Activity를 보내지 않는다
  if (isSessionEndConfirmPending()) return
  if (initial.expiresAt &&
      shouldRefreshAccessToken(new Date(initial.expiresAt).getTime(), Date.now())) {
    if ((await initial.refreshSession()) !== 'ok') return
  }
  const ready = useAuthStore.getState()
  if (!ready.isAuthenticated || !ready.token) return
  const requestedToken = ready.token
  try {
    await postAdminAuthActivity()
    notifyAdminActivityRecorded()
  } catch (error) {
    const current = useAuthStore.getState()
    // A delayed 401 from the previous access token must not end a refreshed login.
    if (!current.isAuthenticated || current.token !== requestedToken) return
    if (isAdminAuthUnauthorizedError(error)) {
      // 지금 화면에서 「로그인이 종료되었어요.」를 띄우고 [확인] 때 로그아웃한다.
      endExpiredSession()
    } else if (isAdminAuthForbiddenError(error)) {
      // Permission/account-type mismatch is not token expiration.
      console.warn('[ADMIN_SESSION] Activity was denied (403); verify ADMIN JWT and sid.')
    }
  }
}
