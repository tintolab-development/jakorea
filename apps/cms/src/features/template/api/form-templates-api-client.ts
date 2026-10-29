import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIFormsSurveysSubset } from '@/shared/api/generated/forms-surveys/forms-surveys-api'
import type {
  FormResponseFeedbackCreateRequest,
  FormResponseFeedbackResponse,
  FormTemplateCreateRequest,
  FormTemplateDuplicateRequest,
  FormTemplateLatestPayloadResponse,
  FormTemplateResponse,
  FormTemplateUpdateRequest,
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
  return unwrapApiBody(await formsSurveysApi.updateVersion(versionId, body))
}

export async function publishFormTemplateVersionRemote(
  versionId: number,
  body?: FormTemplateVersionPublishRequest
): Promise<FormTemplateVersionResponse> {
  return unwrapApiBody(await formsSurveysApi.publishVersion(versionId, body ?? {}))
}

export async function copyFormTemplateVersionRemote(
  templateId: number,
  body?: FormTemplateVersionCopyRequest
): Promise<FormVersionAdminResponse> {
  return unwrapApiBody(await formsSurveysApi.copyVersion(templateId, body ?? {}))
}

/** 같은 템플릿에 DRAFT version 추가 (`versionNo = max + 1`). `versions/copy`는 새 COPY 템플릿을 만든다. */
export async function createFormTemplateVersionRemote(
  templateId: number,
  body: FormTemplateVersionCreateRequest
): Promise<FormTemplateVersionResponse> {
  return unwrapApiBody(await formsSurveysApi.createVersion1(templateId, body))
}

export async function createFormTemplateRemote(
  body: FormTemplateCreateRequest
): Promise<FormTemplateResponse> {
  return unwrapApiBody(await formsSurveysApi.createTemplate2(body))
}

export async function duplicateFormTemplateRemote(
  templateId: number,
  body: FormTemplateDuplicateRequest
): Promise<FormTemplateResponse> {
  return unwrapApiBody(await formsSurveysApi.duplicateTemplate(templateId, body))
}

export async function updateFormTemplateRemote(
  templateId: number,
  body: FormTemplateUpdateRequest
): Promise<FormTemplateResponse> {
  return unwrapApiBody(await formsSurveysApi.updateTemplate(templateId, body))
}

export async function fetchFormTemplateVersionsRemote(
  templateId: number
): Promise<FormTemplateVersionSummaryResponse[]> {
  return unwrapApiBody(await formsSurveysApi.listVersions(templateId))
}

export async function deleteFormTemplateRemote(templateId: number): Promise<FormTemplateResponse> {
  return unwrapApiBody(await formsSurveysApi.deleteTemplate(templateId))
}

/** POST /api/admin/form-responses/{responseId}/feedback — Wave11 */
export async function createFormResponseFeedbackRemote(
  responseId: number,
  body: FormResponseFeedbackCreateRequest
): Promise<FormResponseFeedbackResponse> {
  return unwrapApiBody(await formsSurveysApi.createFeedback(responseId, body))
}
