import type { Program } from '@/types/domain'

/** 일반 프로그램 참여 기관 상세 탭 (UJAT 상세 탭과 별도) */
export const GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS = [
  'application',
  'students',
  'instructors',
  'attendance',
  'posts',
] as const

export type GeneralParticipatingInstitutionDetailTabKey =
  (typeof GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS)[number]

/** 학생 명단·출석 관리 탭 — `studentListRequired === 'not_required'`이면 숨김 */
export const STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS = [
  'students',
  'attendance',
] as const satisfies readonly GeneralParticipatingInstitutionDetailTabKey[]

export type StudentListDependentInstitutionDetailTabKey =
  (typeof STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS)[number]

/** 프로그램 모집 설정 「학생 명단 제출 여부」가 필요인 경우 */
export function isParticipatingInstitutionStudentListApplicable(
  program?: Pick<Program, 'studentListRequired'> | null
): boolean {
  return program?.studentListRequired !== 'not_required'
}

export function isStudentListDependentInstitutionDetailTab(
  tab: GeneralParticipatingInstitutionDetailTabKey
): tab is StudentListDependentInstitutionDetailTabKey {
  return (STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(tab)
}

export function getGeneralParticipatingInstitutionDetailTabKeys(
  program?: Pick<Program, 'studentListRequired'> | null
): readonly GeneralParticipatingInstitutionDetailTabKey[] {
  if (isParticipatingInstitutionStudentListApplicable(program)) {
    return GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS
  }
  return GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS.filter(
    key => !isStudentListDependentInstitutionDetailTab(key)
  )
}

export function normalizeGeneralParticipatingInstitutionDetailTab(
  tab: GeneralParticipatingInstitutionDetailTabKey,
  program?: Pick<Program, 'studentListRequired'> | null
): GeneralParticipatingInstitutionDetailTabKey {
  if (
    !isParticipatingInstitutionStudentListApplicable(program) &&
    isStudentListDependentInstitutionDetailTab(tab)
  ) {
    return 'application'
  }
  return tab
}
