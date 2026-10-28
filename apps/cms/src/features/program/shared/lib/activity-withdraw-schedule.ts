/** 활동 포기 모달 — 교육 일정 선택 옵션 (참여 기관·봉사자·강사 등 공통) */
export interface ActivityWithdrawScheduleOption {
  value: string
  label: string
}

export interface ActivityWithdrawScheduleConfirmPayload {
  stopSessionKey: string
  stopScheduleLabel: string
}

export type ActivityWithdrawGuideSubjectKind = 'person' | 'institution'

const ACTIVITY_WITHDRAW_GUIDE_BODY =
  '포기 시 재참여가 불가하며, 선택한 교육 일정 이전의 활동까지만 실적에 반영됩니다.\n활동 포기 처리 후에는 되돌릴 수 없습니다.'

/** 활동 포기 안내 본문 — 사람 `[이름] 님의` / 기관 `[기관명]의` (`[**이름**]` = ContentModal 볼드) */
export function buildActivityWithdrawGuideDescription(
  subjectName: string,
  kind: ActivityWithdrawGuideSubjectKind
): string {
  const name = subjectName.trim() || (kind === 'institution' ? '기관' : '신청자')
  const bracketed = `[**${name}**]`
  const subject = kind === 'institution' ? `${bracketed}의` : `${bracketed} 님의`
  return `${subject} 프로그램 활동을 포기 처리하시겠습니까?\n${ACTIVITY_WITHDRAW_GUIDE_BODY}`
}

export function buildActivityWithdrawGeneratedReason(stopScheduleLabel: string): string {
  const label = stopScheduleLabel.trim()
  return label ? `활동 포기 (${label})` : '활동 포기'
}
