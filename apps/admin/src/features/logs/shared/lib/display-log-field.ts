/** 로그 목록 셀 — null·빈 문자열은 `-`, API 원문은 그대로 */
export function displayLogField(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
