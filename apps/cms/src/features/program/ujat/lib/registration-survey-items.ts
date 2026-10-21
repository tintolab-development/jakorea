/**
 * UJAT 프로그램 등록 폼 — 설문 진행 항목 4종
 * (일반·1사1교 공통 3종과 분리. 만족도는 봉사단/학교로 나뉨)
 */

export const UJAT_REGISTRATION_SURVEY_ITEM_IDS = [
  'survey',
  'volunteer_satisfaction',
  'school_satisfaction',
  'lecture_evaluation',
] as const

export type UjatSurveyRowId = (typeof UJAT_REGISTRATION_SURVEY_ITEM_IDS)[number]

export const UJAT_REGISTRATION_SURVEY_ITEM_LABELS: Record<UjatSurveyRowId, string> = {
  survey: '설문조사',
  volunteer_satisfaction: '봉사단 만족도조사',
  school_satisfaction: '학교 만족도조사',
  lecture_evaluation: '강의평가',
}

export const UJAT_SURVEY_MENU_KEY_BY_ITEM: Record<UjatSurveyRowId, string> = {
  survey: 'survey-poll',
  volunteer_satisfaction: 'survey-volunteer-satisfaction',
  school_satisfaction: 'survey-school-satisfaction',
  lecture_evaluation: 'survey-lecture-eval',
}

export function createUjatSurveyItemsDefault(
  allOn = true
): Record<UjatSurveyRowId, boolean> {
  return {
    survey: allOn,
    volunteer_satisfaction: allOn,
    school_satisfaction: allOn,
    lecture_evaluation: allOn,
  }
}

export function readUjatSurveyItems(
  raw: unknown,
  defaults: Record<UjatSurveyRowId, boolean> = createUjatSurveyItemsDefault()
): Record<UjatSurveyRowId, boolean> {
  if (!raw || typeof raw !== 'object') return { ...defaults }
  const o = raw as Record<string, unknown>

  return {
    survey: typeof o.survey === 'boolean' ? o.survey : defaults.survey,
    volunteer_satisfaction:
      typeof o.volunteer_satisfaction === 'boolean'
        ? o.volunteer_satisfaction
        : defaults.volunteer_satisfaction,
    school_satisfaction:
      typeof o.school_satisfaction === 'boolean'
        ? o.school_satisfaction
        : defaults.school_satisfaction,
    lecture_evaluation:
      typeof o.lecture_evaluation === 'boolean' ? o.lecture_evaluation : defaults.lecture_evaluation,
  }
}

export function resolveUjatSurveyItemsText(
  surveyItems: Record<UjatSurveyRowId, boolean>
): string {
  const labels = UJAT_REGISTRATION_SURVEY_ITEM_IDS.filter(id => surveyItems[id]).map(
    id => UJAT_REGISTRATION_SURVEY_ITEM_LABELS[id]
  )
  return labels.length > 0 ? labels.join(', ') : '-'
}

/** UJAT 저장 키. 일반 프로그램 3종(`satisfaction` 단일)과 달리 봉사단/학교를 유지한다. */
export type UjatPersistedSurveyMenuKey =
  | 'survey'
  | 'volunteer_satisfaction'
  | 'school_satisfaction'
  | 'lecture_evaluation'

function hasKey(set: Set<string>, keys: readonly string[]): boolean {
  return keys.some(key => set.has(key))
}

/**
 * `generalSurveyMenuKeys` · Primary `surveyMenuKeys`(LNB id) → overlay 4종.
 * `satisfaction` 한 키는 봉사단·학교로 펼치지 않는다.
 */
export function ujatSurveyItemsFromProgramKeys(
  keys: readonly string[] | undefined
): Record<UjatSurveyRowId, boolean> {
  const set = new Set(keys ?? [])
  return {
    survey: hasKey(set, ['survey', 'survey-poll']),
    volunteer_satisfaction: hasKey(set, [
      'volunteer_satisfaction',
      'survey-volunteer-satisfaction',
      'survey-satisfaction',
      'survey-student-satisfaction',
    ]),
    school_satisfaction: hasKey(set, [
      'school_satisfaction',
      'survey-school-satisfaction',
      'survey-teacher-satisfaction',
    ]),
    lecture_evaluation: hasKey(set, ['lecture_evaluation', 'survey-lecture-eval']),
  }
}

export function normalizeUjatSurveyMenuKeys(
  keys: readonly string[]
): UjatPersistedSurveyMenuKey[] {
  return ujatPersistedSurveyMenuKeysFromItems(ujatSurveyItemsFromProgramKeys(keys))
}

export function ujatPersistedSurveyMenuKeysFromItems(
  items: Record<UjatSurveyRowId, boolean>
): UjatPersistedSurveyMenuKey[] {
  const result: UjatPersistedSurveyMenuKey[] = []
  if (items.survey) result.push('survey')
  if (items.volunteer_satisfaction) result.push('volunteer_satisfaction')
  if (items.school_satisfaction) result.push('school_satisfaction')
  if (items.lecture_evaluation) result.push('lecture_evaluation')
  return result
}

/** 봉사단/학교 체크가 boolean으로 있으면 4종 SSOT. 3종 `satisfaction`만 있는 객체는 제외. */
export function hasExplicitUjatSurveySplit(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const o = raw as Record<string, unknown>
  return (
    typeof o.volunteer_satisfaction === 'boolean' || typeof o.school_satisfaction === 'boolean'
  )
}

/** UJAT overlay 설문 체크 → `generalSurveyMenuKeys` (4종, 만족도 합치지 않음) */
export function ujatGeneralSurveyMenuKeysFromOverlay(
  overlay: Record<string, unknown>
): UjatPersistedSurveyMenuKey[] | undefined {
  if (!Object.prototype.hasOwnProperty.call(overlay, 'ujat.basicInfo.surveyItems')) {
    return undefined
  }
  const items = readUjatSurveyItems(
    overlay['ujat.basicInfo.surveyItems'],
    createUjatSurveyItemsDefault(false)
  )
  return ujatPersistedSurveyMenuKeysFromItems(items)
}

/** 공통정보 저장 — overlay 4종 우선, 없으면 기존 키를 4종으로 정규화. `satisfaction`으로 접지 않음. */
export function resolveUjatPersistedSurveyMenuKeysForSave(
  overlay: Record<string, unknown> | undefined,
  existingKeys: readonly string[] | undefined
): UjatPersistedSurveyMenuKey[] | undefined {
  const fromOverlay = overlay ? ujatGeneralSurveyMenuKeysFromOverlay(overlay) : undefined
  if (fromOverlay) return fromOverlay
  if (existingKeys) return normalizeUjatSurveyMenuKeys(existingKeys)
  return undefined
}
