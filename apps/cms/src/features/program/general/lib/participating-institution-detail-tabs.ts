import type { Program } from '@/types/domain'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS,
  type TrainedTeachersInstitutionDetailTabKey,
  normalizeTrainedTeachersInstitutionDetailTab,
  isTrainedTeachersInstitutionDetailTabKey,
} from '@/features/program/trained-teachers/lib/institution-detail-tabs'

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

/** 학생 명단·출석 관리 탭 — 모집 정보 「학생 명단 제출 여부」가 제출 필요가 아니면 숨김 */
export const STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS = [
  'students',
  'attendance',
] as const satisfies readonly GeneralParticipatingInstitutionDetailTabKey[]

export type StudentListDependentInstitutionDetailTabKey =
  (typeof STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS)[number]

type ParticipatingInstitutionDetailTabSource = {
  studentListRequired?: Program['studentListRequired']
  generalParticipantTypes?: Program['generalParticipantTypes']
  generalProgramAudience?: Program['generalProgramAudience']
  category?: Program['category']
  generalCommonInfo?: Program['generalCommonInfo']
} | null

function readStudentListRequiredFlag(
  value: unknown
): Program['studentListRequired'] | undefined {
  if (value === 'required' || value === true) return 'required'
  if (value === 'not_required' || value === false) return 'not_required'
  return undefined
}

/** 모집 정보 `participantRecruitmentInfo` 우선, 없으면 프로그램 루트 값 */
function resolveParticipatingInstitutionStudentListRequired(
  program?: ParticipatingInstitutionDetailTabSource
): Program['studentListRequired'] | undefined {
  const info = program?.generalCommonInfo?.participantRecruitmentInfo
  const fromRecruitment = readStudentListRequiredFlag(info?.studentListRequired)
  if (fromRecruitment) return fromRecruitment
  const fromProgram = readStudentListRequiredFlag(program?.studentListRequired)
  if (fromProgram) return fromProgram
  const label = info?.studentListRequiredLabel?.trim()
  if (label === '제출 필요') return 'required'
  if (label === '제출 불필요') return 'not_required'
  return undefined
}

/** 프로그램 모집 정보 「학생 명단 제출 여부」가 제출 필요인 경우만 */
export function isParticipatingInstitutionStudentListApplicable(
  program?: ParticipatingInstitutionDetailTabSource
): boolean {
  return resolveParticipatingInstitutionStudentListRequired(program) === 'required'
}

/** 공통 정보 참여자 유형에 강사(`teacher_instructor`)가 있는 경우 */
export function isParticipatingInstitutionInstructorAssignmentApplicable(
  program?: ParticipatingInstitutionDetailTabSource
): boolean {
  if (!program) return false
  if (program.generalParticipantTypes?.length) {
    return program.generalParticipantTypes.includes('teacher_instructor')
  }
  if (
    program.generalProgramAudience === 'individual' ||
    program.generalProgramAudience === 'organization'
  ) {
    return false
  }
  return program.category === 'instructor'
}

export function isStudentListDependentInstitutionDetailTab(
  tab: GeneralParticipatingInstitutionDetailTabKey
): tab is StudentListDependentInstitutionDetailTabKey {
  return (STUDENT_LIST_DEPENDENT_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(tab)
}

export function getGeneralParticipatingInstitutionDetailTabKeys(
  program?: ParticipatingInstitutionDetailTabSource,
  studentRosterEnabled?: boolean
): readonly GeneralParticipatingInstitutionDetailTabKey[] {
  const studentListApplicable = isParticipatingInstitutionStudentListApplicable(program)
  const instructorAssignmentApplicable =
    isParticipatingInstitutionInstructorAssignmentApplicable(program)
  return GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS.filter(key => {
    if (key === 'students' && studentRosterEnabled === false) return false
    if (key === 'instructors' && !instructorAssignmentApplicable) return false
    return studentListApplicable || !isStudentListDependentInstitutionDetailTab(key)
  })
}

export function normalizeGeneralParticipatingInstitutionDetailTab(
  tab: GeneralParticipatingInstitutionDetailTabKey,
  program?: ParticipatingInstitutionDetailTabSource
): GeneralParticipatingInstitutionDetailTabKey {
  if (
    !isParticipatingInstitutionStudentListApplicable(program) &&
    isStudentListDependentInstitutionDetailTab(tab)
  ) {
    return 'application'
  }
  if (tab === 'instructors' && !isParticipatingInstitutionInstructorAssignmentApplicable(program)) {
    return 'application'
  }
  return tab
}

export type ParticipatingInstitutionDetailTabKey =
  | GeneralParticipatingInstitutionDetailTabKey
  | TrainedTeachersInstitutionDetailTabKey

/** 프로그램 유형별 참여 기관 상세 탭 — TT는 신청 정보 | 교육 일지만 */
export function getParticipatingInstitutionDetailTabKeys(
  program?: Program | null
): readonly ParticipatingInstitutionDetailTabKey[] {
  if (isTrainedTeachersDetailProgram(program ?? null)) {
    return TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS
  }
  return getGeneralParticipatingInstitutionDetailTabKeys(program)
}

export function normalizeParticipatingInstitutionDetailTab(
  tab: string | null | undefined,
  program?: Program | null,
  educationJournalEnabled?: boolean
): ParticipatingInstitutionDetailTabKey {
  if (isTrainedTeachersDetailProgram(program ?? null)) {
    return normalizeTrainedTeachersInstitutionDetailTab(tab, educationJournalEnabled)
  }
  const generalTab = (tab ?? 'application') as GeneralParticipatingInstitutionDetailTabKey
  if (
    !(GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(generalTab)
  ) {
    return 'application'
  }
  return normalizeGeneralParticipatingInstitutionDetailTab(generalTab, program)
}

export function isParticipatingInstitutionDetailTabKeyForProgram(
  tab: string,
  program?: Program | null
): tab is ParticipatingInstitutionDetailTabKey {
  if (isTrainedTeachersDetailProgram(program ?? null)) {
    return isTrainedTeachersInstitutionDetailTabKey(tab)
  }
  return (GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(tab)
}
