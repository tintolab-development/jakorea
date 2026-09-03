import type { AxiosError } from 'axios'
import {
  ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  ADMIN_ACCESS_DENIED_ALERT_TITLE,
} from '@/shared/lib/admin-role-policy'
import {
  extractApiErrorMessage,
  formatApiErrorAlertContent,
} from '@/shared/lib/extract-api-error-message'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { isAdminFirstLoginOnboardingIncomplete } from '@/shared/utils/post-auth-redirect'

const DEDUPE_MS = 2_000
/** BE 다운 시 병렬 쿼리가 동일 「네트워크 오류」Alert를 연쇄로 띄우지 않도록 */
const NETWORK_DEDUPE_MS = 8_000
const recentAlertKeys = new Map<string, number>()

/** 권한 안내 모달이 열려 있는 동안 추가 403 show를 막는다. 닫히면 해제. */
let forbiddenAlertVisible = false

export type GlobalApiErrorAlertRequestConfig = {
  skipGlobalErrorAlert?: boolean
  skipRefresh?: boolean
  skipAuth?: boolean
  _retry?: boolean
  method?: string
  url?: string
}

declare module 'axios' {
  export interface AxiosError {
    /** axios 글로벌 에러 Alert가 이미 노출됐는지 (catch에서 중복 Alert 방지) */
    __cmsGlobalErrorAlertShown?: boolean
  }
}

function isGlobalErrorAlertEnabled(): boolean {
  return import.meta.env.VITE_API_GLOBAL_ERROR_ALERT !== '0'
}

function resolveAlertTitle(httpStatus: number | null | undefined): string {
  if (httpStatus == null) return '네트워크 오류'
  if (httpStatus === 400) return '요청 오류'
  if (httpStatus === 404) return '찾을 수 없음'
  if (httpStatus === 409) return '처리 불가'
  if (httpStatus >= 500) return '서버 오류'
  return '요청 실패'
}

function shouldSkipGlobalErrorAlert(
  error: AxiosError,
  config?: GlobalApiErrorAlertRequestConfig
): boolean {
  if (!isGlobalErrorAlertEnabled()) return true
  if (config?.skipGlobalErrorAlert) return true
  if (error.__cmsGlobalErrorAlertShown) return true

  const status = error.response?.status
  const data = error.response?.data
  const code =
    data && typeof data === 'object' && 'error' in data
      ? (data as { error?: { code?: string } }).error?.code
      : undefined

  // access token 만료 → refresh 시도 구간 (최초 401)은 Alert 생략
  if (
    status === 401 &&
    (code === 'UNAUTHORIZED' ||
      code === 'TOKEN_EXPIRED' ||
      code === 'ACCESS_TOKEN_EXPIRED') &&
    !config?._retry
  ) {
    return true
  }

  return false
}

function dedupeKey(method: string, url: string, message: string, httpStatus: number | null): string {
  // 응답 없음(다운/CORS/타임아웃)은 URL별이 아니라 한 버킷으로 묶어 폭주 방지
  if (httpStatus == null) return `NETWORK:${message}`
  return `${method}:${url}:${message}`
}

function shouldDedupe(key: string, windowMs: number): boolean {
  const now = Date.now()
  const last = recentAlertKeys.get(key)
  if (last != null && now - last < windowMs) return true
  recentAlertKeys.set(key, now)
  return false
}

export function isGlobalApiErrorAlertShown(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      '__cmsGlobalErrorAlertShown' in error &&
      (error as AxiosError).__cmsGlobalErrorAlertShown
  )
}

/** 권한 안내 모달을 닫은 뒤 다음 403을 다시 띄울 수 있게 한다. */
export function clearForbiddenApiErrorAlertDedupe(): void {
  forbiddenAlertVisible = false
}

function markGlobalErrorAlertShown(error: AxiosError): void {
  error.__cmsGlobalErrorAlertShown = true
}

function showForbiddenAccessDeniedAlert(error: AxiosError): boolean {
  markGlobalErrorAlertShown(error)
  if (forbiddenAlertVisible) return false
  forbiddenAlertVisible = true
  cmsAlertModal.show({
    title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
    content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  })
  return true
}

/**
 * axios 응답 인터셉터 등 React 밖에서 공통 AlertModal을 띄웁니다.
 * @returns Alert를 표시했으면 true
 */
export function showGlobalApiErrorAlert(
  error: AxiosError,
  config?: GlobalApiErrorAlertRequestConfig
): boolean {
  if (shouldSkipGlobalErrorAlert(error, config)) return false

  const httpStatus = error.response?.status ?? null
  if (httpStatus === 403) {
    if (isAdminFirstLoginOnboardingIncomplete()) {
      markGlobalErrorAlertShown(error)
      return false
    }
    return showForbiddenAccessDeniedAlert(error)
  }

  const method = (config?.method ?? error.config?.method ?? 'GET').toUpperCase()
  const url = config?.url ?? error.config?.url ?? ''

  const content =
    error.response != null
      ? formatApiErrorAlertContent(error.response.data, { httpStatus })
      : extractApiErrorMessage(undefined, {
          httpStatus: null,
          fallback: error.message?.trim() || '서버에 연결할 수 없습니다.',
        })

  const key = dedupeKey(method, url, content, httpStatus)
  const windowMs = httpStatus == null ? NETWORK_DEDUPE_MS : DEDUPE_MS
  if (shouldDedupe(key, windowMs)) return false

  cmsAlertModal.show({
    title: resolveAlertTitle(httpStatus),
    content,
  })

  markGlobalErrorAlertShown(error)
  return true
}
