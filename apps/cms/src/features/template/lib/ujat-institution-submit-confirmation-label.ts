/**
 * UJAT 참여 기관 신청 — 제출 확인 라디오 라벨의 `2NNN년`(또는 구시드 4자리 연도)을
 * 실제 사용(작성) 연도로 치환. 템플릿 편집은 시드 라벨(`2NNN년`) 그대로 둔다.
 */
export function resolveUjatInstitutionSubmitConfirmationItemLabel(
  label: string,
  year: number = new Date().getFullYear()
): string {
  return label.replace(/2NNN년|\d{4}년/, `${year}년`)
}
