/**
 * 참여 학생 목록 열 너비(px). 체크박스, No., 학생명, 성별, 생년월일, 학급, 연락처, 이메일, 비고, 강의출석.
 * 컬럼 `width`, `scroll.x`, 그리고 표에 넣는 CSS 변수만 이 배열을 쓴다.
 */
export const STUDENT_LIST_TABLE_COL_MIN_WIDTHS = [
  48, 64, 120, 140, 160, 140, 255, 255, 200, 110,
] as const

export const STUDENT_LIST_TABLE_SCROLL_X = STUDENT_LIST_TABLE_COL_MIN_WIDTHS.reduce(
  (a, b) => a + b,
  0
)

/** FilterTableLayout 공통 `col { width: auto !important }`를 이 표에서만 배열 값으로 덮는다. */
export function studentListTableWidthStyle(): Record<`--${string}`, string> {
  const style: Record<string, string> = {
    '--table-selection-column-width': `${STUDENT_LIST_TABLE_COL_MIN_WIDTHS[0]}px`,
    '--table-no-column-width': `${STUDENT_LIST_TABLE_COL_MIN_WIDTHS[1]}px`,
    '--student-list-table-min-width': `${STUDENT_LIST_TABLE_SCROLL_X}px`,
  }
  STUDENT_LIST_TABLE_COL_MIN_WIDTHS.forEach((width, index) => {
    style[`--student-list-col-${index + 1}`] = `${width}px`
  })
  return style as Record<`--${string}`, string>
}

/** 데이터 컬럼 정의 순서(0 = No.) → width / minWidth */
export function studentListTableDataColumnSize(dataColumnIndex: number): {
  width: number
  minWidth: number
} {
  const w = STUDENT_LIST_TABLE_COL_MIN_WIDTHS[dataColumnIndex + 1]!
  return { width: w, minWidth: w }
}
