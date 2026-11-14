/**
 * 회원 사전등록(개인·강사) — 이름·생년월일·휴대폰이 같은, 탈퇴하지 않은 회원이 이미 있을 때 서버 409.
 * 서버 기본 message는 관리자 등록용 문구라, 화면은 코드 기준으로 아래 회원용 안내를 띄운다.
 * 응답에 field가 없으므로 특정 입력칸이 아닌 폼 전체 안내(알럿)로 보여 주고 입력값은 유지한다.
 */
import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { PRE_REGISTER_IDENTITY_DUPLICATE_CODE } from '@/shared/lib/screen-owned-api-errors'

/** TODO(기획 확인): 확정 문구 회신 전 제안안 — 확정되면 이 값만 바꾼다. */
export const PRE_REGISTER_IDENTITY_DUPLICATE_ALERT = {
  title: '안내',
  content: '이미 등록된 회원입니다.\n이름, 생년월일, 휴대폰 번호를 다시 확인해 주세요.',
} as const

export class MemberPreRegisterIdentityDuplicateError extends Error {
  readonly code = PRE_REGISTER_IDENTITY_DUPLICATE_CODE

  constructor() {
    super(PRE_REGISTER_IDENTITY_DUPLICATE_ALERT.content)
    this.name = 'MemberPreRegisterIdentityDuplicateError'
  }
}

export function isPreRegisterIdentityDuplicateApiError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false
  const response = (error as { response?: { status?: number; data?: unknown } }).response
  return extractApiErrorCode(response?.data) === PRE_REGISTER_IDENTITY_DUPLICATE_CODE
}

export function isMemberPreRegisterIdentityDuplicateError(
  error: unknown
): error is MemberPreRegisterIdentityDuplicateError {
  return error instanceof MemberPreRegisterIdentityDuplicateError
}
