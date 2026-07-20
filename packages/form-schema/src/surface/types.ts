/** CMS admin vs Platform user embed surface */
export type FormTemplateSurface = 'cmsAdmin' | 'platformUser'

/** 단락 본문 interaction — authoring(CMS 편집) / user(응답 입력) / preview(읽기 전용) */
export type ParagraphBodyInteractionMode = 'authoring' | 'user' | 'preview'

export function isFormUserLikeVisibleMode(mode: ParagraphBodyInteractionMode): boolean {
  return mode === 'user' || mode === 'preview'
}

export function isFormPreviewReadonlyMode(mode: ParagraphBodyInteractionMode): boolean {
  return mode === 'preview'
}

/** @deprecated runtime에서 platformUser와 동일 처리 */
export type FormParagraphSectionDescriptionSurface = 'templateAuthoring' | 'responseEntry'

export function resolveParagraphDescriptionSurface(
  surface: FormTemplateSurface
): FormParagraphSectionDescriptionSurface {
  return surface === 'platformUser' ? 'responseEntry' : 'templateAuthoring'
}
