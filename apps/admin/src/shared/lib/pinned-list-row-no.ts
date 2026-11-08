/**
 * 상단 고정 행(No. 대신 '공지' 표시)이 있는 무한 스크롤 목록의 정렬·번호
 *
 * - 고정 행은 항상 목록 맨 위 (불러온 행 기준 안정 정렬 — 서버 순서 유지)
 * - No.는 서버 전체 건수(`totalCount`, 고정 포함)에서 고정 건수를 뺀 값부터 1씩 감소
 *   → 다음 페이지가 붙어도 이미 보인 행의 번호가 바뀌지 않는다
 *   (불러온 행 수로 역산하면 스크롤할 때마다 번호가 다시 매겨진다)
 */

type PinnedListRow = { id: string; isPinned: boolean }

/** 고정 행을 앞으로 — 고정·일반 각각의 서버 순서는 유지. 고정 행이 이미 앞에 있으면 원본 배열 그대로 */
export function sortPinnedRowsFirst<T extends PinnedListRow>(rows: T[]): T[] {
  const firstUnpinned = rows.findIndex(row => !row.isPinned)
  if (firstUnpinned < 0) return rows
  const pinnedAfterUnpinned = rows.some((row, index) => index > firstUnpinned && row.isPinned)
  if (!pinnedAfterUnpinned) return rows
  return [...rows.filter(row => row.isPinned), ...rows.filter(row => !row.isPinned)]
}

/** 고정이 아닌 행의 No. — 전체 건수 기준 역순 */
export function buildPinnedListRowNoMap<T extends PinnedListRow>(
  rows: readonly T[],
  totalCount: number
): Map<string, number> {
  const pinnedCount = rows.reduce((count, row) => (row.isPinned ? count + 1 : count), 0)
  const firstNo = Math.max(totalCount, rows.length) - pinnedCount
  const map = new Map<string, number>()
  let offset = 0
  for (const row of rows) {
    if (row.isPinned) continue
    map.set(row.id, firstNo - offset)
    offset += 1
  }
  return map
}
