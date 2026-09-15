import type { Program } from '@/types/domain'
import { pickDisplayValue } from '@/features/program/general/lib/detail-value-helpers'

export const GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface GeneralProgramServiceDetailJsonV1 {
  schemaVersion?: typeof GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION | number
  generalCommonInfo?: Program['generalCommonInfo']
  generalParticipantTypes?: Program['generalParticipantTypes']
  generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
  targetLevels?: Program['targetLevels']
  /** 교육 진행 구조 (커리큘럼형 / 일정형) — 탑레벨 API 필드 없음 → JSON 영속 */
  generalProgramEducationStructure?: Program['generalProgramEducationStructure']
  /** 수업 회차 유형 */
  generalProgramSessionRound?: Program['generalProgramSessionRound']
  /** 참여자 대상 (기관 / 개인) */
  generalProgramAudience?: Program['generalProgramAudience']
  instructorApplicationStartDate?: Program['instructorApplicationStartDate']
  instructorApplicationEndDate?: Program['instructorApplicationEndDate']
  volunteerApplicationStartDate?: Program['volunteerApplicationStartDate']
  volunteerApplicationEndDate?: Program['volunteerApplicationEndDate']
  resultAnnouncementDate?: Program['resultAnnouncementDate']
  resultAnnouncementMethod?: Program['resultAnnouncementMethod']
  studentListRequired?: Program['studentListRequired']
  generalParticipantInterviewEnabled?: Program['generalParticipantInterviewEnabled']
  generalVolunteerInterviewEnabled?: Program['generalVolunteerInterviewEnabled']
  /** TT / Primary seed alias — nested로 승격 */
  participantRecruitment?: NonNullable<Program['generalCommonInfo']>['participantRecruitmentInfo']
  instructorRecruitment?: NonNullable<Program['generalCommonInfo']>['instructorRecruitmentInfo']
  volunteerRecruitment?: NonNullable<Program['generalCommonInfo']>['volunteerRecruitmentInfo']
  instructorRecruitmentInfo?: NonNullable<Program['generalCommonInfo']>['instructorRecruitmentInfo']
  volunteerRecruitmentInfo?: NonNullable<Program['generalCommonInfo']>['volunteerRecruitmentInfo']
  curriculumSessions?: NonNullable<Program['generalCommonInfo']>['curriculumSessions']
}

type RecruitmentInfoBag = Record<string, unknown>

function asRecord(value: unknown): RecruitmentInfoBag | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as RecruitmentInfoBag
}

function mergeRecruitmentInfo(
  ...sources: Array<RecruitmentInfoBag | undefined>
): RecruitmentInfoBag | undefined {
  const merged: RecruitmentInfoBag = {}
  for (const source of sources) {
    if (!source) continue
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        merged[key] = value
      }
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

function normalizeStudentListRequired(
  value: unknown
): Program['studentListRequired'] | undefined {
  if (value === 'required' || value === 'not_required') return value
  if (value === true) return 'required'
  if (value === false) return 'not_required'
  return undefined
}

/**
 * Primary 8 / TT alias를 generalCommonInfo.*RecruitmentInfo로 정규화하고
 * 탑레벨 Program hydrate 필드를 채운다.
 */
export function normalizeGeneralProgramServiceDetailParsed(
  parsed: GeneralProgramServiceDetailJsonV1
): Partial<Program> {
  const root = parsed as GeneralProgramServiceDetailJsonV1 & RecruitmentInfoBag
  const common = asRecord(parsed.generalCommonInfo) ?? {}

  const participantRecruitmentInfo = mergeRecruitmentInfo(
    asRecord(common.participantRecruitmentInfo),
    asRecord(parsed.participantRecruitment),
    asRecord(root.participantRecruitmentInfo),
    {
      maxAssignableInstructors: root.maxAssignableInstructors,
      maxClassCount: root.maxClassCount,
      announcementPublished: root.announcementPublished,
      announcementPublishedLabel: root.announcementPublishedLabel,
      studentListRequired: root.studentListRequired,
      studentListRequiredLabel: root.studentListRequiredLabel,
      preEducationNoticeRequired: root.preEducationNoticeRequired ?? root.advanceGuidanceRequired,
      preEducationNoticeRequiredLabel:
        root.preEducationNoticeRequiredLabel ?? root.advanceGuidanceRequiredLabel,
      advanceGuidanceRequired: root.advanceGuidanceRequired,
      advanceGuidanceRequiredLabel: root.advanceGuidanceRequiredLabel,
      inquiryTel: root.inquiryTel,
      inquiryEmail: root.inquiryEmail,
      finalAnnouncementLabel: root.finalAnnouncementLabel ?? root.resultAnnouncementLabel,
      remarks: root.remarks,
      contactOrganizationName: root.contactOrganizationName,
      recruitmentTarget: root.recruitmentTarget,
      recruitmentTargetDetail: root.recruitmentTargetDetail,
      educationTarget: root.educationTarget,
      educationTargetDetail: root.educationTargetDetail,
    }
  )

  const instructorRecruitmentInfo = mergeRecruitmentInfo(
    asRecord(common.instructorRecruitmentInfo),
    asRecord(parsed.instructorRecruitmentInfo),
    asRecord(parsed.instructorRecruitment)
  )

  const volunteerRecruitmentInfo = mergeRecruitmentInfo(
    asRecord(common.volunteerRecruitmentInfo),
    asRecord(parsed.volunteerRecruitmentInfo),
    asRecord(parsed.volunteerRecruitment)
  )

  const curriculumSessions =
    (common.curriculumSessions as NonNullable<Program['generalCommonInfo']>['curriculumSessions']) ??
    parsed.curriculumSessions ??
    (root.curriculumSessions as NonNullable<Program['generalCommonInfo']>['curriculumSessions'])

  const generalCommonInfo: Program['generalCommonInfo'] = {
    ...(parsed.generalCommonInfo ?? {}),
    ...(participantRecruitmentInfo
      ? {
          participantRecruitmentInfo:
            participantRecruitmentInfo as NonNullable<
              Program['generalCommonInfo']
            >['participantRecruitmentInfo'],
        }
      : {}),
    ...(instructorRecruitmentInfo
      ? {
          instructorRecruitmentInfo:
            instructorRecruitmentInfo as NonNullable<
              Program['generalCommonInfo']
            >['instructorRecruitmentInfo'],
        }
      : {}),
    ...(volunteerRecruitmentInfo
      ? {
          volunteerRecruitmentInfo:
            volunteerRecruitmentInfo as NonNullable<
              Program['generalCommonInfo']
            >['volunteerRecruitmentInfo'],
        }
      : {}),
    ...(curriculumSessions ? { curriculumSessions } : {}),
  }

  const studentListRequired = normalizeStudentListRequired(
    pickDisplayValue(
      participantRecruitmentInfo?.studentListRequired,
      root.studentListRequired,
      parsed.studentListRequired
    )
  )

  const volunteerInterview =
    (volunteerRecruitmentInfo?.volunteerInterviewEnabled as boolean | undefined) ??
    (volunteerRecruitmentInfo?.generalVolunteerInterviewEnabled as boolean | undefined) ??
    parsed.generalVolunteerInterviewEnabled ??
    (root.generalVolunteerInterviewEnabled as boolean | undefined)

  const participantInterview =
    (participantRecruitmentInfo?.interviewEnabled as boolean | undefined) ??
    parsed.generalParticipantInterviewEnabled ??
    (root.generalParticipantInterviewEnabled as boolean | undefined)

  return {
    generalCommonInfo,
    generalParticipantTypes: parsed.generalParticipantTypes,
    generalSurveyMenuKeys: parsed.generalSurveyMenuKeys,
    targetLevels: parsed.targetLevels,
    generalProgramEducationStructure: parsed.generalProgramEducationStructure,
    generalProgramSessionRound: parsed.generalProgramSessionRound,
    generalProgramAudience: parsed.generalProgramAudience,
    instructorApplicationStartDate: parsed.instructorApplicationStartDate,
    instructorApplicationEndDate: parsed.instructorApplicationEndDate,
    volunteerApplicationStartDate: parsed.volunteerApplicationStartDate,
    volunteerApplicationEndDate: parsed.volunteerApplicationEndDate,
    resultAnnouncementDate: parsed.resultAnnouncementDate,
    resultAnnouncementMethod: parsed.resultAnnouncementMethod,
    studentListRequired,
    generalParticipantInterviewEnabled: participantInterview,
    generalVolunteerInterviewEnabled: volunteerInterview,
  }
}

export function serializeGeneralProgramServiceDetailJson(program: Program): string | undefined {
  const payload: GeneralProgramServiceDetailJsonV1 = {
    schemaVersion: GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION,
    generalCommonInfo: program.generalCommonInfo,
    generalParticipantTypes: program.generalParticipantTypes,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    targetLevels: program.targetLevels,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    generalProgramAudience: program.generalProgramAudience,
    instructorApplicationStartDate: program.instructorApplicationStartDate,
    instructorApplicationEndDate: program.instructorApplicationEndDate,
    volunteerApplicationStartDate: program.volunteerApplicationStartDate,
    volunteerApplicationEndDate: program.volunteerApplicationEndDate,
    resultAnnouncementDate: program.resultAnnouncementDate,
    resultAnnouncementMethod: program.resultAnnouncementMethod,
    studentListRequired: program.studentListRequired,
    generalParticipantInterviewEnabled: program.generalParticipantInterviewEnabled,
    generalVolunteerInterviewEnabled: program.generalVolunteerInterviewEnabled,
  }

  const hasContent = Object.entries(payload).some(([key, value]) => {
    if (key === 'schemaVersion') return false
    if (value == null) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })

  if (!hasContent) return undefined
  return JSON.stringify(payload)
}

export function parseGeneralProgramServiceDetailJson(
  raw?: string | null
): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed = JSON.parse(raw) as GeneralProgramServiceDetailJsonV1
    const version = parsed?.schemaVersion
    const hasGeneralShape =
      parsed?.generalCommonInfo != null ||
      parsed?.generalParticipantTypes != null ||
      parsed?.participantRecruitment != null
    // Primary 8 시드는 schemaVersion=1. 구버전·누락이어도 general shape이면 hydrate.
    if (
      version != null &&
      version !== GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION &&
      !hasGeneralShape
    ) {
      return {}
    }
    if (version == null && !hasGeneralShape) {
      return {}
    }

    return normalizeGeneralProgramServiceDetailParsed(parsed)
  } catch {
    return {}
  }
}
