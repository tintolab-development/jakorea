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

/** 수상·인증 등록·수정 — 날짜·이름(상명/내용)·기관명 중 하나라도 비면 공통 미입력 안내 */
export function isDatedFormRequiredIncomplete(input: {
  date: { isValid(): boolean } | null
  name: string
  organization: string
}): boolean {
  return (
    input.date == null ||
    !input.date.isValid() ||
    input.name.trim() === '' ||
    input.organization.trim() === ''
  )
}
