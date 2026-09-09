/** UJAT 봉사자 신청 — 제출 확인 MC 라벨의 `N기`를 모집 활동 기수로 치환 */
export function resolveUjatVolunteerSubmitConfirmationItemLabel(
  label: string,
  cohort: string | undefined
): string {
  const trimmed = cohort?.trim()
  if (!trimmed) return label
  return label.replace(/\bN기\b/, `${trimmed}기`)
}
