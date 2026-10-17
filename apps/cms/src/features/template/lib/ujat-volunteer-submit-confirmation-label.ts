/** UJAT 봉사자 신청 — 제출 확인 MC 라벨의 `N기`를 모집 활동 기수로 치환 */
export function resolveUjatVolunteerSubmitConfirmationItemLabel(
  label: string,
  cohort: string | undefined
): string {
  const trimmed = cohort?.trim()
  if (!trimmed) return label
  // `\b`는 한글을 word 문자로 취급하지 않아 `N기` 뒤의 공백에서
  // 경계를 만들지 못한다. 실제 시드 문구의 placeholder를 그대로 치환한다.
  return label.replace(/N기/g, `${trimmed}기`)
}
