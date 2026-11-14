import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { assertFormTemplateWriteAllowed } from '@/features/template/lib/form-template-seed-preview'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import type { FormResponseFeedbackListResponse } from '@/features/template/lib/form-response-feedback-list'
import { getJAKoreaCMSBackendAPIFormsSurveysSubset } from '@/shared/api/generated/forms-surveys/forms-surveys-api'
import type {
  FormResponseFeedbackCreateRequest,
  FormResponseFeedbackResponse,
  FormTemplateCreateRequest,
  FormTemplateDuplicateRequest,
  FormTemplateLatestPayloadResponse,
  FormTemplateResponse,
  FormTemplateUpdateRequest,
  FormCatalogDocumentReplaceRequest,
  FormTemplateVersionCopyRequest,
  FormTemplateVersionCreateRequest,
  FormTemplateVersionPublishRequest,
  FormTemplateVersionResponse,
  FormTemplateVersionSummaryResponse,
  FormTemplateVersionUpdateRequest,
  FormVersionAdminResponse,
  ListTemplatesParams,
  PageResponseFormTemplateListItemResponse,
} from '@/shared/api/generated/forms-surveys/schemas'

const formsSurveysApi = getJAKoreaCMSBackendAPIFormsSurveysSubset()

export async function fetchFormTemplatesRemote(
  params?: ListTemplatesParams
): Promise<PageResponseFormTemplateListItemResponse> {
  return unwrapApiBody(await formsSurveysApi.listTemplates(params))
}

export async function fetchFormTemplatePayloadByCodeRemote(
  templateCode: string
): Promise<FormTemplateLatestPayloadResponse> {
  return unwrapApiBody(await formsSurveysApi.getTemplatePayloadByCode(templateCode))
}

export async function fetchFormTemplateVersionRemote(
  versionId: number
): Promise<FormTemplateVersionResponse> {
  return unwrapApiBody(await formsSurveysApi.getVersion(versionId))
}

export async function updateFormTemplateVersionRemote(
  versionId: number,
  body: FormTemplateVersionUpdateRequest
): Promise<FormVersionAdminResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.updateVersion(versionId, body))
}

export async function publishFormTemplateVersionRemote(
  versionId: number,
  body?: FormTemplateVersionPublishRequest
): Promise<FormTemplateVersionResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.publishVersion(versionId, body ?? {}))
}

export async function replaceCatalogDocumentRemote(
  templateId: number,
  body: FormCatalogDocumentReplaceRequest
): Promise<void> {
  assertFormTemplateWriteAllowed()
  await formsSurveysApi.replaceCatalogDocument(templateId, body)
}

export async function copyFormTemplateVersionRemote(
  templateId: number,
  body?: FormTemplateVersionCopyRequest
): Promise<FormVersionAdminResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.copyVersion(templateId, body ?? {}))
}

/** 같은 템플릿에 DRAFT version 추가 (`versionNo = max + 1`). `versions/copy`는 새 COPY 템플릿을 만든다. */
export async function createFormTemplateVersionRemote(
  templateId: number,
  body: FormTemplateVersionCreateRequest
): Promise<FormTemplateVersionResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.createVersion1(templateId, body))
}

export async function createFormTemplateRemote(
  body: FormTemplateCreateRequest
): Promise<FormTemplateResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.createTemplate2(body))
}

export async function duplicateFormTemplateRemote(
  templateId: number,
  body: FormTemplateDuplicateRequest
): Promise<FormTemplateResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.duplicateTemplate(templateId, body))
}

export async function updateFormTemplateRemote(
  templateId: number,
  body: FormTemplateUpdateRequest
): Promise<FormTemplateResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.updateTemplate(templateId, body))
}

export async function fetchFormTemplateVersionsRemote(
  templateId: number
): Promise<FormTemplateVersionSummaryResponse[]> {
  return unwrapApiBody(await formsSurveysApi.listVersions(templateId))
}

export async function deleteFormTemplateRemote(templateId: number): Promise<FormTemplateResponse> {
  assertFormTemplateWriteAllowed()
  return unwrapApiBody(await formsSurveysApi.deleteTemplate(templateId))
}

const SKIP_GLOBAL_FEEDBACK_ALERT = { skipGlobalErrorAlert: true } as const

/** POST /api/admin/form-responses/{responseId}/feedback — Wave11 */
export async function createFormResponseFeedbackRemote(
  responseId: number,
  body: FormResponseFeedbackCreateRequest
): Promise<FormResponseFeedbackResponse> {
  return unwrapApiBody(
    await formsSurveysApi.createFeedback(responseId, body, SKIP_GLOBAL_FEEDBACK_ALERT)
  )
}

/** GET /api/admin/form-responses/{responseId}/feedback — operationId getFormResponseFeedback */
export async function getFormResponseFeedbackRemote(
  responseId: number
): Promise<FormResponseFeedbackListResponse> {
  try {
    return unwrapApiBody(await formsSurveysApi.getFeedback(responseId, SKIP_GLOBAL_FEEDBACK_ALERT))
  } catch (error) {
    if (getApiErrorHttpStatus(error) === 404) {
      return { formResponseId: responseId, feedbacks: [] }
    }
    throw error
  }
}
