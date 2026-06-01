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

export type GeneralSurveyMenuItem = { key: GeneralProgramSurveyMenuKey; label: string }

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
  const keys = program.generalSurveyMenuKeys ?? []
  return keys.map(key => ({ key, label: SURVEY_MENU_LABELS[key] }))
}
