/**
 * 행 onClick으로 상세 이동할 때, 선택(체크박스) 열 클릭은 무시한다.
 * Ant Design `rowSelection` 열: `.ant-table-selection-column` / `.ant-checkbox-wrapper`
 */
export function isTableSelectionClick(event: { target: EventTarget | null }): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('.ant-table-selection-column') || target.closest('.ant-checkbox-wrapper')
  )
}
