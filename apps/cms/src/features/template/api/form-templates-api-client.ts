import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIFormsSurveysSubset } from '@/shared/api/generated/forms-surveys/forms-surveys-api'
import type {
  FormTemplateCreateRequest,
  FormTemplateResponse,
  FormTemplateVersionCopyRequest,
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

export async function createFormTemplateRemote(
  body: FormTemplateCreateRequest
): Promise<FormTemplateResponse> {
  return unwrapApiBody(await formsSurveysApi.createTemplate2(body))
}

export async function fetchFormTemplateVersionsRemote(
  templateId: number
): Promise<FormTemplateVersionSummaryResponse[]> {
  return unwrapApiBody(await formsSurveysApi.listVersions(templateId))
}
