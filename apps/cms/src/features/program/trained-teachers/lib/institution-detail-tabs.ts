/** 교육받은 교사 — 참여 기관 상세 탭 (신청 목록·진행 현황 공통) */
export const TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS = [
  'application',
  'students',
  'attendance',
  'journal',
] as const

export type TrainedTeachersInstitutionDetailTabKey =
  (typeof TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS)[number]

export const TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS: Record<
  TrainedTeachersInstitutionDetailTabKey,
  string
> = {
  application: '신청 정보',
  students: '학생 명단',
  attendance: '출석 관리',
  journal: '교육 일지',
}

/**
 * navigation `EDUCATION_JOURNAL` / `STUDENT_ROSTER`가 명시적으로 `enabled: false`일 때만 숨김.
 * 모집 정보 「학생 명단 제출 여부」가 제출 필요가 아니면 학생 명단·출석(명단·초상권 동의 연동)도 숨김.
 */
export function getTrainedTeachersInstitutionDetailTabKeys(
  educationJournalEnabled?: boolean,
  studentRosterEnabled?: boolean,
  studentListApplicable?: boolean
): readonly TrainedTeachersInstitutionDetailTabKey[] {
  return TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS.filter(key => {
    if (key === 'journal') return educationJournalEnabled !== false
    if (key === 'students') {
      if (studentRosterEnabled === false) return false
      return studentListApplicable !== false
    }
    if (key === 'attendance') return studentListApplicable !== false
    return true
  })
}

export function normalizeTrainedTeachersInstitutionDetailTab(
  tab: string | null | undefined,
  educationJournalEnabled?: boolean,
  studentListApplicable?: boolean
): TrainedTeachersInstitutionDetailTabKey {
  if (tab === 'students') {
    return studentListApplicable === false ? 'application' : 'students'
  }
  if (tab === 'attendance') {
    return studentListApplicable === false ? 'application' : 'attendance'
  }
  if (tab === 'journal') {
    return educationJournalEnabled === false ? 'application' : 'journal'
  }
  return 'application'
}

export function isTrainedTeachersInstitutionDetailTabKey(
  tab: string
): tab is TrainedTeachersInstitutionDetailTabKey {
  return (TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(tab)
}
