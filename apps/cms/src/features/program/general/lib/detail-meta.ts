/**
 * 일반 프로그램 상세 LNB 분기용 메타 (mock · 등록 폼 필드 대응)
 */

import type {
  GeneralProgramParticipantType,
  GeneralProgramSurveyMenuKey,
  Program,
  ProgramCategory,
} from '@/types/domain'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import {
  findGeneralRegistrationLocalSaveProgramById,
  GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/general/lib/registration-local-save'
import { getTempMockOrgProgramIfId } from '@/features/program/general/lib/temp-mock-org-program'
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

export function isGeneralProgramId(programId: string, knownPrograms?: readonly Program[]): boolean {
  if (knownPrograms?.some(p => p.id === programId)) return true
  if (isGeneralProgramTempMockProgramId(programId)) return true
  return programId.startsWith(GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
}

export function resolveGeneralProgramForDetail(programId: string): Program | undefined {
  return (
    getTempMockOrgProgramIfId(programId) ?? findGeneralRegistrationLocalSaveProgramById(programId)
  )
}

export function getGeneralParticipantTypes(program: Program): GeneralProgramParticipantType[] {
  if (program.generalParticipantTypes?.length) return [...program.generalParticipantTypes]
  if (program.generalProgramAudience === 'individual') return ['individual']
  if (program.generalProgramAudience === 'organization') return ['school_institution']
  return [CATEGORY_TO_PARTICIPANT[program.category]]
}

export function hasGeneralInstructorApplications(program: Program): boolean {
  return getGeneralParticipantTypes(program).includes('teacher_instructor')
}

export function hasGeneralVolunteerApplications(program: Program): boolean {
  return getGeneralParticipantTypes(program).includes('volunteer')
}

/** 참여자(개인)·기관 신청 목록 LNB — school_institution 또는 individual 포함 시 */
export function hasGeneralParticipantApplications(program: Program): boolean {
  const types = getGeneralParticipantTypes(program)
  return types.includes('individual') || types.includes('school_institution')
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
  const nested =
    program.generalCommonInfo?.volunteerRecruitmentInfo as
      | { volunteerInterviewEnabled?: boolean; generalVolunteerInterviewEnabled?: boolean }
      | undefined
  if (nested?.volunteerInterviewEnabled != null) return nested.volunteerInterviewEnabled
  if (nested?.generalVolunteerInterviewEnabled != null) {
    return nested.generalVolunteerInterviewEnabled
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

/** 프로그램 진행 현황 LNB 2depth — 참여자 유형·개인 대분류에 따라 항목 구성 */
export function getGeneralProgressMenuItems(program: Program): GeneralProgressMenuItem[] {
  const types = getGeneralParticipantTypes(program)
  const isIndividual = isGeneralIndividualProgram(program)
  const items: GeneralProgressMenuItem[] = []

  if (types.includes('school_institution') && !isIndividual) {
    items.push({
      tab: 'progress_participants',
      label: '참여 기관',
    })
  }
  if (types.includes('individual') && isIndividual) {
    items.push({
      tab: 'progress_participants',
      label: '참여자',
    })
  }
  if (types.includes('teacher_instructor')) {
    items.push({ tab: 'progress_instructors', label: '참여 강사' })
  }
  if (types.includes('volunteer')) {
    items.push({ tab: 'progress_volunteers', label: '참여 봉사자' })
  }
  if (isIndividual) {
    items.push(
      { tab: 'progress_attendance', label: '출석 관리' },
      { tab: 'progress_assignments', label: '과제 관리' },
      { tab: 'progress_posts', label: '게시글' }
    )
  }

  return items
}

/** 상위 navigation 비활성 또는 실제 하위 메뉴 없음이면 빈 LNB 카테고리를 만들지 않는다. */
export function getVisibleGeneralProgressMenuItems(
  items: readonly GeneralProgressMenuItem[],
  progressDisabled: boolean
): GeneralProgressMenuItem[] {
  return progressDisabled ? [] : [...items]
}
