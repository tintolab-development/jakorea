/**
 * POST /api/admin/auth/identity/confirm (BE R1)
 * 관리자 등록 계정 첫 로그인 — 비밀번호 변경 전 본인인증 확정. Bearer 필요(임시 비밀번호 상태 허용).
 */

import { axiosClient } from '@/shared/api'
import type {
  AdminIdentityConfirmRequest,
  AdminIdentityConfirmResponse,
} from '@/shared/api/generated/members/schemas'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

export type AdminIdentityConfirmResult =
  /** 확정 성공 또는 이미 확정됨(409 ADMIN_IDENTITY_ALREADY_VERIFIED) — 비밀번호 변경으로 진행 */
  | { kind: 'confirmed' }
  /** 400 ADMIN_IDENTITY_MISMATCH — 「본인인증 실패」 */
  | { kind: 'mismatch' }
  /** 409 ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER — 「인증 불가」 */
  | { kind: 'verified_by_other' }
  /** 409 IDENTITY_VERIFICATION_ALREADY_USED · 400 IDENTITY_VERIFICATION_REQUIRED · 401 — 본인인증부터 다시 */
  | { kind: 'reverify' }

const REVERIFY_CODES = new Set(['IDENTITY_VERIFICATION_ALREADY_USED', 'IDENTITY_VERIFICATION_REQUIRED'])

/** 분기는 error.code로만 한다. 그 밖의 오류는 던진다(호출부 공통 오류 처리) */
export function classifyAdminIdentityConfirmError(error: unknown): AdminIdentityConfirmResult | null {
  const code = getApiErrorCode(error)
  if (code === 'ADMIN_IDENTITY_ALREADY_VERIFIED') return { kind: 'confirmed' }
  if (code === 'ADMIN_IDENTITY_MISMATCH') return { kind: 'mismatch' }
  if (code === 'ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER') return { kind: 'verified_by_other' }
  if ((code && REVERIFY_CODES.has(code)) || getApiErrorHttpStatus(error) === 401) {
    return { kind: 'reverify' }
  }
  return null
}

export async function confirmAdminIdentity(
  body: AdminIdentityConfirmRequest
): Promise<AdminIdentityConfirmResult> {
  try {
    // 인증 계열 성공 응답은 최상위 JSON — 본문 값은 화면에 쓰지 않는다
    await axiosClient.post<AdminIdentityConfirmResponse>(adminAuthPaths.identityConfirm(), body, {
      skipGlobalErrorAlert: true,
    } as Parameters<typeof axiosClient.post>[2])
    return { kind: 'confirmed' }
  } catch (error) {
    const classified = classifyAdminIdentityConfirmError(error)
    if (classified) return classified
    throw error
  }
}
