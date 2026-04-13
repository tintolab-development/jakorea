import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'

export interface DuplicateWritingTemplateParams {
  sourceTemplateId: string
  category: WritingTemplateCategory
}

export interface DuplicateWritingTemplateResult {
  newTemplateId: string
}

/**
 * 작성 양식(신청/설문/동의) 템플릿 복제.
 * TODO(api): 실제 복제 API 연동 후 응답의 새 템플릿 id를 반환할 것.
 * 스텁은 UI·URL 연동 검증용으로 원본 id를 그대로 반환한다.
 */
export async function duplicateWritingTemplate(
  params: DuplicateWritingTemplateParams
): Promise<DuplicateWritingTemplateResult> {
  // TODO(api): 작성 양식 복제 API 연동 — 응답의 새 템플릿 id로 교체
  await new Promise<void>(resolve => {
    setTimeout(resolve, 150)
  })
  return { newTemplateId: params.sourceTemplateId }
}
