import type { GeneralProgramSurveyMenuKey } from '@/types/domain'

const VALID_SURVEY_MENU_KEYS = new Set<string>([
  'survey',
  'student_satisfaction',
  'teacher_satisfaction',
  'lecture_evaluation',
])

/** 레거시 `satisfaction` → 학생·교사 만족도조사 2항목 */
export function normalizeGeneralSurveyMenuKeys(
  keys: readonly string[]
): GeneralProgramSurveyMenuKey[] {
  const result: GeneralProgramSurveyMenuKey[] = []
  for (const key of keys) {
    if (key === 'satisfaction') {
      if (!result.includes('student_satisfaction')) result.push('student_satisfaction')
      if (!result.includes('teacher_satisfaction')) result.push('teacher_satisfaction')
      continue
    }
    if (VALID_SURVEY_MENU_KEYS.has(key)) {
      result.push(key as GeneralProgramSurveyMenuKey)
    }
  }
  return result
}
