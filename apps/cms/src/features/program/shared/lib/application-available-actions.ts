/**
 * 프로그램 신청 상세/목록 — BE `availableActions` 기반 CTA 게이트.
 * `undefined`는 레거시(목록 투영 누락) 호환으로 허용한다.
 */
export function canPerformApplicationAction(
  availableActions: string[] | undefined,
  action: string
): boolean {
  if (availableActions == null) return true
  return availableActions.includes(action)
}
