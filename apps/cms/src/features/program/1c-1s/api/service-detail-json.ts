import type { Program } from '@/types/domain'

export const COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface CompanySchoolServiceDetailJsonV1 {
  schemaVersion: typeof COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function companySchoolDetails(program: Program): Partial<Program> {
  return {
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
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalVolunteerInterviewEnabled: false,
    generalParticipantInterviewEnabled: program.generalParticipantInterviewEnabled,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    generalCommonInfo: program.generalCommonInfo,
    scheduleTimeEnabled: program.scheduleTimeEnabled,
    startTime: program.startTime,
    endTime: program.endTime,
    createdByName: program.createdByName,
    updatedByName: program.updatedByName,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
  }
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
    if (parsed.schemaVersion !== COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION) return {}
    if (!isRecord(parsed.program)) return {}

    const program = parsed.program as Partial<Program>
    return {
      ...program,
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
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
  } catch {
    return {}
  }
}
