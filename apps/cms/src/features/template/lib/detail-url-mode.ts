/**
 * 양식 관리 상세 URL `mode` 값.
 * - `view`: 「양식 상세보기」로 연 조회 모드 — 본문 편집·저장 불가, 「수정」을 눌러야 `edit`로 바뀐다.
 * - `edit`: 편집 모드 — 수정 버튼, 복제·신규 생성 직후 진입.
 */
export const TEMPLATE_DETAIL_VIEW_MODE = 'view'
export const TEMPLATE_DETAIL_EDIT_MODE = 'edit'

export type TemplateDetailUrlMode = typeof TEMPLATE_DETAIL_VIEW_MODE | typeof TEMPLATE_DETAIL_EDIT_MODE

/** 상세 모달이 열려 있는 URL mode인가 (조회·편집 공통) */
export function isTemplateDetailUrlMode(mode: string | undefined | null): mode is TemplateDetailUrlMode {
  return mode === TEMPLATE_DETAIL_VIEW_MODE || mode === TEMPLATE_DETAIL_EDIT_MODE
}

export function isTemplateDetailViewUrlMode(mode: string | undefined | null): boolean {
  return mode === TEMPLATE_DETAIL_VIEW_MODE
}
