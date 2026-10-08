import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'
import {
  duplicateFormTemplateVersionRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { buildLocalDuplicateWritingTemplateCode } from '@/features/template/lib/form-template-delete-policy'

export interface DuplicateWritingTemplateParams {
  sourceTemplateId: string
  category: WritingTemplateCategory
  sourceApiTemplateId?: number
  sourceVersionId?: number
  templateName?: string
}

export interface DuplicateWritingTemplateResult {
  newTemplateId: string
}

/**
 * 작성 양식 템플릿 복제.
 * formsSurveys API 활성 시 `POST .../duplicate`, 그 외 mock 스텁.
 */
export async function duplicateWritingTemplate(
  params: DuplicateWritingTemplateParams
): Promise<DuplicateWritingTemplateResult> {
  if (shouldUseFormsSurveysRemoteApi()) {
    const newTemplateId = await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: params.sourceTemplateId,
      sourceApiTemplateId: params.sourceApiTemplateId,
      sourceVersionId: params.sourceVersionId,
      templateName: params.templateName,
    })
    return { newTemplateId }
  }

  await new Promise<void>(resolve => {
    setTimeout(resolve, 150)
  })
  return { newTemplateId: buildLocalDuplicateWritingTemplateCode(params.sourceTemplateId) }
}
