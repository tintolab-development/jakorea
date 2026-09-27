import type { GeneralProgramSurveyMenuKey, Program } from '@/types/domain'

const LEGACY_SATISFACTION_KEYS = new Set([
  'satisfaction',
  'student_satisfaction',
  'teacher_satisfaction',
  'volunteer_satisfaction',
  'school_satisfaction',
])

const SURVEY_ITEMS_OVERLAY_KEYS = [
  'generalRegistration.basicInfo.surveyItems',
  'economyRegistration.basicInfo.surveyItems',
] as const

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

function isSurveyItemsRecord(raw: unknown): raw is Record<string, unknown> {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
}

/** 등록 overlay 체크 상태 → 공통 3종 키. 키 자체가 없으면 undefined. */
export function surveyMenuKeysFromRegistrationOverlay(
  overlay: Record<string, unknown> | undefined
): GeneralProgramSurveyMenuKey[] | undefined {
  if (!overlay) return undefined
  for (const key of SURVEY_ITEMS_OVERLAY_KEYS) {
    const raw = overlay[key]
    if (!isSurveyItemsRecord(raw)) continue
    const keys: GeneralProgramSurveyMenuKey[] = []
    if (raw.survey === true) keys.push('survey')
    if (raw.satisfaction === true) keys.push('satisfaction')
    if (raw.lecture_evaluation === true) keys.push('lecture_evaluation')
    return keys
  }
  return undefined
}

/**
 * 설문 진행 항목 · 상세 LNB 공통 해석.
 * 등록 overlay에 `surveyItems`가 있으면 그 체크가 SSOT (0개 선택 허용).
 */
export function resolveGeneralSurveyMenuKeys(input: {
  keys?: readonly string[] | undefined
  overlay?: Record<string, unknown> | undefined
}): GeneralProgramSurveyMenuKey[] {
  const fromOverlay = surveyMenuKeysFromRegistrationOverlay(input.overlay)
  // 빈 배열은 “항목 0개 선택”이다. falsy로 컬럼 키에 떨어지면 안 된다.
  if (fromOverlay !== undefined) return fromOverlay
  return normalizeGeneralSurveyMenuKeys(input.keys ?? [])
}

export function resolveProgramSurveyMenuKeys(program: Pick<Program, 'generalSurveyMenuKeys' | 'registrationOverlay'>): GeneralProgramSurveyMenuKey[] {
  return resolveGeneralSurveyMenuKeys({
    keys: program.generalSurveyMenuKeys,
    overlay: program.registrationOverlay,
  })
}
