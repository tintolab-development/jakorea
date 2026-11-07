import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  parseAdminAuthActivityResponse,
  parseAdminAuthSessionResponse,
  type AdminAuthActivityResponse,
  type AdminAuthSessionResponse,
} from '@jakorea/domain/session'
import { axiosClient } from '@/shared/api/axios-instance'
import { PORTAL_SESSION_ACTIVITY_PATH, PORTAL_SESSION_STATUS_PATH } from './portal-session-contract'

/**
 * MEMBER 세션 응답은 ADMIN 세션과 동일한 bare JSON 스키마다.
 * 공통 파서(`@jakorea/domain/session`)를 재사용하되 타입은 MEMBER 별칭으로 노출한다.
 */
export type PortalMemberSessionResponse = AdminAuthSessionResponse
export type PortalMemberActivityResponse = AdminAuthActivityResponse

type PortalSessionRequestConfig = Partial<InternalAxiosRequestConfig> & {
  skipRefresh?: boolean
  skipAuth?: boolean
}

export class PortalSessionInvalidResponseError extends Error {
  constructor(what: 'session' | 'activity') {
    super(`Invalid portal member ${what} response`)
    this.name = 'PortalSessionInvalidResponseError'
  }
}

/**
 * POST /api/portal/auth/activity — 실제 사용자 활동 기록.
 * Bearer 유지(`skipAuth` 아님) + `skipRefresh`: 401이어도 Refresh·재POST 0회.
 * `updated=false`(BE 60초 억제)는 유휴 기한 갱신 확정이 아니다 — Session GET으로 확인한다.
 */
export async function postPortalMemberActivity(): Promise<PortalMemberActivityResponse> {
  const res = await axiosClient.post<unknown>(PORTAL_SESSION_ACTIVITY_PATH, undefined, {
    skipRefresh: true,
  } as PortalSessionRequestConfig)
  const parsed = parseAdminAuthActivityResponse(res.data)
  if (!parsed) throw new PortalSessionInvalidResponseError('activity')
  return parsed
}

/**
 * GET /api/portal/auth/session — 조회 전용(Activity·Refresh 회전 미발생).
 * 401은 Axios가 Access JWT 자체 만료일 때만 Refresh 1회 + 재조회 1회 처리한다.
 */
export async function getPortalMemberSession(
  signal?: AbortSignal,
): Promise<PortalMemberSessionResponse> {
  // 응답 캐시는 BE `Cache-Control: no-store`가 막는다. 요청 헤더 추가는 CORS preflight 허용 목록을 깨므로 하지 않는다.
  const res = await axiosClient.get<unknown>(PORTAL_SESSION_STATUS_PATH, { signal })
  const parsed = parseAdminAuthSessionResponse(res.data)
  if (!parsed) throw new PortalSessionInvalidResponseError('session')
  return parsed
}

function statusOf(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

/** 서버가 세션 무효를 확정 (누락·위조·sid 없음·폐기·만료) */
export function isPortalSessionUnauthorizedError(error: unknown): boolean {
  return statusOf(error) === 401
}

/** 잘못된 인증 영역(예: ADMIN JWT) — Refresh로 우회하지 않는다 */
export function isPortalSessionForbiddenError(error: unknown): boolean {
  return statusOf(error) === 403
}

/** 라우트 미배포·프록시 누락 */
export function isPortalSessionNotDeployedError(error: unknown): boolean {
  return statusOf(error) === 404
}

/** 네트워크·5xx — 인증 폐기의 증거가 아니다 */
export function isPortalSessionTransportError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status == null || status >= 500
}
