import { CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'

/** 프로그램 상세 — 정보 수정 액션 버튼 라벨 (편집 중에도 「정보 저장」으로 바꾸지 않음) */
export const PROGRAM_EDIT_INFO_BUTTON_LABEL = '정보 수정'

/**
 * 「정보 수정」 CmsButton 고정 props — secondary(민트 아웃라인) + large 140×44
 * Figma: border mint · bg mint 6% gradient on #FFF
 */
export const PROGRAM_EDIT_INFO_BUTTON_PROPS = {
  variant: 'secondary',
  size: 'large',
  width: CMS_ACTION_BUTTON_WIDTH,
} as const

export function resolveProgramEditInfoClick(
  isEditing: boolean,
  handlers: { onEnterEdit: () => void; onSaveEdit: () => void }
): () => void {
  return isEditing ? handlers.onSaveEdit : handlers.onEnterEdit
}
