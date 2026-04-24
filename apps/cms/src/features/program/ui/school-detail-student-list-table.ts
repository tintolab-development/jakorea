/**
 * 참여 학생 목록 테이블: 체크박스 + 데이터 컬럼 순 설계 min-width(px).
 * CSS `.school-detail-modal__student-table`의 `--student-list-col-scale`과 합계(1538)를 맞출 것.
 */
export const STUDENT_LIST_TABLE_COL_MIN_WIDTHS = [
  68, 80, 160, 170, 170, 295, 295, 150, 150,
] as const

export const STUDENT_LIST_TABLE_SCROLL_X = STUDENT_LIST_TABLE_COL_MIN_WIDTHS.reduce(
  (a, b) => a + b,
  0,
)

/** 데이터 컬럼 정의 순서(0 = No.) → width / minWidth */
export function studentListTableDataColumnSize(dataColumnIndex: number): {
  width: number
  minWidth: number
} {
  const w = STUDENT_LIST_TABLE_COL_MIN_WIDTHS[dataColumnIndex + 1]!
  return { width: w, minWidth: w }
}
