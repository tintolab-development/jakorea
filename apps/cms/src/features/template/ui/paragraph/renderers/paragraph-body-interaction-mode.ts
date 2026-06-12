/** 단락 본문이 템플릿 편집(authoring) / 응답 입력(user) / 읽기 전용 미리보기(preview)인지 */
export type ParagraphBodyInteractionMode = 'authoring' | 'user' | 'preview'

export function isFormUserLikeVisibleMode(mode: ParagraphBodyInteractionMode): boolean {
  return mode === 'user' || mode === 'preview'
}

export function isFormPreviewReadonlyMode(mode: ParagraphBodyInteractionMode): boolean {
  return mode === 'preview'
}
