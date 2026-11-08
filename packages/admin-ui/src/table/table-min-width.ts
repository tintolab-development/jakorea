import type { ColumnsType, ColumnType } from 'antd/es/table'

/** `admin-data-table.css` 선택 열 폭(`--table-selection-column-width`)과 동일 */
export const ADMIN_DATA_TABLE_SELECTION_COLUMN_WIDTH = 80
/** width·minWidth 둘 다 없는 열의 최소 폭 가정치 */
export const ADMIN_DATA_TABLE_FLEX_COLUMN_FALLBACK_WIDTH = 120
/**
 * 페이지(모달·드로어 밖) 테이블 최소 폭 하한.
 * 화면이 좁아지면 테이블은 max(열 합, 1080)에서 멈추고 가로 스크롤된다.
 */
export const ADMIN_DATA_TABLE_MIN_WIDTH_FLOOR = 1080

function columnWidthPx(column: ColumnType<unknown>): number {
  const width = column.width
  if (typeof width === 'number' && Number.isFinite(width)) return width
  if (typeof width === 'string') {
    const px = Number.parseFloat(width)
    if (Number.isFinite(px) && !width.trim().endsWith('%')) return px
  }
  const minWidth = (column as { minWidth?: number }).minWidth
  if (typeof minWidth === 'number' && Number.isFinite(minWidth)) return minWidth
  return ADMIN_DATA_TABLE_FLEX_COLUMN_FALLBACK_WIDTH
}

/** (선택 열) + 본문 열 폭 합 — 그룹 헤더는 자식 열 합 */
export function resolveAdminDataTableColumnsWidth(
  columns: ColumnsType<never> | undefined,
  selectionWidth: number | null
): number {
  let sum = selectionWidth ?? 0
  const walk = (list: ColumnsType<never>) => {
    for (const column of list) {
      if (!column || typeof column !== 'object') continue
      if ('children' in column && Array.isArray(column.children)) {
        walk(column.children as ColumnsType<never>)
        continue
      }
      sum += columnWidthPx(column as ColumnType<unknown>)
    }
  }
  walk(columns ?? [])
  return sum
}

function isNoColumn(column: ColumnType<unknown>): boolean {
  const className = typeof column.className === 'string' ? column.className : ''
  return (
    column.key === 'no' ||
    column.dataIndex === 'no' ||
    className.split(/\s+/).includes('cms-table-col--no')
  )
}

/**
 * 좁은 화면(최소 폭 고정)에서 최소 폭이 열 합보다 크면(하한 1080·화면 scroll.x) 여유분을 열에 배분한다.
 * - width 미지정 열이 있으면 그 열들에 균등 배분 (넓은 화면에서 남는 폭을 흡수하던 열)
 * - 없으면 No.를 제외한 본문 열에 폭 비례 배분
 * 선택 열·No.·그룹 헤더 열은 건드리지 않는다. 반환 열의 폭 합 = minWidth (선택 열 포함).
 */
export function distributeAdminDataTableSurplusWidth<T>(
  columns: readonly T[],
  surplus: number
): T[] {
  if (surplus <= 0) return [...columns]
  const leaves = columns
    .map((column, index) => ({ column: column as unknown as ColumnType<unknown>, index }))
    .filter(({ column }) => column && typeof column === 'object' && !('children' in column))
  const flex = leaves.filter(({ column }) => typeof column.width !== 'number')
  const targets =
    flex.length > 0 ? flex : leaves.filter(({ column }) => !isNoColumn(column))
  if (targets.length === 0) return [...columns]

  const base = targets.map(({ column }) => columnWidthPx(column))
  const baseSum = base.reduce((a, b) => a + b, 0)
  const next = [...columns]
  let given = 0
  targets.forEach(({ index }, i) => {
    const share =
      i === targets.length - 1
        ? surplus - given
        : Math.floor(flex.length > 0 ? surplus / targets.length : (surplus * base[i]!) / baseSum)
    given += share
    next[index] = { ...next[index], width: base[i]! + share } as T
  })
  return next
}

/**
 * 넓은 화면(열 합 ≤ 래퍼) 정확 폭 모드: 열은 지정 폭 그대로, 남는 폭은 유연 열(width 미지정)이 흡수.
 * 유연 열이 하나도 없으면 No.를 뺀 가장 넓은 본문 열(동률이면 뒤쪽)을 유연 열로 바꾼다(width → minWidth).
 */
export function ensureAdminDataTableFlexColumn<T>(columns: readonly T[]): T[] {
  const leaves = columns
    .map((column, index) => ({ column: column as unknown as ColumnType<unknown>, index }))
    .filter(({ column }) => column && typeof column === 'object' && !('children' in column))
  if (leaves.some(({ column }) => typeof column.width !== 'number')) return [...columns]
  const candidates = leaves.filter(({ column }) => !isNoColumn(column))
  if (candidates.length === 0) return [...columns]
  let pick = candidates[0]!
  for (const c of candidates) {
    if ((c.column.width as number) >= (pick.column.width as number)) pick = c
  }
  const next = [...columns]
  const { width, ...restColumn } = pick.column as ColumnType<unknown> & { minWidth?: number }
  next[pick.index] = {
    ...restColumn,
    minWidth: Math.max(Number(width) || 0, restColumn.minWidth ?? 0),
  } as unknown as T
  return next
}
