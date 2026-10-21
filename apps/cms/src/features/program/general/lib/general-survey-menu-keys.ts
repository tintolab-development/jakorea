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
  'trainedTeachersRegistration.basicInfo.surveyItems',
] as const

/** `generalSurveyMenuKeys` → overlay surveyItems 체크맵 */
export function surveyItemsRecordFromMenuKeys(
  keys: readonly string[] | undefined
): Record<'survey' | 'satisfaction' | 'lecture_evaluation', boolean> {
  const normalized = normalizeGeneralSurveyMenuKeys(keys ?? [])
  return {
    survey: normalized.includes('survey'),
    satisfaction: normalized.includes('satisfaction'),
    lecture_evaluation: normalized.includes('lecture_evaluation'),
  }
}

/**
 * LNB·등록 overlay SSOT 맞춤 — 알려진 surveyItems 키를 keys와 동일하게 덮어쓴다.
 * (공통정보에서 설문 항목만 바꾸면 keys는 갱신되고 overlay는 구값으로 남아 LNB가 비는 갭 방지)
 */
export function syncSurveyItemsIntoRegistrationOverlay(
  overlay: Record<string, unknown> | undefined,
  keys: readonly string[] | undefined
): Record<string, unknown> | undefined {
  const items = surveyItemsRecordFromMenuKeys(keys)
  const next: Record<string, unknown> = { ...(overlay ?? {}) }
  const writeKeys = new Set<string>()
  for (const key of SURVEY_ITEMS_OVERLAY_KEYS) {
    if (key in next) writeKeys.add(key)
  }
  // TT·공통 등록 경로는 항상 이 두 키를 맞춤 (economy는 기존에 있을 때만)
  writeKeys.add('generalRegistration.basicInfo.surveyItems')
  writeKeys.add('trainedTeachersRegistration.basicInfo.surveyItems')
  for (const key of writeKeys) {
    next[key] = { ...items }
  }
  return Object.keys(next).length > 0 ? next : undefined
}

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
 * `generalSurveyMenuKeys`가 있으면(빈 배열 포함) LNB SSOT.
 * 키가 없을 때만 등록 overlay `surveyItems` 체크를 쓴다.
 */
export function resolveGeneralSurveyMenuKeys(input: {
  keys?: readonly string[] | undefined
  overlay?: Record<string, unknown> | undefined
}): GeneralProgramSurveyMenuKey[] {
  if (input.keys !== undefined) {
    return normalizeGeneralSurveyMenuKeys(input.keys)
  }
  const fromOverlay = surveyMenuKeysFromRegistrationOverlay(input.overlay)
  if (fromOverlay !== undefined) return fromOverlay
  return []
}

export function resolveProgramSurveyMenuKeys(
  program: Pick<Program, 'generalSurveyMenuKeys' | 'registrationOverlay'>
): GeneralProgramSurveyMenuKey[] {
  return resolveGeneralSurveyMenuKeys({
    keys: program.generalSurveyMenuKeys,
    overlay: program.registrationOverlay,
  })
}
