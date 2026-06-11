/**
 * 프로그램 등록 양식 — 설문 진행 항목 (일반·1사1교 등 공통)
 */

export const PROGRAM_REGISTRATION_SURVEY_ITEM_IDS = [
  'survey',
  'student_satisfaction',
  'teacher_satisfaction',
  'lecture_evaluation',
] as const

export type ProgramRegistrationSurveyItemId =
  (typeof PROGRAM_REGISTRATION_SURVEY_ITEM_IDS)[number]

export const PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS: Record<
  ProgramRegistrationSurveyItemId,
  string
> = {
  survey: '설문조사',
  student_satisfaction: '학생 만족도조사',
  teacher_satisfaction: '교사 만족도조사',
  lecture_evaluation: '강의평가',
}

export function initialProgramRegistrationSurveyItems(
  allOn = false
): Record<ProgramRegistrationSurveyItemId, boolean> {
  return {
    survey: allOn,
    student_satisfaction: allOn,
    teacher_satisfaction: allOn,
    lecture_evaluation: allOn,
  }
}
