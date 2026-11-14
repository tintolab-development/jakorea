/**
 * 내 정보 확인(GNB) > 본인인증 재인증 — `PATCH /api/admin/me/identity-contact`
 *
 * 정책(기획 답변 2026-11-14): 재인증해도 이름·성별·생년월일은 유지하고 휴대폰 번호만 바꾼다.
 * 재인증 결과의 이름·성별·생년월일이 가입 정보와 다르면 서버가 400 `IDENTITY_VERIFICATION_*_MISMATCH`로 거절한다.
 * 휴대폰 번호 등 개인정보는 로그·콘솔에 남기지 않는다.
 */

import type { IdentityChallengeCompleteResult } from '@jakorea/identity-verification'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { isIdentityVerificationRemoteEnabled } from '@/features/auth/api/identity-verification-remote-capabilities'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { axiosClient } from '@/shared/api'
import type { AdminIdentityContactResponse } from '@/shared/api/generated/members/schemas/adminIdentityContactResponse'
import type { AdminIdentityContactUpdateRequest } from '@/shared/api/generated/members/schemas/adminIdentityContactUpdateRequest'
import { adminMeIdentityContactPath } from '@/shared/config/api-paths'
import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'

export const IDENTITY_REVERIFY_SUCCESS_ALERT = {
  title: '인증 완료',
  content: '본인인증 재인증이 완료되었습니다.',
} as const

export const IDENTITY_REVERIFY_FAILURE_ALERT_TITLE = '본인인증 실패'

/** 이름·생년월일·성별이 가입 정보와 다를 때 서버 거절 코드 */
export const IDENTITY_CONTACT_MISMATCH_CODES: ReadonlySet<string> = new Set([
  'IDENTITY_VERIFICATION_NAME_MISMATCH',
  'IDENTITY_VERIFICATION_BIRTH_DATE_MISMATCH',
  'IDENTITY_VERIFICATION_GENDER_MISMATCH',
])

export async function updateAdminIdentityContact(
  body: AdminIdentityContactUpdateRequest
): Promise<AdminIdentityContactResponse> {
  const { data: payload } = await axiosClient.patch<unknown>(adminMeIdentityContactPath(), body)
  return unwrapApiBody<AdminIdentityContactResponse>(payload)
}

export function getIdentityContactMismatchCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  const code = extractApiErrorCode(data)
  return code && IDENTITY_CONTACT_MISMATCH_CODES.has(code) ? code : null
}

type AlertOptions = { title: string; content: string }

export type CompleteAdminIdentityReverificationDeps = {
  /** 세션 사용자 갱신 — 휴대폰 번호만 넘긴다 */
  updateUser: (patch: { phone: string }) => void
  showAlert: (options: AlertOptions) => void
  /** 기본: 본인인증 실 API 모드 여부 */
  isRemoteEnabled?: () => boolean
  /** 기본: `updateAdminIdentityContact` */
  updateContact?: (body: AdminIdentityContactUpdateRequest) => Promise<AdminIdentityContactResponse>
}

/**
 * 재인증 성공 콜백 처리.
 * - 실 API: 서버에 반영 → 응답 휴대폰 번호로 세션 갱신 → 「인증 완료」. 이름·성별·생년월일은 갱신하지 않는다.
 * - MISMATCH: 「본인인증 실패」(서버 문구) — 휴대폰 번호 유지.
 * - 그 밖의 오류: 전역 알럿이 이미 떴으면 그대로, 아니면 모달 공통 형태로 안내.
 * - 목업 모드(본인인증 실 API 미사용): 세션 id·토큰이 목 값이라 서버를 부르지 않고 기존처럼 화면 값만 바꾼다.
 */
export async function completeAdminIdentityReverification(
  result: IdentityChallengeCompleteResult,
  deps: CompleteAdminIdentityReverificationDeps
): Promise<void> {
  const isRemote = (deps.isRemoteEnabled ?? isIdentityVerificationRemoteEnabled)()

  if (!isRemote) {
    const mockPhone = result.verifiedPhone?.trim()
    if (mockPhone) deps.updateUser({ phone: mockPhone })
    deps.showAlert({ ...IDENTITY_REVERIFY_SUCCESS_ALERT })
    return
  }

  const updateContact = deps.updateContact ?? updateAdminIdentityContact
  try {
    const response = await updateContact({
      identityVerificationSessionId: result.sessionId,
      profileToken: result.profileToken,
    })
    const nextPhone = response.phone?.trim() || response.maskedPhone?.trim()
    if (nextPhone) deps.updateUser({ phone: nextPhone })
    deps.showAlert({ ...IDENTITY_REVERIFY_SUCCESS_ALERT })
  } catch (error) {
    if (getIdentityContactMismatchCode(error)) {
      deps.showAlert({
        title: IDENTITY_REVERIFY_FAILURE_ALERT_TITLE,
        content: getMemberApiErrorMessage(error, '본인인증 정보가 가입 정보와 일치하지 않습니다.'),
      })
      return
    }
    if (isGlobalApiErrorAlertShown(error)) return
    deps.showAlert({
      title: '안내',
      content: getMemberApiErrorMessage(error, '본인인증 재인증 정보를 저장하지 못했습니다.'),
    })
  }
}
