import { isAxiosError } from 'axios'
import { getSignupApiErrorMessage } from './get-signup-api-error-message.ts'

/** 서버 오류 본문 `error.{code, field, message}` */
export type SignupApiErrorDetail = {
  httpStatus?: number
  code: string
  field: string
  message: string
}

export function readSignupApiErrorDetail(error: unknown): SignupApiErrorDetail | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  const httpStatus = error.response?.status
  if (!data || typeof data !== 'object') {
    return httpStatus != null ? { httpStatus, code: '', field: '', message: '' } : null
  }
  const nested = (data as { error?: { code?: unknown; field?: unknown; message?: unknown } }).error
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  return {
    httpStatus,
    code: text(nested?.code).toUpperCase(),
    field: text(nested?.field),
    message: text(nested?.message),
  }
}

/** 가입 단계 안에서 입력칸에 서버 message를 붙일 수 있는 항목 */
export type SignupFieldErrorKey =
  | 'email'
  | 'password'
  | 'birthDate'
  | 'gender'
  | 'name'
  | 'address'
  | 'grade'

export type SignupSubmitErrorResolution =
  /** 입력칸이 있는 단계로 돌아가 그 칸에 서버 message를 표시 */
  | { kind: 'field'; step: number; field: SignupFieldErrorKey; message: string }
  /** 본인인증 단계로 돌아가 다시 진행 */
  | { kind: 'restart-identity'; message: string }
  /** 이미 가입된 회원 — 「중복 가입 시」 팝업 */
  | { kind: 'duplicate-member' }
  /** 확인 화면 하단 문구(기존 동작) */
  | { kind: 'confirmation'; message: string }

/** 입력칸 단계로 돌려보내는 코드 (PB2). 그 밖의 코드는 기존 동작을 유지한다. */
const FIELD_ROUTED_CODES = new Set([
  'SIGNUP_PASSWORD_POLICY_VIOLATION',
  'SIGNUP_INVALID_REQUEST',
  'BIRTH_DATE_REQUIRED',
  'IDENTITY_BIRTH_DATE_MISMATCH',
])

export const SIGNUP_IDENTITY_RESTART_CODES = new Set([
  'IDENTITY_VERIFICATION_REQUIRED',
  'IDENTITY_VERIFICATION_ALREADY_USED',
  'IDENTITY_VERIFICATION_SESSION_REQUIRED',
])

/** 최종 가입 409 — 사전 검사를 지나친 경우의 방어 (PB3) */
const DUPLICATE_MEMBER_CODES = new Set(['PHONE_ALREADY_REGISTERED', 'IDENTITY_ALREADY_LINKED'])

export type SignupSubmitErrorContext = {
  memberType: 'general' | 'teacher' | null
  isUnderAgeSignup: boolean
}

/** 서버 field → 가입 단계·입력칸. 그 단계에 입력칸이 없으면 null(확인 화면 표시). */
export function resolveSignupFieldStep(
  serverField: string,
  context: SignupSubmitErrorContext,
): { step: number; field: SignupFieldErrorKey } | null {
  switch (serverField) {
    case 'email':
      return { step: 4, field: 'email' }
    case 'password':
      return { step: 5, field: 'password' }
    case 'birthDate':
      return { step: 2, field: 'birthDate' }
    case 'gender':
      return { step: 2, field: 'gender' }
    case 'name':
      // 14세 이상 회원 이름은 본인인증 값이라 고칠 칸이 없다
      return context.isUnderAgeSignup ? { step: 6, field: 'name' } : null
    case 'postalCode':
    case 'address':
      // 교사회원 정보 입력에는 자택 주소 칸이 없다
      return context.memberType === 'teacher' ? null : { step: 6, field: 'address' }
    case 'grade':
      return context.memberType === 'teacher' ? null : { step: 6, field: 'grade' }
    default:
      return null
  }
}

export function resolveSignupSubmitError(
  error: unknown,
  context: SignupSubmitErrorContext,
  fallback: string,
): SignupSubmitErrorResolution {
  const detail = readSignupApiErrorDetail(error)
  const legacyMessage = () => getSignupApiErrorMessage(error, fallback)
  if (!detail?.code) {
    return { kind: 'confirmation', message: legacyMessage() }
  }

  if (DUPLICATE_MEMBER_CODES.has(detail.code)) {
    return { kind: 'duplicate-member' }
  }

  if (SIGNUP_IDENTITY_RESTART_CODES.has(detail.code)) {
    return { kind: 'restart-identity', message: detail.message || legacyMessage() }
  }

  if (FIELD_ROUTED_CODES.has(detail.code)) {
    const message = detail.message || legacyMessage()
    const target = resolveSignupFieldStep(detail.field, context)
    if (target) {
      return { kind: 'field', ...target, message }
    }
    return { kind: 'confirmation', message }
  }

  return { kind: 'confirmation', message: legacyMessage() }
}
