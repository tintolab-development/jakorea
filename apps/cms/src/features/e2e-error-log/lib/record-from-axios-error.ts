/**
 * Axios 에러 → E2E Mock 로그 기록.
 * axios-instance 응답 인터셉터에서 호출합니다 (실 API 실패만).
 *
 * NETWORK_ERROR / 타임아웃은 BE 무응답 시 대시보드 위젯이 한꺼번에 실패해
 * 로그가 도배되므로, 쿨다운 동안 1건만 남기고 억제합니다.
 */

import type { AxiosError } from 'axios'
import { createE2eErrorLogSync } from '@/features/e2e-error-log/api/e2e-error-log-mock-api'
import { getCurrentRouteContext } from '@/features/e2e-error-log/lib/describe-situation'

const PREVIEW_MAX = 800
/** 네트워크/타임아웃 버스트 — 이 구간 안 추가 NETWORK_ERROR 는 버림 */
const NETWORK_ERROR_COOLDOWN_MS = 60_000

let networkBurstUntil = 0
let networkBurstSuppressed = 0

function shouldRecordE2eErrors(): boolean {
  if (typeof window === 'undefined') return false
  if (import.meta.env.DEV) return true
  try {
    return window.localStorage.getItem('cms.e2eErrorLog.enabled') === '1'
  } catch {
    return false
  }
}

function truncate(value: string, max = PREVIEW_MAX): string {
  if (value.length <= max) return value
  return `${value.slice(0, max)}…`
}

function safeJsonPreview(value: unknown): string | undefined {
  if (value == null) return undefined
  try {
    if (typeof value === 'string') return truncate(value)
    return truncate(JSON.stringify(value))
  } catch {
    return undefined
  }
}

function extractErrorMeta(data: unknown): {
  errorCode: string
  message: string
  traceId?: string
} {
  if (!data || typeof data !== 'object') {
    return { errorCode: 'UNKNOWN', message: String(data ?? '') }
  }
  const body = data as Record<string, unknown>
  const nested =
    body.error && typeof body.error === 'object'
      ? (body.error as Record<string, unknown>)
      : undefined

  const codeRaw = nested?.code ?? body.code
  const errorCode =
    codeRaw != null && String(codeRaw).trim() !== '' ? String(codeRaw) : 'UNKNOWN'

  const messageRaw = nested?.message ?? body.message
  const message =
    typeof messageRaw === 'string' && messageRaw.trim()
      ? messageRaw
      : errorCode !== 'UNKNOWN'
        ? errorCode
        : 'backend error'

  const traceRaw = nested?.traceId ?? body.traceId
  const traceId = typeof traceRaw === 'string' && traceRaw ? traceRaw : undefined

  return { errorCode, message, traceId }
}

function resolveRequestPath(url: string | undefined, baseURL?: string): string {
  if (!url) return '(unknown)'
  try {
    if (url.startsWith('http')) {
      const u = new URL(url)
      return `${u.pathname}${u.search}`
    }
    if (baseURL && baseURL.startsWith('http')) {
      const u = new URL(url, baseURL)
      return `${u.pathname}${u.search}`
    }
  } catch {
    // fall through
  }
  return url
}

function isNetworkTimeoutError(error: AxiosError, errorCode: string): boolean {
  if (errorCode === 'NETWORK_ERROR') return true
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') return true
  const msg = (error.message || '').toLowerCase()
  return msg.includes('timeout') || msg.includes('network error')
}

/**
 * 백엔드 HTTP 에러를 Mock API에 동기 기록합니다.
 * 실패해도 원본 API 에러 전파를 막지 않습니다.
 */
export function recordBackendErrorForE2e(error: AxiosError): void {
  if (!shouldRecordE2eErrors()) return

  try {
    const { response, config, message: axiosMessage } = error
    const { situation, route } = getCurrentRouteContext()
    const method = (config?.method ?? 'GET').toUpperCase()
    const requestPath = resolveRequestPath(config?.url, config?.baseURL)
    const httpStatus = response?.status ?? null
    const { errorCode, message, traceId } = response
      ? extractErrorMeta(response.data)
      : {
          errorCode: 'NETWORK_ERROR',
          message: axiosMessage || 'network error',
          traceId: undefined,
        }

    const finalCode =
      errorCode === 'UNKNOWN' && httpStatus != null ? `HTTP_${httpStatus}` : errorCode

    if (isNetworkTimeoutError(error, finalCode)) {
      const now = Date.now()
      if (now < networkBurstUntil) {
        networkBurstSuppressed += 1
        return
      }
      networkBurstUntil = now + NETWORK_ERROR_COOLDOWN_MS
      const suppressedNote =
        networkBurstSuppressed > 0
          ? ` (직전 쿨다운 중 ${networkBurstSuppressed}건 억제됨)`
          : ''
      networkBurstSuppressed = 0

      createE2eErrorLogSync({
        situation: `백엔드 무응답(타임아웃 버스트)${suppressedNote}`,
        route,
        method,
        requestPath,
        httpStatus: null,
        errorCode: 'NETWORK_ERROR',
        message: `${message} — 동일 원인으로 ${NETWORK_ERROR_COOLDOWN_MS / 1000}초간 추가 타임아웃 로그는 생략합니다. BE/ngrok 상태를 확인하세요.`,
        traceId: undefined,
        requestBodyPreview: safeJsonPreview(config?.data),
      })
      return
    }

    createE2eErrorLogSync({
      situation,
      route,
      method,
      requestPath,
      httpStatus,
      errorCode: finalCode,
      message,
      traceId,
      requestBodyPreview: safeJsonPreview(config?.data),
      responseBodyPreview: safeJsonPreview(response?.data),
    })
  } catch {
    // 로깅 실패는 무시
  }
}
