/**
 * 일반 프로그램 상세 LNB 분기용 메타 (mock · 등록 폼 필드 대응)
 */

import type {
  GeneralProgramParticipantType,
  GeneralProgramSurveyMenuKey,
  Program,
  ProgramCategory,
} from '@/types/domain'
import { getGeneralProgramById, getGeneralPrograms } from '@/data/mock/general-programs'
import {
  findGeneralRegistrationLocalSaveProgramById,
  GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/general/lib/registration-local-save'
import { PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS } from '@/features/template/lib/program-registration-survey-items'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import type { GeneralProgressTabKey } from '@/features/program/general/lib/progress-tabs'
import {
  programHasGeneralSatisfactionSurvey,
  GENERAL_SATISFACTION_NAV_TAB,
} from '@/features/program/general/lib/survey-audience'

export type GeneralSurveyNavKey = GeneralProgramSurveyMenuKey | typeof GENERAL_SATISFACTION_NAV_TAB

export type GeneralSurveyMenuItem = { key: GeneralSurveyNavKey; label: string }

export type GeneralProgressMenuItem = { tab: GeneralProgressTabKey; label: string }

const SURVEY_MENU_LABELS: Record<GeneralProgramSurveyMenuKey, string> =
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS

const CATEGORY_TO_PARTICIPANT: Record<ProgramCategory, GeneralProgramParticipantType> = {
  school: 'school_institution',
  individual: 'individual',
  instructor: 'teacher_instructor',
  volunteer: 'volunteer',
}

export function isGeneralProgramId(programId: string): boolean {
  return (
    getGeneralPrograms().some(p => p.id === programId) ||
    programId.startsWith(GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
  )
}

export function resolveGeneralProgramForDetail(programId: string): Program | undefined {
  return getGeneralProgramById(programId) ?? findGeneralRegistrationLocalSaveProgramById(programId)
}

export function getGeneralParticipantTypes(program: Program): GeneralProgramParticipantType[] {
  if (program.generalParticipantTypes?.length) return [...program.generalParticipantTypes]
  return [CATEGORY_TO_PARTICIPANT[program.category]]
}

export function hasGeneralInstructorApplications(program: Program): boolean {
  return getGeneralParticipantTypes(program).includes('teacher_instructor')
}

export function hasGeneralVolunteerApplications(program: Program): boolean {
  return getGeneralParticipantTypes(program).includes('volunteer')
}

/** true면 개인 참여자 신청 LNB에 면접 단계 2뎁스 노출 */
export function getGeneralParticipantInterviewEnabled(program: Program): boolean {
  if (!isGeneralIndividualProgram(program)) return false
  if (program.generalParticipantInterviewEnabled != null) {
    return program.generalParticipantInterviewEnabled
  }
  return program.generalCommonInfo?.participantRecruitmentInfo?.interviewEnabled === true
}

/** true면 봉사자 신청 LNB에 면접 단계 2뎁스 노출 */
export function getGeneralVolunteerInterviewEnabled(program: Program): boolean {
  if (program.generalVolunteerInterviewEnabled != null) {
    return program.generalVolunteerInterviewEnabled
  }
  return Boolean(
    program.interviewStartDate ||
      program.interviewEndDate ||
      program.interviewMethod?.trim()
  )
}

export function getGeneralSurveyMenuItems(program: Program): GeneralSurveyMenuItem[] {
  const keys = normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? [])
  const items: GeneralSurveyMenuItem[] = []

  if (keys.includes('survey')) {
    items.push({ key: 'survey', label: SURVEY_MENU_LABELS.survey })
  }
  if (programHasGeneralSatisfactionSurvey(program)) {
    items.push({ key: GENERAL_SATISFACTION_NAV_TAB, label: '만족도조사' })
  }
  if (keys.includes('lecture_evaluation')) {
    items.push({ key: 'lecture_evaluation', label: SURVEY_MENU_LABELS.lecture_evaluation })
  }

  return items
}

/** LNB·breadcrumb — 기관 대분류 프로그램 */
export const GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL = '기관 신청 목록'

/** LNB·breadcrumb — 개인 대분류(개인 포함) 프로그램 */
export const GENERAL_PARTICIPANT_APPLICATIONS_LNB_LABEL = '참여자 신청 목록'

/** 참여자 유형(대분류)에 따른 신청 목록 LNB 라벨 */
export function getGeneralParticipantApplicationsLnbLabel(program: Program): string {
  return isGeneralIndividualProgram(program)
    ? GENERAL_PARTICIPANT_APPLICATIONS_LNB_LABEL
    : GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL
}

/** 프로그램 진행 현황 LNB 2depth — 교육진행자 유형별 (개인 대분류 참여자 탭 없음) */
export function getGeneralProgressMenuItems(program: Program): GeneralProgressMenuItem[] {
  const types = getGeneralParticipantTypes(program)
  const items: GeneralProgressMenuItem[] = []

  if (types.includes('school_institution')) {
    items.push({
      tab: 'progress_participants',
      label: '참여 기관',
    })
  }
  if (types.includes('teacher_instructor')) {
    items.push({ tab: 'progress_instructors', label: '참여 강사' })
  }
  if (types.includes('volunteer')) {
    items.push({ tab: 'progress_volunteers', label: '참여 봉사자' })
  }

  return items
}
