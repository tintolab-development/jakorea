import {
  publishFormTemplateVersionById,
  resolveFormTemplateCatalogIds,
} from '@/features/template/api/admin-form-templates-service'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'

async function publishCopiedSurveyVersion(versionId: number): Promise<number> {
  try {
    return await publishFormTemplateVersionById(versionId)
  } catch (error) {
    const message = getGeneralProgramApiErrorMessage(error, '')
    const status =
      error != null && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined
    if (status === 409 || /already published|이미 게시|PUBLISHED/i.test(message)) {
      return versionId
    }
    throw error
  }
}

/**
 * 설문·만족도·강의평가 등록은 복제된 템플릿을 게시한 뒤 그 version에 바인딩한다.
 * 양식 관리 원본 templateCode는 쓰지 않는다.
 */
export async function resolvePublishedDuplicatedSurveyBinding(
  duplicatedTemplateCode: string
): Promise<{ templateId: number; templateVersionId: number } | null> {
  const code = duplicatedTemplateCode.trim()
  if (code === '') return null
  const resolved = await resolveFormTemplateCatalogIds(code)
  if (resolved == null) return null
  const templateVersionId = await publishCopiedSurveyVersion(resolved.templateVersionId)
  return { templateId: resolved.templateId, templateVersionId }
}
