/**
 * 1사1교 serviceDetailJson 파서.
 * - FE write: `{ schemaVersion: 1, program: Partial<Program> }`
 * - Primary seed (ONE-01~03): flat config_jsonb (generalCommonInfo + axes) — 일반 Primary와 동일 shape
 */

import type { Program } from '@/types/domain'
import { normalizeGeneralProgramServiceDetailParsed } from '@/features/program/general/lib/general-program-service-detail-json'

export const COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface CompanySchoolServiceDetailJsonV1 {
  schemaVersion: typeof COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function companySchoolVolunteerOff(partial: Partial<Program>): Partial<Program> {
  return {
    ...partial,
    generalParticipantTypes:
      partial.generalParticipantTypes?.length
        ? partial.generalParticipantTypes.filter(t => t !== 'volunteer')
        : ['school_institution', 'teacher_instructor'],
    generalVolunteerInterviewEnabled: false,
    volunteerApplicationStartDate: undefined,
    volunteerApplicationEndDate: undefined,
    volunteerTarget: undefined,
    volunteerTargets: undefined,
    volunteerTargetDetail: undefined,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
  }
}

function companySchoolDetails(program: Program): Partial<Program> {
  return companySchoolVolunteerOff({
    posterImage: program.posterImage,
    targetLevels: program.targetLevels,
    approvedStudentCount: program.approvedStudentCount,
    instructorCapacity: program.instructorCapacity,
    participatingSchoolCount: program.participatingSchoolCount,
    participatingStudentCount: program.participatingStudentCount,
    instructorApplicationStartDate: program.instructorApplicationStartDate,
    instructorApplicationEndDate: program.instructorApplicationEndDate,
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod: program.finalPassAnnouncementMethod,
    instructorTarget: program.instructorTarget,
    instructorTargets: program.instructorTargets,
    instructorTargetDetail: program.instructorTargetDetail,
    applicationMethod: program.applicationMethod,
    otherNotes: program.otherNotes,
    resultAnnouncementDate: program.resultAnnouncementDate,
    resultAnnouncementMethod: program.resultAnnouncementMethod,
    studentListRequired: program.studentListRequired,
    applicationFormTemplateId: program.applicationFormTemplateId,
    surveyFormTemplateId: program.surveyFormTemplateId,
    satisfactionFormTemplateId: program.satisfactionFormTemplateId,
    lectureReportFormTemplateId: program.lectureReportFormTemplateId,
    generalParticipantInterviewEnabled: program.generalParticipantInterviewEnabled,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    generalProgramAudience: program.generalProgramAudience ?? 'organization',
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    generalCommonInfo: program.generalCommonInfo,
    scheduleTimeEnabled: program.scheduleTimeEnabled,
    startTime: program.startTime,
    endTime: program.endTime,
    createdByName: program.createdByName,
    updatedByName: program.updatedByName,
  })
}

export function serializeCompanySchoolServiceDetailJson(program: Program): string {
  const payload: CompanySchoolServiceDetailJsonV1 = {
    schemaVersion: COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION,
    program: companySchoolDetails(program),
  }
  return JSON.stringify(payload)
}

export function parseCompanySchoolServiceDetailJson(raw?: string | null): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}

    // FE write envelope
    if (isRecord(parsed.program)) {
      if (
        parsed.schemaVersion != null &&
        parsed.schemaVersion !== COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION
      ) {
        return {}
      }
      return companySchoolVolunteerOff(parsed.program as Partial<Program>)
    }

    // Primary seed flat config (generalCommonInfo / generalParticipantTypes / axes)
    const hasPrimaryShape =
      parsed.generalCommonInfo != null ||
      parsed.generalParticipantTypes != null ||
      parsed.participantRecruitment != null ||
      parsed.frontendProgramId != null ||
      parsed.seedCase != null

    if (!hasPrimaryShape) return {}

    const normalized = normalizeGeneralProgramServiceDetailParsed(
      parsed as Parameters<typeof normalizeGeneralProgramServiceDetailParsed>[0]
    )
    return companySchoolVolunteerOff(normalized)
  } catch {
    return {}
  }
}
