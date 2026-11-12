/**
 * CMS 화면 오류 수집 (QA-0183) — 전역 오류 포착 연결.
 *
 * - React `onCaughtError`: 전역 ErrorBoundary와 React Router 기본 오류 경계가 잡은 렌더 오류
 * - window `error`: 이벤트 핸들러 등에서 잡히지 않은 오류 (Error 객체가 있는 경우만)
 * 관리자 로그인 상태(Program Viewer 포함)에서만 보낸다. 실패는 알림 없이 버린다.
 */
import type { ErrorInfo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { customInstance } from '@/shared/api/orval-mutator'
import type { ClientErrorReportRequest } from '@/shared/api/generated/logs/schemas'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  CLIENT_ERROR_REPORT_PATH,
  createClientErrorReporter,
} from '@/shared/lib/client-error-report'

const MOCK_TOKEN_PREFIX = 'mock-jwt-token-'

function isCmsAdminLoggedIn(): boolean {
  if (!isRemoteApiConfigured()) return false
  const { isAuthenticated, token } = useAuthStore.getState()
  return isAuthenticated && !!token && !token.startsWith(MOCK_TOKEN_PREFIX)
}

export const reportCmsClientError = createClientErrorReporter({
  appCode: 'CMS',
  isLoggedIn: isCmsAdminLoggedIn,
  send: payload =>
    customInstance<unknown>(
      {
        url: CLIENT_ERROR_REPORT_PATH,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: payload satisfies ClientErrorReportRequest,
      },
      // 보고 실패가 전역 알림·토큰 갱신·로그아웃으로 이어지지 않게 한다
      { skipGlobalErrorAlert: true, skipRefresh: true }
    ),
})

/** `createRoot(..., { onCaughtError })` — 오류 경계가 잡은 렌더 오류 */
export function onCmsCaughtRenderError(error: unknown, errorInfo: ErrorInfo): void {
  reportCmsClientError(error, errorInfo.componentStack)
}

let windowListenerInstalled = false

/** 잡히지 않은 런타임 오류 — Error 객체가 없는 이벤트(리소스 로드·교차 출처 Script error 등)는 보내지 않는다 */
export function installCmsWindowErrorReporting(): void {
  if (windowListenerInstalled || typeof window === 'undefined') return
  windowListenerInstalled = true
  window.addEventListener('error', event => {
    if (event.error instanceof Error) reportCmsClientError(event.error)
  })
}
