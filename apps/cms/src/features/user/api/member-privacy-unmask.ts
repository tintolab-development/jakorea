/**
 * 회원 관리(SCR_MEMBER) 개인정보 원문 조회 — 역할별 admin path
 */

import {
  unmaskAdminAccountPrivacyRemote,
  unmaskIndividualMemberPrivacyRemote,
  unmaskInstructorMemberPrivacyRemote,
  unmaskMemberPrivacyRemote,
} from '@/features/user/api/members-api-client'
import type { UserRole } from '@/types/user'
import {
  PrivacyUnmaskApiError,
} from '@/features/logs/api/privacy-unmask-fetcher'

function wrapPrivacyUnmaskError(err: unknown): never {
  if (err instanceof PrivacyUnmaskApiError) throw err
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { error?: { code?: string; message?: string }; message?: string } }
    }
    const data = axiosErr.response?.data
    const code = data?.error?.code ?? 'UNKNOWN'
    const message =
      data?.error?.message ??
      (typeof data?.message === 'string' ? data.message : '개인정보 원문 조회에 실패했습니다.')
    throw new PrivacyUnmaskApiError(String(code), message)
  }
  throw new PrivacyUnmaskApiError('NETWORK', '개인정보 원문 조회 요청에 실패했습니다.')
}

export async function fetchAdminAccountPrivacyUnmask(
  adminAccountId: number,
  reason: string
): Promise<unknown> {
  const body = { reason }
  try {
    return await unmaskAdminAccountPrivacyRemote(adminAccountId, body)
  } catch (err) {
    wrapPrivacyUnmaskError(err)
  }
}

export async function fetchMemberRolePrivacyUnmask(
  memberId: number,
  reason: string,
  role?: UserRole
): Promise<unknown> {
  const body = { reason }
  try {
    if (role === 'INSTRUCTOR') {
      return await unmaskInstructorMemberPrivacyRemote(memberId, body)
    }
    if (role === 'INDIVIDUAL') {
      return await unmaskIndividualMemberPrivacyRemote(memberId, body)
    }
    // SCHOOL 전용 path 없음 → legacy member unmask
    return await unmaskMemberPrivacyRemote(memberId, body)
  } catch (err) {
    wrapPrivacyUnmaskError(err)
  }
}
