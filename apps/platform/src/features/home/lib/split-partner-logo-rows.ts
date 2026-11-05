/**
 * 홈·기업후원 후원사 로고 — 등록 건수를 2로 나눈 1열/2열.
 * 홀수이면 2열에 +1.
 */

export function splitSponsorLogosIntoTwoColumns<T>(items: readonly T[]): {
  column1: T[]
  column2: T[]
} {
  const firstCount = Math.floor(items.length / 2)
  return {
    column1: items.slice(0, firstCount),
    column2: items.slice(firstCount),
  }
}

/** 모바일 2열 그리드: 행마다 [1열, 2열]. 홀수 마지막 행은 2열만 채움. */
export function cellsForTwoColumnSponsorGrid<T>(
  column1: readonly T[],
  column2: readonly T[],
): Array<T | null> {
  const rowCount = Math.max(column1.length, column2.length)
  const cells: Array<T | null> = []
  for (let i = 0; i < rowCount; i += 1) {
    cells.push(column1[i] ?? null)
    cells.push(column2[i] ?? null)
  }
  return cells
}

export function partnerRowsFromOrderedLogos<T>(items: readonly T[]): T[][] {
  const { column1, column2 } = splitSponsorLogosIntoTwoColumns(items)
  if (column1.length === 0 && column2.length === 0) return []
  if (column1.length === 0) return [column2]
  return [column1, column2]
}

/** partnerRows(1열, 2열) → 모바일 2열 그리드 셀. 1열만 있으면 2열로 취급. */
export function gridCellsFromPartnerRows<T>(
  rows: readonly (readonly T[])[],
): Array<T | null> {
  if (rows.length === 0) return []
  if (rows.length === 1) return cellsForTwoColumnSponsorGrid([], rows[0] ?? [])
  return cellsForTwoColumnSponsorGrid(rows[0] ?? [], rows[1] ?? [])
}
