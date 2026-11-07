/** 연혁 등록·수정 — 빈 필수값이면 공통 미입력 안내 */
export function isHistoryFormRequiredIncomplete(input: {
  year: string
  month: string
  content: string
}): boolean {
  return (
    input.year.trim() === '' ||
    input.month.trim() === '' ||
    input.content.trim() === ''
  )
}
