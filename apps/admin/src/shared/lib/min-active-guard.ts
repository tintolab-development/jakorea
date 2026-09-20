/**
 * 사용 여부 최소 1건 유지 — 마지막 활성 해제·삭제 선검증
 */

export function isLastActiveToggleOff<T extends { id: string; isActive: boolean }>(
  rows: readonly T[],
  id: string,
  nextActive: boolean,
): boolean {
  if (nextActive) return false
  const current = rows.find(row => row.id === id)
  if (!current?.isActive) return false
  return rows.filter(row => row.isActive).length <= 1
}

export function wouldRemoveLastActive<T extends { id: string; isActive: boolean }>(
  rows: readonly T[],
  ids: readonly string[],
): boolean {
  if (ids.length === 0) return false
  const remove = new Set(ids)
  const remainingActive = rows.filter(row => row.isActive && !remove.has(row.id)).length
  return rows.some(row => row.isActive) && remainingActive === 0
}

export function minActiveRequiredAlert(subject: string): { title: string; content: string } {
  return {
    title: '사용 제한',
    content: `${subject} 최소 1개 이상 사용해야 합니다.`,
  }
}
