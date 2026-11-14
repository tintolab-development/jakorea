import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { resolveSignupSubmitError, type SignupSubmitErrorContext } from './resolve-signup-submit-error.ts'

function axiosErr(status: number, data: unknown) {
  return new AxiosError(`Request failed with status code ${status}`, undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

const fallback = '가입에 실패했어요.'
const general = { memberType: 'general' as const, isUnderAgeSignup: false }
const teacher = { memberType: 'teacher' as const, isUnderAgeSignup: false }
const minor = { memberType: 'general' as const, isUnderAgeSignup: true }

// 비밀번호 정책 위반 → 비밀번호 단계·칸, 서버 message
assert.deepEqual(
  resolveSignupSubmitError(
    axiosErr(400, {
      error: { code: 'SIGNUP_PASSWORD_POLICY_VIOLATION', field: 'password', message: '서버 비밀번호 문구' },
    }),
    general,
    fallback,
  ),
  { kind: 'field', step: 5, field: 'password', message: '서버 비밀번호 문구' },
)

// 빠진 항목 → 항목별 단계
const invalid = (field: string, ctx: SignupSubmitErrorContext = general) =>
  resolveSignupSubmitError(
    axiosErr(400, { error: { code: 'SIGNUP_INVALID_REQUEST', field, message: `${field} 누락` } }),
    ctx,
    fallback,
  )
assert.deepEqual(invalid('email'), { kind: 'field', step: 4, field: 'email', message: 'email 누락' })
assert.deepEqual(invalid('gender'), { kind: 'field', step: 2, field: 'gender', message: 'gender 누락' })
assert.deepEqual(invalid('postalCode'), { kind: 'field', step: 6, field: 'address', message: 'postalCode 누락' })
assert.deepEqual(invalid('address'), { kind: 'field', step: 6, field: 'address', message: 'address 누락' })
assert.deepEqual(invalid('grade'), { kind: 'field', step: 6, field: 'grade', message: 'grade 누락' })
// 단계 이동이 어려운 항목 → 확인 화면
assert.deepEqual(invalid('member'), { kind: 'confirmation', message: 'member 누락' })
assert.deepEqual(invalid('name'), { kind: 'confirmation', message: 'name 누락' })
assert.deepEqual(invalid('name', minor), { kind: 'field', step: 6, field: 'name', message: 'name 누락' })
assert.deepEqual(invalid('address', teacher), { kind: 'confirmation', message: 'address 누락' })

// 생년월일
assert.deepEqual(
  resolveSignupSubmitError(
    axiosErr(400, { error: { code: 'IDENTITY_BIRTH_DATE_MISMATCH', field: 'birthDate', message: '불일치' } }),
    general,
    fallback,
  ),
  { kind: 'field', step: 2, field: 'birthDate', message: '불일치' },
)

// 본인인증 계열 → 본인인증부터
for (const code of [
  'IDENTITY_VERIFICATION_REQUIRED',
  'IDENTITY_VERIFICATION_ALREADY_USED',
  'IDENTITY_VERIFICATION_SESSION_REQUIRED',
]) {
  assert.deepEqual(
    resolveSignupSubmitError(
      axiosErr(400, { error: { code, field: 'identityVerificationSessionId', message: '다시 인증' } }),
      general,
      fallback,
    ),
    { kind: 'restart-identity', message: '다시 인증' },
  )
}

// 409 중복 가입 → 팝업
for (const code of ['PHONE_ALREADY_REGISTERED', 'IDENTITY_ALREADY_LINKED']) {
  assert.deepEqual(
    resolveSignupSubmitError(axiosErr(409, { error: { code, message: 'x' } }), general, fallback),
    { kind: 'duplicate-member' },
  )
}

// 기존 코드는 기존처럼 확인 화면에 서버 message
assert.deepEqual(
  resolveSignupSubmitError(
    axiosErr(409, { error: { code: 'MEMBER_EMAIL_DUPLICATED', field: 'email', message: '이미 쓰는 이메일' } }),
    general,
    fallback,
  ),
  { kind: 'confirmation', message: '이미 쓰는 이메일' },
)
assert.deepEqual(
  resolveSignupSubmitError(
    axiosErr(400, { error: { code: 'GENDER_INVALID', field: 'gender', message: '성별 오류' } }),
    general,
    fallback,
  ),
  { kind: 'confirmation', message: '성별 오류' },
)
// 본문 없는 오류 → fallback
assert.deepEqual(resolveSignupSubmitError(axiosErr(502, ''), general, fallback), {
  kind: 'confirmation',
  message: fallback,
})

console.log('resolve-signup-submit-error.selfcheck: ok')
