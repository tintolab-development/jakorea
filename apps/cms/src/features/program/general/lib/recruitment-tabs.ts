/** 일반 프로그램 상세 — 모집 정보 서브탭 (레거시 `TabKey` institutions/instructors/volunteers 와 동일) */

export const GENERAL_RECRUIT_TAB_KEYS = ['institutions', 'instructors', 'volunteers'] as const
export type GeneralRecruitTabKey = (typeof GENERAL_RECRUIT_TAB_KEYS)[number]

export const GENERAL_RECRUIT_TAB_LABELS: Record<GeneralRecruitTabKey, string> = {
  institutions: '참여자 모집 정보',
  instructors: '강사 모집 정보',
  volunteers: '봉사자 모집 정보',
}

export function generalRecruitTabItems(options: {
  showInstructor: boolean
  showVolunteer: boolean
  /** 일반(기관)은 「참여 기관 모집 정보」 */
  institutionsLabel?: string
}): { key: GeneralRecruitTabKey; label: string }[] {
  const institutionsLabel = options.institutionsLabel ?? GENERAL_RECRUIT_TAB_LABELS.institutions
  return GENERAL_RECRUIT_TAB_KEYS.filter(key => {
    if (key === 'instructors') return options.showInstructor
    if (key === 'volunteers') return options.showVolunteer
    return true
  }).map(key => ({
    key,
    label: key === 'institutions' ? institutionsLabel : GENERAL_RECRUIT_TAB_LABELS[key],
  }))
}

export function normalizeGeneralRecruitTab(
  tab: string | null | undefined,
  options: { showInstructor: boolean; showVolunteer: boolean }
): GeneralRecruitTabKey {
  if (tab === 'instructors' && options.showInstructor) return 'instructors'
  if (tab === 'volunteers' && options.showVolunteer) return 'volunteers'
  return 'institutions'
}
