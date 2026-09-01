import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'
import {
  duplicateFormTemplateVersionRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'

export interface DuplicateWritingTemplateParams {
  sourceTemplateId: string
  category: WritingTemplateCategory
}

export interface DuplicateWritingTemplateResult {
  newTemplateId: string
}

/**
 * 작성 양식(신청/설문/동의) 템플릿 복제.
 * formsSurveys API 활성 시 versions/copy 호출, 그 외 스텁(원본 id 반환).
 */
export async function duplicateWritingTemplate(
  params: DuplicateWritingTemplateParams
): Promise<DuplicateWritingTemplateResult> {
  if (shouldUseFormsSurveysRemoteApi()) {
    try {
      const newTemplateId = await duplicateFormTemplateVersionRemote({
        sourceTemplateCode: params.sourceTemplateId,
      })
      return { newTemplateId }
    } catch (error) {
      console.warn('[form-templates] remote duplicate failed; using stub fallback', error)
    }
  }

  await new Promise<void>(resolve => {
    setTimeout(resolve, 150)
  })
  return { newTemplateId: params.sourceTemplateId }
}
