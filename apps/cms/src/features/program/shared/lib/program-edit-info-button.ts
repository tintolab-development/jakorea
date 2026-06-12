/** 프로그램 상세 — 정보 수정 액션 버튼 라벨 (편집 중에도 「정보 저장」으로 바꾸지 않음) */
export const PROGRAM_EDIT_INFO_BUTTON_LABEL = '정보 수정'

export function resolveProgramEditInfoClick(
  isEditing: boolean,
  handlers: { onEnterEdit: () => void; onSaveEdit: () => void }
): () => void {
  return isEditing ? handlers.onSaveEdit : handlers.onEnterEdit
}
