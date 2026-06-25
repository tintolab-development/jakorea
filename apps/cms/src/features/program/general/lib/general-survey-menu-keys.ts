import type { GeneralProgramSurveyMenuKey } from '@/types/domain'

const LEGACY_SATISFACTION_KEYS = new Set([
  'satisfaction',
  'student_satisfaction',
  'teacher_satisfaction',
  'volunteer_satisfaction',
  'school_satisfaction',
])

/** 레거시 4종·UJAT 4종 키 → 공통 3종(`satisfaction` 단일) */
export function normalizeGeneralSurveyMenuKeys(
  keys: readonly string[]
): GeneralProgramSurveyMenuKey[] {
  const hasSurvey = keys.includes('survey')
  const hasLecture = keys.includes('lecture_evaluation')
  const hasSatisfaction = keys.some(key => LEGACY_SATISFACTION_KEYS.has(key))

  const result: GeneralProgramSurveyMenuKey[] = []
  if (hasSurvey) result.push('survey')
  if (hasSatisfaction) result.push('satisfaction')
  if (hasLecture) result.push('lecture_evaluation')
  return result
}
