/**
 * 조회↔수정 같은 컨트롤 유지 패턴의 조회 모양 (`inline-readonly.css`).
 * - `slot`: 보더 슬롯 유지, 색만 투명
 * - `text`: 셀 텍스트처럼 패딩·보더·최소 높이까지 제거
 */
export type InlineReadOnlyLook = 'slot' | 'text'

/** readOnly일 때만 조회 모양 클래스를 돌려준다. */
export function inlineReadOnlyClassName(
  readOnly: boolean | undefined,
  look: InlineReadOnlyLook | undefined
): string | undefined {
  if (!readOnly || !look) return undefined
  return look === 'text' ? 'cms-inline-readonly cms-inline-readonly--text' : 'cms-inline-readonly'
}

/** 조회 모양일 때 탭 이동에서 뺀다. 호출부가 tabIndex를 주면 그 값을 쓴다. */
export function inlineReadOnlyTabIndex(
  readOnly: boolean | undefined,
  look: InlineReadOnlyLook | undefined,
  tabIndex: number | undefined
): number | undefined {
  if (tabIndex !== undefined) return tabIndex
  return readOnly && look ? -1 : undefined
}
