/**
 * 참여자 유형이 꺼져 KPI 필드가 「해당 없음」(disabled)이 되면 작성값을 비운다.
 * 예: 봉사자 체크 해제 → 교육진행자 최종 인원(봉사자) 리셋
 */
export function resolveKpiFieldValueForParticipantAvailability(
  disabled: boolean,
  value: number | null
): number | null {
  return disabled ? null : value
}
