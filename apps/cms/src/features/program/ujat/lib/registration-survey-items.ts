/**
 * UJAT 프로그램 등록 폼 — 설문 진행 항목 4종
 * (일반·1사1교 공통 3종과 분리. 만족도는 봉사단/학교로 나뉨)
 */

import type { GeneralProgramSurveyMenuKey } from '@/types/domain'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'

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
  const legacyCombined =
    o.satisfaction === true ||
    o.student_satisfaction === true ||
    o.teacher_satisfaction === true

  return {
    survey: typeof o.survey === 'boolean' ? o.survey : defaults.survey,
    volunteer_satisfaction:
      typeof o.volunteer_satisfaction === 'boolean'
        ? o.volunteer_satisfaction
        : legacyCombined
          ? true
          : defaults.volunteer_satisfaction,
    school_satisfaction:
      typeof o.school_satisfaction === 'boolean'
        ? o.school_satisfaction
        : legacyCombined
          ? true
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

const SATISFACTION_ALIASES = new Set([
  'satisfaction',
  'student_satisfaction',
  'teacher_satisfaction',
  'volunteer_satisfaction',
  'school_satisfaction',
])

/** BE `generalSurveyMenuKeys` → UJAT overlay `ujat.basicInfo.surveyItems` */
export function ujatSurveyItemsFromProgramKeys(
  keys: readonly string[] | undefined
): Record<UjatSurveyRowId, boolean> {
  const set = new Set(keys ?? [])
  const combinedSatisfaction = [...set].some(key => SATISFACTION_ALIASES.has(key))
  return {
    survey: set.has('survey'),
    volunteer_satisfaction: set.has('volunteer_satisfaction') || combinedSatisfaction,
    school_satisfaction: set.has('school_satisfaction') || combinedSatisfaction,
    lecture_evaluation: set.has('lecture_evaluation'),
  }
}

/** UJAT overlay 설문 체크 → PATCH `generalSurveyMenuKeys` (공통 3종 envelope) */
export function ujatGeneralSurveyMenuKeysFromOverlay(
  overlay: Record<string, unknown>
): GeneralProgramSurveyMenuKey[] | undefined {
  if (!Object.prototype.hasOwnProperty.call(overlay, 'ujat.basicInfo.surveyItems')) {
    return undefined
  }
  const items = readUjatSurveyItems(overlay['ujat.basicInfo.surveyItems'], createUjatSurveyItemsDefault(false))
  const rawKeys: string[] = []
  if (items.survey) rawKeys.push('survey')
  if (items.volunteer_satisfaction) rawKeys.push('volunteer_satisfaction')
  if (items.school_satisfaction) rawKeys.push('school_satisfaction')
  if (items.lecture_evaluation) rawKeys.push('lecture_evaluation')
  return normalizeGeneralSurveyMenuKeys(rawKeys)
}
