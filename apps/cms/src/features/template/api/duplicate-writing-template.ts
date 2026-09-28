import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'
import {
  duplicateFormTemplateVersionRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { buildLocalDuplicateWritingTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import { rememberUserCreatedWritingTemplate } from '@/features/template/lib/user-created-writing-template-catalog'

export interface DuplicateWritingTemplateParams {
  sourceTemplateId: string
  category: WritingTemplateCategory
  /** 동명 회피용 표시명 — 원격 복제 후 PATCH */
  templateName?: string
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
  let newTemplateId: string
  if (shouldUseFormsSurveysRemoteApi()) {
    try {
      newTemplateId = await duplicateFormTemplateVersionRemote({
        sourceTemplateCode: params.sourceTemplateId,
        templateName: params.templateName,
      })
    } catch (error) {
      console.warn('[form-templates] remote duplicate failed; using stub fallback', error)
      newTemplateId = buildLocalDuplicateWritingTemplateCode(params.sourceTemplateId)
    }
  } else {
    await new Promise<void>(resolve => {
      setTimeout(resolve, 150)
    })
    newTemplateId = buildLocalDuplicateWritingTemplateCode(params.sourceTemplateId)
  }

  rememberUserCreatedWritingTemplate({
    templateCode: newTemplateId,
    templateName: params.templateName?.trim() || newTemplateId,
    sectionKey: params.category,
    createdAt: new Date().toISOString(),
  })
  return { newTemplateId }
}
