/**
 * 교육받은 교사 serviceDetailJson 파서.
 * - FE write: `{ schemaVersion: 1, program: Partial<Program> }`
 * - Primary seed (TCH-01~08 / 186001–186008): flat config_jsonb
 *   (generalCommonInfo.participantRecruitmentInfo + participantRecruitment alias)
 */

import type { Program } from '@/types/domain'
import { normalizeGeneralProgramServiceDetailParsed } from '@/features/program/general/lib/general-program-service-detail-json'

export const TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface TrainedTeacherServiceDetailJsonV1 {
  schemaVersion: typeof TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** TT: 기관 참여자만 · 강사/봉사 모집 블록·봉사 축 OFF */
function trainedTeacherConstraints(partial: Partial<Program>): Partial<Program> {
  const common = partial.generalCommonInfo
  const {
    instructorRecruitmentInfo: _instructor,
    volunteerRecruitmentInfo: _volunteer,
    ...restCommon
  } = common ?? {}
  void _instructor
  void _volunteer

  return {
    ...partial,
    generalParticipantTypes: ['school_institution'],
    generalVolunteerInterviewEnabled: false,
    volunteerApplicationStartDate: undefined,
    volunteerApplicationEndDate: undefined,
    volunteerTarget: undefined,
    volunteerTargets: undefined,
    volunteerTargetDetail: undefined,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
    generalCommonInfo: common
      ? {
          ...restCommon,
          // 미시드가 정상 — 빈 그리드용 객체를 만들지 않음
        }
      : undefined,
  }
}

function trainedTeacherDetails(program: Program): Partial<Program> {
  return trainedTeacherConstraints({
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
  })
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

    // FE write envelope
    if (isRecord(parsed.program)) {
      if (
        parsed.schemaVersion != null &&
        parsed.schemaVersion !== TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION
      ) {
        return {}
      }
      return trainedTeacherConstraints(parsed.program as Partial<Program>)
    }

    // Primary seed flat config (generalCommonInfo / participantRecruitment / axes)
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
    return trainedTeacherConstraints(normalized)
  } catch {
    return {}
  }
}
