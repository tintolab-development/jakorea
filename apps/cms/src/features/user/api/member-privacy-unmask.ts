/**
 * 회원 관리(SCR_MEMBER) 개인정보 원문 조회 — 역할별 admin path
 */

import {
  unmaskAdminAccountPrivacyRemote,
  unmaskIndividualMemberPrivacyRemote,
  unmaskInstructorMemberPrivacyRemote,
  unmaskInstructorRoleRequestPrivacyRemote,
  unmaskMemberPrivacyRemote,
} from '@/features/user/api/members-api-client'
import type { InstructorMemberProfile, UserRole } from '@/types/user'
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

export async function fetchInstructorRoleRequestPrivacyUnmask(
  requestId: number,
  reason: string
): Promise<unknown> {
  const body = { reason }
  try {
    return await unmaskInstructorRoleRequestPrivacyRemote(requestId, body)
  } catch (err) {
    wrapPrivacyUnmaskError(err)
  }
}

export type MemberPrivacyUnmaskOptions = {
  /**
   * INSTRUCTOR UI 프로필. 상세 GET과 동일하게 `school_teacher`면 instructor unmask를 쓰지 않는다.
   * (순수 교사는 강사 프로필이 없어 `INSTRUCTOR_PROFILE_NOT_FOUND`)
   */
  instructorMemberProfile?: InstructorMemberProfile | null
}

export async function fetchMemberRolePrivacyUnmask(
  memberId: number,
  reason: string,
  role?: UserRole,
  options?: MemberPrivacyUnmaskOptions
): Promise<unknown> {
  const body = { reason }
  try {
    if (role === 'INSTRUCTOR') {
      // 상세: GET …/teacher. OpenAPI에 …/teacher/privacy/unmask 없음 → legacy member unmask.
      if (options?.instructorMemberProfile === 'school_teacher') {
        return await unmaskMemberPrivacyRemote(memberId, body)
      }
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
