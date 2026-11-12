/**
 * 홈페이지 Admin 화면 오류 수집 (QA-0183) — 전역 오류 포착 연결.
 *
 * - React `onCaughtError`: 전역 ErrorBoundary와 React Router 기본 오류 경계가 잡은 렌더 오류
 * - window `error`: 이벤트 핸들러 등에서 잡히지 않은 오류 (Error 객체가 있는 경우만)
 * 관리자 로그인 상태에서만 보낸다 (JAHOMEADMINBACK `POST /api/admin/logs/client-errors` → 204).
 * 실패(429 포함)는 알림 없이 버리고 재시도하지 않는다.
 */
import type { ErrorInfo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosInstance, type RetryableRequest } from '@/shared/instance/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  CLIENT_ERROR_REPORT_PATH,
  createClientErrorReporter,
} from '@/shared/lib/client-error-report'

function isAdminLoggedIn(): boolean {
  if (!isRemoteApiConfigured()) return false
  const { isAuthenticated, token } = useAuthStore.getState()
  return isAuthenticated && !!token
}

export const reportAdminClientError = createClientErrorReporter({
  appCode: 'ADMIN',
  isLoggedIn: isAdminLoggedIn,
  send: payload =>
    axiosInstance.post<unknown>(CLIENT_ERROR_REPORT_PATH, payload, {
      // 보고 실패가 토큰 갱신·로그아웃으로 이어지지 않게 한다
      skipRefresh: true,
    } as RetryableRequest),
})

/** `createRoot(..., { onCaughtError })` — 오류 경계가 잡은 렌더 오류 */
export function onAdminCaughtRenderError(error: unknown, errorInfo: ErrorInfo): void {
  reportAdminClientError(error, errorInfo.componentStack)
}

let windowListenerInstalled = false

/** 잡히지 않은 런타임 오류 — Error 객체가 없는 이벤트(리소스 로드·교차 출처 Script error 등)는 보내지 않는다 */
export function installAdminWindowErrorReporting(): void {
  if (windowListenerInstalled || typeof window === 'undefined') return
  windowListenerInstalled = true
  window.addEventListener('error', event => {
    if (event.error instanceof Error) reportAdminClientError(event.error)
  })
}
