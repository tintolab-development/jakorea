/**
 * 신청하기 폼 케이스 ↔ CMS 신청 양식(templateCode) 연동 SSOT.
 *
 * 전제: Platform 「신청하기」는 CMS 프로그램에 등록·연결된 APPLICATION 양식 draft를 렌더한다.
 * mock 단계에서는 동일 templateCode의 form-schema 시드 draft로 대체하고,
 * 개인 팀/일반만 CMS와 같이 teamInfo 단락 가시성으로 분기한다.
 *
 * TODO: 프로그램 `applicationFormTemplateId` / draft API 응답으로 교체.
 */

import type { ProgramDetail, ProgramListItem } from '../model/types.ts'
import { PROGRAM_DETAIL_CASE_SSOT_IDS } from './detail-case.ts'

/** 신청 폼 케이스 (+ 강사 · Gemini 강사 · 교육받은 교사 · UJAT) */
export type ProgramApplyFormCase =
  | 'individual-general'
  | 'individual-team'
  | 'individual-volunteer'
  | 'ujat-volunteer'
  | 'institution-general'
  | 'institution-ujat'
  | 'institution-economy'
  | 'institution-gemini'
  | 'instructor'
  | 'instructor-gemini'
  | 'trained-teachers'

/** CMS APPLICATION templateCode (form-schema / CMS catalog SSOT) */
export type ProgramApplicationTemplateCode =
  | 'application-participant-individual'
  | 'application-volunteer'
  | 'application-ujat-volunteer'
  | 'application-participant-school'
  | 'application-ujat-school'
  | 'application-economy'
  | 'application-gemini-visiting-training-school'
  | 'application-instructor'
  | 'application-gemini-visiting-training-instructor'
  | 'application-trained-teachers'

export type ProgramApplyFormCaseInput = Pick<ProgramListItem | ProgramDetail, 'category' | 'id'> &
  Partial<
    Pick<
      ProgramDetail,
      | 'detailCase'
      | 'participationMethod'
      | 'programType'
      | 'registrationKind'
      | 'programAudience'
      | 'applicationType'
    >
  >

/** QA·mock 고정 id → 신청 폼 케이스 */
export const PROGRAM_APPLY_FORM_CASE_SSOT_IDS = {
  individualGeneral: 'general-prog-type-ind-curriculum-single',
  individualTeam: 'general-prog-type-ind-curriculum-multi',
  individualVolunteer: PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer,
  institutionUjat: PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant,
  institutionGeneral: 'general-prog-type-org-curriculum-single',
  institutionEconomy: 'economy-prog-001',
  institutionGemini: PROGRAM_DETAIL_CASE_SSOT_IDS.gemini,
  instructorGemini: PROGRAM_DETAIL_CASE_SSOT_IDS.instructor,
  trainedTeachers: 'trained-teachers-prog-001',
} as const satisfies Record<string, string>

const APPLY_CASE_TO_TEMPLATE_CODE: Record<
  ProgramApplyFormCase,
  ProgramApplicationTemplateCode
> = {
  'individual-general': 'application-participant-individual',
  'individual-team': 'application-participant-individual',
  'individual-volunteer': 'application-volunteer',
  'ujat-volunteer': 'application-ujat-volunteer',
  'institution-general': 'application-participant-school',
  'institution-ujat': 'application-ujat-school',
  'institution-economy': 'application-economy',
  'institution-gemini': 'application-gemini-visiting-training-school',
  instructor: 'application-instructor',
  'instructor-gemini': 'application-gemini-visiting-training-instructor',
  'trained-teachers': 'application-trained-teachers',
}

const SSOT_ID_TO_APPLY_CASE: Record<string, ProgramApplyFormCase> = {
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualGeneral]: 'individual-general',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualTeam]: 'individual-team',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualVolunteer]: 'ujat-volunteer',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionUjat]: 'institution-ujat',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGeneral]: 'institution-general',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionEconomy]: 'institution-economy',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGemini]: 'institution-gemini',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.instructorGemini]: 'instructor-gemini',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.trainedTeachers]: 'trained-teachers',
}

function isEconomyProgramId(id: string): boolean {
  return id.startsWith('economy-') || id.includes('economy')
}

function isGeminiInstructorProgramId(id: string): boolean {
  return id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor || id.includes('gemini-prog-instructor')
}

function isGeminiProgramId(id: string): boolean {
  return id.startsWith('gemini-prog-')
}

function isGeminiProgram(program: ProgramApplyFormCaseInput): boolean {
  const type = (program.programType ?? '').trim().toUpperCase()
  return (
    type === 'GEMINI_TRAINING' ||
    type === 'GEMINI' ||
    type === 'VISITING_TRAINING' ||
    isGeminiProgramId(program.id)
  )
}

function isUjatProgram(program: ProgramApplyFormCaseInput): boolean {
  if (program.detailCase === 'ujat-participant' || program.detailCase === 'ujat-volunteer') {
    return true
  }
  if (program.registrationKind === 'ujat') return true
  const type = (program.programType ?? '').trim().toUpperCase()
  return type === 'UJAT' || type === 'UJAT_PROGRAM'
}

function isTrainedTeachersProgram(program: ProgramApplyFormCaseInput): boolean {
  if (program.registrationKind === 'trainedTeachers') return true
  if ((program.programType ?? '').trim().toUpperCase() === 'TRAINED_TEACHER') return true
  return (
    program.id.startsWith('trained-teachers-') || program.id.includes('trained-teachers')
  )
}

/**
 * 프로그램 → 신청 폼 케이스.
 * id SSOT 우선, 그다음 detailCase / category / participationMethod.
 * (실연동 시 CMS가 붙인 templateCode·프로그램 설정을 우선하도록 교체)
 */
export function resolveProgramApplyFormCase(
  program: ProgramApplyFormCaseInput
): ProgramApplyFormCase {
  const byId = SSOT_ID_TO_APPLY_CASE[program.id]
  if (byId) return byId

  const applicationType = program.applicationType?.trim().toUpperCase()
  if (applicationType === 'VOLUNTEER') {
    return isUjatProgram(program) ? 'ujat-volunteer' : 'individual-volunteer'
  }
  if (applicationType === 'INSTRUCTOR') {
    if (isUjatProgram(program)) return 'ujat-volunteer'
    return isGeminiProgram(program) ? 'instructor-gemini' : 'instructor'
  }
  if (applicationType === 'INDIVIDUAL') {
    return program.participationMethod === 'team' ? 'individual-team' : 'individual-general'
  }
  if (applicationType === 'ORGANIZATION') {
    if (isTrainedTeachersProgram(program)) return 'trained-teachers'
    if (isGeminiProgram(program)) return 'institution-gemini'
    if (isUjatProgram(program)) return 'institution-ujat'
    if (isEconomyProgramId(program.id)) return 'institution-economy'
    return 'institution-general'
  }

  if (isTrainedTeachersProgram(program)) {
    return 'trained-teachers'
  }

  const detailCase = program.detailCase
  if (detailCase === 'volunteer') {
    return 'individual-volunteer'
  }
  if (
    detailCase === 'ujat-volunteer' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer
  ) {
    return 'ujat-volunteer'
  }

  if (isGeminiInstructorProgramId(program.id) || (detailCase === 'instructor' && isGeminiProgramId(program.id))) {
    return 'instructor-gemini'
  }

  if (detailCase === 'instructor') {
    return 'instructor'
  }

  if (detailCase === 'gemini' || isGeminiProgramId(program.id)) {
    return 'institution-gemini'
  }

  if (isEconomyProgramId(program.id)) {
    return 'institution-economy'
  }

  if (
    detailCase === 'ujat-participant' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant
  ) {
    return 'institution-ujat'
  }

  if (program.category === 'instructor') {
    return 'instructor'
  }

  /** CMS 개인 프로그램 — portal category 가 institution 이어도 개인 신청 양식을 쓴다. */
  if (program.programAudience === 'individual') {
    return program.participationMethod === 'team' ? 'individual-team' : 'individual-general'
  }

  if (program.category === 'institution') {
    return 'institution-general'
  }

  // CMS: participationMethod === 'team' → teamInfo 노출
  if (program.participationMethod === 'team') {
    return 'individual-team'
  }

  return 'individual-general'
}

/** 케이스 → CMS APPLICATION templateCode */
export function getApplicationTemplateCodeForApplyCase(
  applyCase: ProgramApplyFormCase
): ProgramApplicationTemplateCode {
  return APPLY_CASE_TO_TEMPLATE_CODE[applyCase]
}

/** CMS와 동일: 개인 팀 참여일 때만 teamInfo 단락 노출 */
export function shouldShowIndividualTeamInfoParagraph(
  applyCase: ProgramApplyFormCase
): boolean {
  return applyCase === 'individual-team'
}

export function isVolunteerApplyFormCase(
  applyCase: ProgramApplyFormCase | null | undefined
): boolean {
  return applyCase === 'individual-volunteer' || applyCase === 'ujat-volunteer'
}

export function isUjatInstitutionApplyFormCase(
  applyCase: ProgramApplyFormCase | null | undefined
): boolean {
  return applyCase === 'institution-ujat'
}
