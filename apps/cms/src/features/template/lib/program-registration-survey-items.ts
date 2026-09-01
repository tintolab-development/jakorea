/**
 * 프로그램 등록 양식 — 설문 진행 항목 (일반·UJAT·1사1교 공통 3종)
 */

export const PROGRAM_REGISTRATION_SURVEY_ITEM_IDS = [
  'survey',
  'satisfaction',
  'lecture_evaluation',
] as const

export type ProgramRegistrationSurveyItemId =
  (typeof PROGRAM_REGISTRATION_SURVEY_ITEM_IDS)[number]

export const PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS: Record<
  ProgramRegistrationSurveyItemId,
  string
> = {
  survey: '설문조사',
  satisfaction: '만족도조사',
  lecture_evaluation: '강의평가',
}

export function initialProgramRegistrationSurveyItems(
  allOn = false
): Record<ProgramRegistrationSurveyItemId, boolean> {
  return {
    survey: allOn,
    satisfaction: allOn,
    lecture_evaluation: allOn,
  }
}
