import {
  createWritingFormTemplateRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'

export type CreateWritingTemplateTarget = 'survey' | 'agreement'

export type CreateWritingTemplateResult =
  | { mode: 'remote'; newTemplateId: string }
  | { mode: 'local-new'; target: CreateWritingTemplateTarget }

/**
 * 작성 양식 직접 등록.
 * formsSurveys API 활성 시 POST /form-templates, 그 외 로컬 mode=new 경로.
 */
export async function createWritingTemplate(
  target: CreateWritingTemplateTarget
): Promise<CreateWritingTemplateResult> {
  if (!shouldUseFormsSurveysRemoteApi()) {
    return { mode: 'local-new', target }
  }

  try {
    const newTemplateId = await createWritingFormTemplateRemote({ target })
    return { mode: 'remote', newTemplateId }
  } catch (error) {
    console.warn('[form-templates] remote create failed', error)
    throw error
  }
}
