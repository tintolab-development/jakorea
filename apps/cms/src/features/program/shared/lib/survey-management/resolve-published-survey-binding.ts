import { resolveFormTemplateCatalogIds } from '@/features/template/api/admin-form-templates-service'
import { fetchFormTemplateVersionsRemote } from '@/features/template/api/form-templates-api-client'

export type PublishedSurveyBindingResolution =
  | { ok: true; templateId: number; templateVersionId: number }
  | { ok: false; reason: 'not_found' | 'not_published' }

/**
 * 설문·만족도·강의평가 등록은 양식 관리에서 고른 템플릿의 게시 version에 바인딩한다.
 * 카탈로그 템플릿을 복제하거나 원본을 게시하지 않는다.
 */
export async function resolvePublishedSurveyBinding(
  templateCode: string
): Promise<PublishedSurveyBindingResolution> {
  const code = templateCode.trim()
  if (code === '') return { ok: false, reason: 'not_found' }

  const resolved = await resolveFormTemplateCatalogIds(code)
  if (resolved == null) return { ok: false, reason: 'not_found' }

  const versions = await fetchFormTemplateVersionsRemote(resolved.templateId)
  const published = versions
    .filter(
      version => version.versionStatus === 'PUBLISHED' && version.templateVersionId != null
    )
    .sort((left, right) => (right.versionNo ?? 0) - (left.versionNo ?? 0))
  const latestPublished = published[0]
  if (latestPublished?.templateVersionId == null) {
    return { ok: false, reason: 'not_published' }
  }

  return {
    ok: true,
    templateId: resolved.templateId,
    templateVersionId: latestPublished.templateVersionId,
  }
}

export function surveyBindingResolutionAlert(
  reason: Exclude<PublishedSurveyBindingResolution, { ok: true }>['reason']
): string {
  if (reason === 'not_published') {
    return '선택한 양식에 게시된 버전이 없습니다. 양식 관리에서 게시한 뒤 다시 등록해 주세요.'
  }
  return '선택한 템플릿의 서버 ID를 찾지 못했습니다. 양식 관리에서 템플릿을 동기화한 뒤 다시 시도해 주세요.'
}
