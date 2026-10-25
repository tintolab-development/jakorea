/** 카테고리 삭제 불가 안내 — 게시 유형별 본문만 분리 */
export type CategoryDeleteBlockedKind = 'notice' | 'inquiry' | 'faq'

export const CATEGORY_DELETE_BLOCKED_DESCRIPTION: Record<CategoryDeleteBlockedKind, string> = {
  notice: '등록된 공지사항이 있는 카테고리는 삭제할 수 없습니다.',
  inquiry: '등록된 문의내역이 있는 카테고리는 삭제할 수 없습니다.',
  faq: '등록된 FAQ가 있는 카테고리는 삭제할 수 없습니다.',
}

export function resolveCategoryDeleteBlockedDescription(
  kind: CategoryDeleteBlockedKind,
  description?: string
): string {
  return description ?? CATEGORY_DELETE_BLOCKED_DESCRIPTION[kind]
}
