import type { Program } from '@/types/domain'

export const TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface TrainedTeacherServiceDetailJsonV1 {
  schemaVersion: typeof TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function trainedTeacherDetails(program: Program): Partial<Program> {
  return {
    posterImage: program.posterImage,
    targetLevels: program.targetLevels,
    approvedStudentCount: program.approvedStudentCount,
    participatingSchoolCount: program.participatingSchoolCount,
    participatingStudentCount: program.participatingStudentCount,
    applicationMethod: program.applicationMethod,
    otherNotes: program.otherNotes,
    resultAnnouncementDate: program.resultAnnouncementDate,
    resultAnnouncementMethod: program.resultAnnouncementMethod,
    studentListRequired: program.studentListRequired,
    applicationFormTemplateId: program.applicationFormTemplateId,
    surveyFormTemplateId: program.surveyFormTemplateId,
    satisfactionFormTemplateId: program.satisfactionFormTemplateId,
    lectureReportFormTemplateId: program.lectureReportFormTemplateId,
    generalParticipantTypes: ['school_institution'],
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
  }
}

export function serializeTrainedTeacherServiceDetailJson(program: Program): string {
  const payload: TrainedTeacherServiceDetailJsonV1 = {
    schemaVersion: TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION,
    program: trainedTeacherDetails(program),
  }
  return JSON.stringify(payload)
}

export function parseTrainedTeacherServiceDetailJson(raw?: string | null): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    if (parsed.schemaVersion !== TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION) return {}
    if (!isRecord(parsed.program)) return {}

    const program = parsed.program as Partial<Program>
    return {
      ...program,
      generalParticipantTypes: ['school_institution'],
      generalVolunteerInterviewEnabled: false,
      volunteerApplicationStartDate: undefined,
      volunteerApplicationEndDate: undefined,
      volunteerTarget: undefined,
      volunteerTargets: undefined,
      volunteerTargetDetail: undefined,
    }
  } catch {
    return {}
  }
}
