/** UJAT 참여 기관 신청 — 제출 확인 라디오 라벨의 년도를 현재 연도로 치환 */
export function resolveUjatInstitutionSubmitConfirmationItemLabel(
  label: string,
  year: number = new Date().getFullYear()
): string {
  return label.replace(/\d{4}년/, `${year}년`)
}
