/**
 * 관리자 등록·회원 사전등록(개인·강사) — 이름·생년월일·휴대폰이 같은, 탈퇴하지 않은 회원이 이미 있을 때 서버 409.
 * 서버 기본 message는 관리자용 문구라, 화면은 코드 기준으로 「회원 정보 중복 안내」를 띄운다
 * (`@/features/user/shared/lib/identity-already-registered-alert`).
 * 응답에 field가 없으므로 특정 입력칸이 아닌 폼 전체 안내(알럿)로 보여 주고 입력값은 유지한다.
 */
import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'
import {
  ADMIN_IDENTITY_ALREADY_REGISTERED_CODE,
  PRE_REGISTER_IDENTITY_DUPLICATE_CODE,
} from '@/shared/lib/screen-owned-api-errors'

export type IdentityAlreadyRegisteredScope = 'admin' | 'pre-register'

export class IdentityAlreadyRegisteredError extends Error {
  readonly scope: IdentityAlreadyRegisteredScope

  constructor(scope: IdentityAlreadyRegisteredScope) {
    super('IDENTITY_ALREADY_REGISTERED')
    this.name = 'IdentityAlreadyRegisteredError'
    this.scope = scope
  }
}

function readApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const response = (error as { response?: { data?: unknown } }).response
  return extractApiErrorCode(response?.data)
}

/** 관리자 등록 `POST /api/admin/admin-accounts` 409 */
export function isAdminIdentityAlreadyRegisteredApiError(error: unknown): boolean {
  return readApiErrorCode(error) === ADMIN_IDENTITY_ALREADY_REGISTERED_CODE
}

/** 회원 사전등록 `POST /api/admin/users/pre-register/{individual|instructor}` 409 */
export function isPreRegisterIdentityDuplicateApiError(error: unknown): boolean {
  return readApiErrorCode(error) === PRE_REGISTER_IDENTITY_DUPLICATE_CODE
}

export function isIdentityAlreadyRegisteredError(
  error: unknown
): error is IdentityAlreadyRegisteredError {
  return error instanceof IdentityAlreadyRegisteredError
}
