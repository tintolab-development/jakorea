/**
 * 전화·이메일·이름 등: 서버 마스킹·reveal 원문 문자열을 FE에서 재가공하지 않고 표시.
 */
export function displayServerPiiAsIs(value: string | null | undefined, empty = '-'): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : empty
}
