/**
 * 일반 프로그램 — 개인 참여자 신청 상세 섹션 노출 조건
 */

import { getGeneralParticipantInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationScheduleParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import type { GeneralIndividualApplicantDetail } from '@/data/mock/general-individual-applications-mock'
import type { Program } from '@/types/domain'

const TEAM_PARTICIPATION_LABEL = '팀'

/** 면접 심사 탭별 상세 섹션 분기 */
export type IndividualApplicantScreeningStage = 'main' | 'doc1' | 'doc_passed' | 'interview2'

/** 참여 방식에 팀이 포함된 개인 프로그램 */
export function isGeneralIndividualTeamParticipationProgram(program: Program | null | undefined): boolean {
  if (!program) return false
  const common = resolveGeneralProgramCommonInfo(program)
  if (common.participationMethod === 'team') return true
  if (common.scheduleDetails?.some(detail => detail.participationMethodLabel === TEAM_PARTICIPATION_LABEL)) {
    return true
  }
  return false
}

function isParticipantInterviewProgram(program: Program | null | undefined): boolean {
  if (!program) return false
  return getGeneralParticipantInterviewEnabled(program)
}

/** 1차 서류 심사 대상자 상세 — 담당자 서류 평가 */
export function shouldShowIndividualManagerEvaluationSection(
  program: Program | null | undefined,
  screeningStage: IndividualApplicantScreeningStage = 'main'
): boolean {
  return isParticipantInterviewProgram(program) && screeningStage === 'doc1'
}

/** 1차 서류 심사·합격자 상세 — 면접 진행 가능 일정 */
export function shouldShowIndividualInterviewAvailabilitySection(
  program: Program | null | undefined,
  screeningStage: IndividualApplicantScreeningStage = 'main'
): boolean {
  if (!isParticipantInterviewProgram(program)) return false
  return screeningStage === 'doc1' || screeningStage === 'doc_passed'
}

/** 2차 면접 대상자 상세 — 면접 평가 */
export function shouldShowIndividualInterviewEvaluationSection(
  program: Program | null | undefined,
  screeningStage: IndividualApplicantScreeningStage = 'main'
): boolean {
  return isParticipantInterviewProgram(program) && screeningStage === 'interview2'
}

/** @deprecated `shouldShowIndividualInterviewAvailabilitySection` + screeningStage 사용 */
export function shouldShowIndividualApplicantInterviewSection(
  program: Program | null | undefined
): boolean {
  return isParticipantInterviewProgram(program)
}

/** 팀 참여 프로그램이거나 신청서에 팀 정보가 있을 때 팀 정보 섹션 노출 */
export function shouldShowIndividualApplicantTeamSection(
  program: Program | null | undefined,
  detail?: GeneralIndividualApplicantDetail | null
): boolean {
  if (isGeneralIndividualTeamParticipationProgram(program)) return true
  return Boolean(detail?.teamName?.trim() || detail?.teamRole)
}

/** 일정형 + 복수 회차가 아닐 때 진행 희망 교육 일정 노출 */
export function shouldShowIndividualApplicantPreferredScheduleSection(
  program: Program | null | undefined
): boolean {
  if (!program) return true
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  return shouldShowInstitutionApplicationScheduleParagraph(bridge)
}
