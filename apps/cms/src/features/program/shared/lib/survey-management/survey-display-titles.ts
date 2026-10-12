import { fetchFormTemplateVersionRemote } from '@/features/template/api/form-templates-api-client'
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
        const version = await fetchFormTemplateVersionRemote(versionId)
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
