import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'

export type UjatSurveyProgressStatus = 'before_start' | 'in_progress' | 'finished'

export type UjatRegisteredSurvey = RegisteredSurvey

export type UjatSatisfactionAudienceKey = 'teacher' | 'volunteer_h1' | 'volunteer_h2'

export const UJAT_SATISFACTION_AUDIENCE_TABS = [
  { key: 'teacher', label: '교사' },
  { key: 'volunteer_h1', label: '상반기 봉사자' },
  { key: 'volunteer_h2', label: '하반기 봉사자' },
] as const satisfies ReadonlyArray<{ key: UjatSatisfactionAudienceKey; label: string }>

export const UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE: Record<UjatSatisfactionAudienceKey, string> = {
  teacher: 'survey-teacher',
  volunteer_h1: 'survey-student',
  volunteer_h2: 'survey-student',
}

export type UjatSatisfactionSurveyByAudience = Partial<
  Record<UjatSatisfactionAudienceKey, UjatRegisteredSurvey>
>

const SATISFACTION_AUDIENCE_LABEL: Record<UjatSatisfactionAudienceKey, string> = {
  teacher: '교사',
  volunteer_h1: '상반기 봉사자',
  volunteer_h2: '하반기 봉사자',
}

export function getSatisfactionAudienceLabel(audience: UjatSatisfactionAudienceKey): string {
  return SATISFACTION_AUDIENCE_LABEL[audience]
}

export function getSatisfactionNoResponseTitle(audience: UjatSatisfactionAudienceKey): string {
  return `${getSatisfactionAudienceLabel(audience)}용 만족도조사는 아직 진행 전입니다.`
}

export function getSatisfactionDeleteModalSubject(audience: UjatSatisfactionAudienceKey): string {
  return `${getSatisfactionAudienceLabel(audience)} 만족도조사`
}

export function getSatisfactionAudienceTabs(): typeof UJAT_SATISFACTION_AUDIENCE_TABS {
  return UJAT_SATISFACTION_AUDIENCE_TABS
}

export function isUjatSatisfactionSurveyTab(tab: string): boolean {
  return (
    tab === 'survey-satisfaction' ||
    tab === 'survey-volunteer-satisfaction' ||
    tab === 'survey-school-satisfaction'
  )
}

/** 공통 정보 > 설문 진행 항목 중 만족도조사 체크 (봉사단 → 상·하반기 봉사자 탭, 학교 → 교사 탭) */
export type UjatSatisfactionSurveyItemFlags = {
  volunteer_satisfaction: boolean
  school_satisfaction: boolean
}

export function getSatisfactionAudienceTabsForSurveyTab(
  tab: string,
  surveyItems?: UjatSatisfactionSurveyItemFlags
): readonly { key: UjatSatisfactionAudienceKey; label: string }[] {
  if (tab === 'survey-volunteer-satisfaction') {
    return UJAT_SATISFACTION_AUDIENCE_TABS.filter(item => item.key !== 'teacher')
  }
  if (tab === 'survey-school-satisfaction') {
    return UJAT_SATISFACTION_AUDIENCE_TABS.filter(item => item.key === 'teacher')
  }
  if (surveyItems != null) {
    // 묶인 「만족도조사」 화면 — 등록 때 고른 쪽 탭만 노출(봉사단/학교 중 하나만 골랐을 때 기존 노출 조건 유지)
    const filtered = UJAT_SATISFACTION_AUDIENCE_TABS.filter(item =>
      item.key === 'teacher' ? surveyItems.school_satisfaction : surveyItems.volunteer_satisfaction
    )
    if (filtered.length > 0) return filtered
  }
  return UJAT_SATISFACTION_AUDIENCE_TABS
}

export function defaultSatisfactionAudienceForSurveyTab(
  tab: string,
  surveyItems?: UjatSatisfactionSurveyItemFlags
): UjatSatisfactionAudienceKey {
  return getSatisfactionAudienceTabsForSurveyTab(tab, surveyItems)[0]?.key ?? 'teacher'
}

export type UjatSatisfactionBindingTargetRole = 'TEACHER' | 'VOLUNTEER_H1' | 'VOLUNTEER_H2'

/** SATISFACTION form-binding `targetRole` — UJAT 봉사단/학교 탭 분기와 동일 */
export function resolveUjatSatisfactionBindingTargetRole(
  audience: UjatSatisfactionAudienceKey
): UjatSatisfactionBindingTargetRole {
  if (audience === 'teacher') return 'TEACHER'
  if (audience === 'volunteer_h2') return 'VOLUNTEER_H2'
  return 'VOLUNTEER_H1'
}
