export type ProgramListViewMode = 'list' | 'calendar'

/** 프로그램 목록의 일괄 삭제는 목록 행 선택에만 반응한다. */
export function canBulkDeletePrograms(
  viewMode: ProgramListViewMode,
  selectedRowCount: number
): boolean {
  return viewMode === 'list' && selectedRowCount > 0
}
