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
  /** 동명 회피용 표시명 — 원격 create body에 포함 */
  templateName?: string
}

export interface DuplicateWritingTemplateResult {
  newTemplateId: string
}

/**
 * 작성 양식(신청/설문/동의) 템플릿 복제.
 * formsSurveys API 활성 시 새 template 행 create, 그 외 mock 스텁(로컬 code).
 */
export async function duplicateWritingTemplate(
  params: DuplicateWritingTemplateParams
): Promise<DuplicateWritingTemplateResult> {
  let newTemplateId: string
  if (shouldUseFormsSurveysRemoteApi()) {
    newTemplateId = await duplicateFormTemplateVersionRemote({
      sourceTemplateCode: params.sourceTemplateId,
      category: params.category,
      templateName: params.templateName,
    })
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
