/**
 * 실서버 관리자 로그인 — 경로는 `adminAuthPaths`, 클라이언트는 공통 axios 인스턴스만 사용.
 * mock 로그인(`entities/user/api/auth-service`)과 분리되어 있으며, 스토어·훅에서 실 API 분기 시 이 함수만 호출하면 됨.
 */

import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import type {
  AdminLoginApiResponse,
  AdminLoginMeta,
  AdminLoginRequestBody,
  AdminLoginSuccessData,
} from '@/features/auth/model/admin-login-api.types'

export type {
  AdminLoginApiResponse,
  AdminLoginRequestBody,
  AdminLoginSuccessData,
  AdminLoginErrorBody,
  AdminLoginMeta,
} from '@/features/auth/model/admin-login-api.types'

export class AdminLoginApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AdminLoginApiError'
    this.code = code
  }
}

export interface AdminLoginFetcherResult {
  data: AdminLoginSuccessData
  meta?: AdminLoginMeta
}

/**
 * 로그인 성공 시 `data`·`meta` 반환. HTTP 200이어도 `success: false`면 예외.
 * 액세스 토큰이 바디에 없고 쿠키만 내려오는 경우 axios 인스턴스의 `withCredentials`로 처리.
 */
export async function fetchAdminLogin(
  body: AdminLoginRequestBody
): Promise<AdminLoginFetcherResult> {
  const { data: payload } = await axiosClient.post<AdminLoginApiResponse>(
    adminAuthPaths.login(),
    body
  )

  if (payload.success && payload.data) {
    return { data: payload.data, meta: payload.meta }
  }

  const code = payload.error?.code ?? 'UNKNOWN'
  const message = payload.error?.message ?? '로그인에 실패했습니다.'
  throw new AdminLoginApiError(code, message)
}
