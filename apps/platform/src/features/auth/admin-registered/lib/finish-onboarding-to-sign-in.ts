import { logoutPortalSession } from '@/features/auth/session/portal-logout'

const SIGN_IN_PATH = '/auth/sign-in'

/**
 * 온보딩을 끝내고 로그인 화면으로 보낸다 — 의도적인 로그인 세션 종료이므로
 * 헤더·세션 경고 모달과 같은 공통 경로(서버 Logout + 로컬 토큰·캐시·Wizard 정리)를 쓴다.
 * StrictMode 이중 effect 호출은 `logoutPortalSession` single-flight가 흡수한다.
 */
export function finishAdminRegisteredOnboardingToSignIn() {
  void logoutPortalSession({ redirectTo: SIGN_IN_PATH })
}
