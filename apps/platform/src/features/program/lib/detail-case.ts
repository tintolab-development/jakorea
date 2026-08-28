/**
 * 프로그램 상세 공개 케이스 (강사·봉사·UJAT·Gemini) SSOT.
 * 목록 탭(category)과 별도로, 상세 phase 라벨·기본정보 필드 세트를 가른다.
 */

import type { CmsProgramLike } from '../model/cms-program.types'
import type { ProgramDetailCase } from '../model/types'

/** QA·mock 고정 id — 상세 케이스 분기 */
export const PROGRAM_DETAIL_CASE_SSOT_IDS = {
  instructor: 'gemini-prog-instructor',
  ujatVolunteer: 'ujat-prog-volunteer',
  ujatParticipant: 'ujat-prog-school',
  gemini: 'gemini-prog-institution',
} as const satisfies Record<string, string>

export type ProgramDetailCaseSsotKey = keyof typeof PROGRAM_DETAIL_CASE_SSOT_IDS

const SSOT_ID_TO_CASE: Record<string, ProgramDetailCase> = {
  [PROGRAM_DETAIL_CASE_SSOT_IDS.instructor]: 'instructor',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer]: 'ujat-volunteer',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant]: 'ujat-participant',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.gemini]: 'gemini',
}

const DETAIL_CASE_ROLE_LABEL: Record<ProgramDetailCase, string> = {
  instructor: '강사',
  volunteer: '봉사자',
  'ujat-volunteer': 'UJAT 봉사자',
  'ujat-participant': '기관',
  gemini: '교육생',
  general: '참여자',
}

/**
 * CMS 스냅샷 → 상세 케이스.
 * id SSOT 우선, 없으면 registrationKind / lifecycle / participantTypes 로 추론.
 */
export function resolveProgramDetailCase(
  program: Pick<
    CmsProgramLike,
    | 'id'
    | 'registrationKind'
    | 'lifecycleStatus'
    | 'generalParticipantTypes'
    | 'ujatProgressStatus'
    | 'category'
  >
): ProgramDetailCase {
  const byId = SSOT_ID_TO_CASE[program.id]
  if (byId) return byId

  if (program.registrationKind === 'gemini') {
    if (program.category === 'instructor') return 'instructor'
    const types = program.generalParticipantTypes ?? []
    if (types.length === 1 && types[0] === 'teacher_instructor') return 'instructor'
    return 'gemini'
  }
  if (program.registrationKind === 'trainedTeachers') return 'instructor'
  if (program.registrationKind === 'ujat') {
    if (program.ujatProgressStatus === 'VOLUNTEER_RECRUITING') return 'ujat-volunteer'
    if (program.ujatProgressStatus === 'PARTICIPANT_RECRUITING') return 'ujat-participant'
    return 'ujat-participant'
  }

  if (program.lifecycleStatus === 'recruiting_instructors') return 'instructor'
  if (program.lifecycleStatus === 'recruiting_volunteers') return 'volunteer'

  const types = program.generalParticipantTypes ?? []
  if (types.length === 1 && types[0] === 'volunteer') return 'volunteer'
  if (types.length === 1 && types[0] === 'teacher_instructor') return 'instructor'

  return 'general'
}

export function recruitmentRoleLabelForCase(detailCase: ProgramDetailCase): string {
  return DETAIL_CASE_ROLE_LABEL[detailCase]
}

/** phase 카드의 1차 모집 기간 라벨 */
export function recruitmentPeriodPhaseLabel(detailCase: ProgramDetailCase): string {
  switch (detailCase) {
    case 'instructor':
      return '강사 모집 기간'
    case 'volunteer':
    case 'ujat-volunteer':
      return '봉사자 모집 기간'
    case 'ujat-participant':
      return '기관 모집 기간'
    case 'gemini':
      return '연수 신청 기간'
    default:
      return '참여자 모집 기간'
  }
}

export function recruitmentPhaseGroupLabel(detailCase: ProgramDetailCase): string {
  switch (detailCase) {
    case 'gemini':
      return '신청 및 연수 기간'
    case 'ujat-volunteer':
    case 'volunteer':
      return '모집 및 선발 일정'
    case 'ujat-participant':
      return '기관 모집 일정'
    case 'instructor':
      return '모집 및 선발 일정'
    default:
      return '모집 및 선별 기간'
  }
}

/** 서류·면접 phase를 노출할 수 있는 케이스 (기획: 면접 있는 모집 유형) */
export function isInterviewCapableCase(detailCase: ProgramDetailCase): boolean {
  return (
    detailCase === 'general' ||
    detailCase === 'volunteer' ||
    detailCase === 'ujat-volunteer' ||
    detailCase === 'instructor'
  )
}

/**
 * 면접 있는 경우에만 1차 서류·2차 면접 기간 노출.
 * - interviewEnabled === false | 'no' → 숨김
 * - interviewEnabled === true | 'yes' → 노출
 * - 미설정: 서류/면접 일정 필드가 하나라도 있을 때만 노출
 */
export function shouldIncludeInterviewStages(
  detailCase: ProgramDetailCase,
  program?: Pick<
    CmsProgramLike,
    | 'interviewEnabled'
    | 'documentPassAnnouncementDate'
    | 'interviewStartDate'
    | 'interviewEndDate'
  >
): boolean {
  if (!isInterviewCapableCase(detailCase)) return false
  if (!program) return true

  const flag = program.interviewEnabled
  if (flag === false || flag === 'no') return false
  if (flag === true || flag === 'yes') return true

  return Boolean(
    program.documentPassAnnouncementDate?.trim() ||
      program.interviewStartDate?.trim() ||
      program.interviewEndDate?.trim()
  )
}
