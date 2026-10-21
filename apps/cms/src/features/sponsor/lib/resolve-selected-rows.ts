/**
 * 목록 체크 선택 → 삭제 대상.
 * antd `selectedRowKeys`와 `id` 타입(string/number)이 달라도 매칭하고,
 * 무한스크롤 페이지가 잘려 `listRows`에 없어도 직전 `selectedRows` 스냅샷으로 복원한다.
 */
export function resolveSelectedSponsorRows<T extends { id: string }>(
  listRows: readonly T[],
  selectedRowKeys: readonly React.Key[],
  selectedRowsSnapshot: readonly T[] = []
): T[] {
  const keySet = new Set(selectedRowKeys.map(String))
  if (keySet.size === 0) return []

  const byId = new Map<string, T>()
  for (const row of listRows) {
    const id = String(row.id)
    if (keySet.has(id)) byId.set(id, row)
  }
  for (const row of selectedRowsSnapshot) {
    const id = String(row.id)
    if (keySet.has(id) && !byId.has(id)) byId.set(id, row)
  }

  return selectedRowKeys
    .map(key => byId.get(String(key)))
    .filter((row): row is T => row != null)
}
