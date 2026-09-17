import {
  createWritingFormTemplateRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'

export type CreateWritingTemplateTarget = 'survey' | 'agreement'

export type CreateWritingTemplateResult =
  | { mode: 'remote'; newTemplateId: string; target: CreateWritingTemplateTarget }
  | { mode: 'local-new'; target: CreateWritingTemplateTarget }

export type CreateWritingTemplateOptions = {
  templateName?: string
}

/**
 * 작성 양식 직접 등록.
 * formsSurveys API 활성 시 POST /form-templates, 그 외 로컬 mode=new 경로.
 */
export async function createWritingTemplate(
  target: CreateWritingTemplateTarget,
  options?: CreateWritingTemplateOptions
): Promise<CreateWritingTemplateResult> {
  if (!shouldUseFormsSurveysRemoteApi()) {
    return { mode: 'local-new', target }
  }

  try {
    const newTemplateId = await createWritingFormTemplateRemote({
      target,
      templateName: options?.templateName,
    })
    return { mode: 'remote', newTemplateId, target }
  } catch (error) {
    console.warn('[form-templates] remote create failed', error)
    throw error
  }
}
