import { fetchFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { queryClient } from '@/shared/lib/query-client'
import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'
import { readSurveyTitleFromSchema } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'

function parseTemplateVersionId(versionId: string): number | null {
  const n = Number(versionId)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

/** 바인딩된 template version schema에서 설문 제목(`surveyTitle`) 조회 */
export async function fetchSurveyTitlesByTemplateVersionIds(
  versionIds: readonly string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(versionIds.map(parseTemplateVersionId).filter((id): id is number => id != null))]
  const titles = new Map<string, string>()

  await Promise.all(
    unique.map(async versionId => {
      try {
        // 신청·설문 탭이 같은 version을 이미 받았으면 캐시를 쓴다 (loadFormTemplateVersionDraftByVersionId와 같은 키·staleTime).
        const version = await queryClient.fetchQuery({
          queryKey: formTemplateQueryKeys.versionById(versionId),
          queryFn: () => fetchFormTemplateVersionRemote(versionId),
          staleTime: 30_000,
        })
        const title = readSurveyTitleFromSchema(version.schemaJson)
        if (title != null) {
          titles.set(String(versionId), title)
        }
      } catch (error) {
        console.warn('[survey-display-titles] version load failed', versionId, error)
      }
    })
  )

  return titles
}

export function applySurveyDisplayTitles(
  surveys: readonly RegisteredSurvey[],
  titlesByVersionId: ReadonlyMap<string, string>
): RegisteredSurvey[] {
  return surveys.map(survey => {
    const fromSchema = titlesByVersionId.get(survey.id)
    if (fromSchema == null || fromSchema === '') return survey
    return { ...survey, title: fromSchema }
  })
}
