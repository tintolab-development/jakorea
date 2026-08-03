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

/** 신청 폼 6케이스 (+ 강사 등 CMS 템플릿 유지용) */
export type ProgramApplyFormCase =
  | 'individual-general'
  | 'individual-team'
  | 'individual-volunteer'
  | 'institution-general'
  | 'institution-economy'
  | 'institution-gemini'
  /** 6케이스 밖 — CMS `application-instructor` */
  | 'instructor'

/** CMS APPLICATION templateCode (form-schema / CMS catalog SSOT) */
export type ProgramApplicationTemplateCode =
  | 'application-participant-individual'
  | 'application-volunteer'
  | 'application-participant-school'
  | 'application-economy'
  | 'application-gemini-visiting-training-school'
  | 'application-instructor'

export type ProgramApplyFormCaseInput = Pick<ProgramListItem | ProgramDetail, 'category' | 'id'> &
  Partial<Pick<ProgramDetail, 'detailCase' | 'participationMethod'>>

/** QA·mock 고정 id → 신청 폼 케이스 */
export const PROGRAM_APPLY_FORM_CASE_SSOT_IDS = {
  individualGeneral: 'general-prog-type-ind-curriculum-single',
  individualTeam: 'general-prog-type-ind-curriculum-multi',
  individualVolunteer: PROGRAM_DETAIL_CASE_SSOT_IDS.volunteer,
  institutionGeneral: 'general-prog-type-org-curriculum-single',
  institutionEconomy: 'economy-prog-001',
  institutionGemini: PROGRAM_DETAIL_CASE_SSOT_IDS.gemini,
} as const satisfies Record<string, string>

const APPLY_CASE_TO_TEMPLATE_CODE: Record<
  ProgramApplyFormCase,
  ProgramApplicationTemplateCode
> = {
  'individual-general': 'application-participant-individual',
  'individual-team': 'application-participant-individual',
  'individual-volunteer': 'application-volunteer',
  'institution-general': 'application-participant-school',
  'institution-economy': 'application-economy',
  'institution-gemini': 'application-gemini-visiting-training-school',
  instructor: 'application-instructor',
}

const SSOT_ID_TO_APPLY_CASE: Record<string, ProgramApplyFormCase> = {
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualGeneral]: 'individual-general',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualTeam]: 'individual-team',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.individualVolunteer]: 'individual-volunteer',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGeneral]: 'institution-general',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionEconomy]: 'institution-economy',
  [PROGRAM_APPLY_FORM_CASE_SSOT_IDS.institutionGemini]: 'institution-gemini',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.instructor]: 'instructor',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer]: 'individual-volunteer',
  [PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant]: 'institution-general',
}

function isEconomyProgramId(id: string): boolean {
  return id.startsWith('economy-') || id.includes('economy')
}

function isGeminiProgramId(id: string): boolean {
  return id.startsWith('gvt-recruitment-')
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

  const detailCase = program.detailCase
  if (
    detailCase === 'volunteer' ||
    detailCase === 'ujat-volunteer' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.volunteer ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer
  ) {
    return 'individual-volunteer'
  }

  if (detailCase === 'instructor' || program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor) {
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
    return 'institution-general'
  }

  if (program.category === 'institution') {
    return 'institution-general'
  }

  if (program.category === 'instructor') {
    return 'instructor'
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
