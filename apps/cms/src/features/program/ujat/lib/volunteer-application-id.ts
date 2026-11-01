/** 봉사자 상세 URL·행 id가 원격 신청 id인지 판별한다. mock `h1-vol-*` 는 null. */
export function parseVolunteerApplicationNumericId(volunteerId: string): number | null {
  const trimmed = volunteerId.trim()
  if (!trimmed) return null
  const id = Number(trimmed)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  return id
}
