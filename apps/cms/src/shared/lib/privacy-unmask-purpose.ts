/**
 * 원문 조회(unmask) 요청 본문.
 *
 * 수정 화면 진입 원문 조회(정책 CMS-06 회원·강사 정보 수정, CMS-29 신청 정보 수정)는 호출부가
 * `purpose: 'EDIT_MODE'`를 **명시적으로** 넘길 때만 붙는다. 서버는 이때 쓰기 권한(MEMBER_WRITE /
 * APPLICATION_WRITE)을 확인하고 감사 사유를 고정값으로 기록한다.
 *
 * 사유 문자열로 목적을 추론하지 않는다. 수동 「개인정보 상세보기」에서 사유를 '회원 정보 수정'이라고
 * 입력해도 수동 열람이다.
 */
export const MEMBER_EDIT_MODE_UNMASK_REASON = '회원 정보 수정'
export const APPLICATION_EDIT_MODE_UNMASK_REASON = '신청 정보 수정'

export type PrivacyUnmaskPurpose = 'EDIT_MODE'

/** 수정 진입 흐름에서만 `{ purpose: 'EDIT_MODE' }`를 넘긴다. 수동 열람은 생략한다. */
export type PrivacyRevealOptions = {
  purpose?: PrivacyUnmaskPurpose
}

export const EDIT_MODE_REVEAL: Readonly<PrivacyRevealOptions> = Object.freeze({
  purpose: 'EDIT_MODE' as const,
})

export type PrivacyUnmaskBody = {
  reason: string
  programId?: number
  purpose?: PrivacyUnmaskPurpose
}

export function privacyUnmaskBody(
  reason: string,
  options: { programId?: number; purpose?: PrivacyUnmaskPurpose } = {}
): PrivacyUnmaskBody {
  return {
    reason,
    ...(options.programId != null ? { programId: options.programId } : {}),
    ...(options.purpose === 'EDIT_MODE' ? { purpose: 'EDIT_MODE' as const } : {}),
  }
}
