/**
 * 수정 화면 진입 원문 조회(정책 CMS-06 회원·강사 정보 수정, CMS-29 신청 정보 수정).
 * 수정 진입 호출은 고정 사유로만 들어오므로, 그 사유일 때 `purpose: 'EDIT_MODE'`를 함께 보내
 * 서버가 쓰기 권한(MEMBER_WRITE / APPLICATION_WRITE)을 확인하고 감사 사유를 고정값으로 기록하게 한다.
 * 그 밖의 사유는 기존 사유 입력 열람 그대로다.
 */
export const MEMBER_EDIT_MODE_UNMASK_REASON = '회원 정보 수정'
export const APPLICATION_EDIT_MODE_UNMASK_REASON = '신청 정보 수정'

const EDIT_MODE_REASONS = new Set([MEMBER_EDIT_MODE_UNMASK_REASON, APPLICATION_EDIT_MODE_UNMASK_REASON])

export type PrivacyUnmaskBody = {
  reason: string
  programId?: number
  purpose?: 'EDIT_MODE'
}

export function privacyUnmaskBody(reason: string, programId?: number): PrivacyUnmaskBody {
  const trimmed = reason.trim()
  return {
    reason,
    ...(programId != null ? { programId } : {}),
    ...(EDIT_MODE_REASONS.has(trimmed) ? { purpose: 'EDIT_MODE' as const } : {}),
  }
}
