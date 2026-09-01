/** 교육받은 교사 — 참여 기관 상세 탭 (신청 목록·진행 현황 공통) */
export const TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS = ['application', 'journal'] as const

export type TrainedTeachersInstitutionDetailTabKey =
  (typeof TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS)[number]

export const TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS: Record<
  TrainedTeachersInstitutionDetailTabKey,
  string
> = {
  application: '신청 정보',
  journal: '교육 일지',
}

export function normalizeTrainedTeachersInstitutionDetailTab(
  tab: string | null | undefined
): TrainedTeachersInstitutionDetailTabKey {
  if (tab === 'journal') return 'journal'
  return 'application'
}

export function isTrainedTeachersInstitutionDetailTabKey(
  tab: string
): tab is TrainedTeachersInstitutionDetailTabKey {
  return (TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(tab)
}
