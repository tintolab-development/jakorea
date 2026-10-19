/**
 * 교육받은 교사 serviceDetailJson 파서.
 * - FE write: `{ schemaVersion: 1, program: Partial<Program> }`
 * - Primary seed (TCH-01~08 / 186001–186008): flat config_jsonb
 *   (generalCommonInfo.participantRecruitmentInfo + participantRecruitment alias)
 */

import type { Program } from '@/types/domain'
import { normalizeGeneralProgramServiceDetailParsed } from '@/features/program/general/lib/general-program-service-detail-json'
import {
  resolveGeneralSurveyMenuKeys,
  syncSurveyItemsIntoRegistrationOverlay,
} from '@/features/program/general/lib/general-survey-menu-keys'
import { persistScheduleEducationFormByDetailOverlay } from '@/features/program/general/model/common-info-edit-schema'
import {
  resolvePersistedProgramTargetLevels,
  resolveStoredBusinessArea,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { buildRegistrationOverlayForPersist } from '@/features/program/shared/lib/public-program-title'

export const TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface TrainedTeacherServiceDetailJsonV1 {
  schemaVersion: typeof TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
  registration?: { overlay?: Record<string, unknown> }
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

/**
 * BE가 commonInfo에 미러하는 Program 컬럼 — 저장 시 제거 (구값 잔존 방지).
 * educationProcess · partnerInvolvement · ipOwned · courseDeliveredBy 는 빼지 않는다.
 * TRAINED_TEACHER PATCH 는 정규화본이 아니라 이 JSON 으로 config 를 교체한다.
 */
const TRAINED_TEACHER_COMMON_INFO_PROGRAM_MIRROR_KEYS = [
  'title',
  'titleEn',
  'mainTitle',
  'representativeProgramNameKo',
  'textbookName',
  'sponsorId',
  'businessArea',
  'educationStructure',
  'district',
  'targetLevel',
  'institutionType',
  'teamDivision',
  'totalParticipants',
  'instructors',
  'contactEmail',
  'contactPhone',
  'additionalContentHtml',
  'recruitmentGuide',
  'learningSupportContent',
  'venue',
  'applicationPathId',
  'managerName',
  'teacherTrainingScheduleName',
  'sponsorManagerContactNames',
] as const

function trainedTeacherEducationSelection(
  program: Program
): Pick<
  NonNullable<Program['generalCommonInfo']>,
  'educationProcess' | 'ipOwned' | 'courseDeliveredBy' | 'partnerInvolvement'
> {
  const educationProcess = program.educationProcess?.trim()
  const ipOwned = program.ipOwned?.trim()
  const courseDeliveredBy = program.courseDeliveredBy
  return {
    ...(educationProcess ? { educationProcess } : {}),
    ...(ipOwned ? { ipOwned } : {}),
    ...(courseDeliveredBy ? { courseDeliveredBy } : {}),
    ...(program.partnerInvolvement != null
      ? { partnerInvolvement: program.partnerInvolvement }
      : {}),
  }
}

function sanitizeTrainedTeacherCommonInfo(
  common: Program['generalCommonInfo'] | undefined,
  program: Program
): Program['generalCommonInfo'] | undefined {
  const educationSelection = trainedTeacherEducationSelection(program)
  if (!common) {
    return Object.keys(educationSelection).length > 0 ? educationSelection : undefined
  }
  const stripped = { ...common } as Record<string, unknown>
  for (const key of TRAINED_TEACHER_COMMON_INFO_PROGRAM_MIRROR_KEYS) {
    delete stripped[key]
  }
  const sponsorManagementIds = (
    common.sponsorManagementIds?.length
      ? common.sponsorManagementIds
      : common.sponsorManagementId
        ? [common.sponsorManagementId]
        : program.sponsorId
          ? [program.sponsorId]
          : []
  )
    .map(id => String(id).trim())
    .filter(Boolean)
  const detailedProgramName =
    common.detailedProgramName?.trim() || program.textbookName?.trim() || undefined
  const participantRecruitmentInfo = common.participantRecruitmentInfo
    ? {
        ...common.participantRecruitmentInfo,
        maxAssignableInstructors: 0,
        preEducationNoticeRequired: false,
      }
    : undefined
  return {
    ...(stripped as NonNullable<Program['generalCommonInfo']>),
    ...educationSelection,
    ...(sponsorManagementIds.length > 0
      ? {
          sponsorManagementIds,
          sponsorManagementId: sponsorManagementIds[0],
        }
      : {}),
    ...(detailedProgramName ? { detailedProgramName } : {}),
    ...(participantRecruitmentInfo ? { participantRecruitmentInfo } : {}),
    announcementTitle: common.announcementTitle?.trim() || undefined,
  }
}

function trainedTeacherDetails(program: Program): Partial<Program> {
  const businessArea = resolveStoredBusinessArea(program.businessArea) || undefined
  return trainedTeacherConstraints({
    ...(businessArea ? { businessArea } : {}),
    posterImage: program.posterImage,
    targetLevels: resolvePersistedProgramTargetLevels(program),
    approvedStudentCount: program.approvedStudentCount,
    participatingSchoolCount: program.participatingSchoolCount,
    participatingStudentCount: program.participatingStudentCount,
    applicationMethod: program.applicationMethod,
    otherNotes: program.otherNotes,
    remarks: program.remarks,
    educationTargetDetail: program.educationTargetDetail,
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
    generalCommonInfo: sanitizeTrainedTeacherCommonInfo(program.generalCommonInfo, program),
    scheduleTimeEnabled: program.scheduleTimeEnabled,
    startTime: program.startTime,
    endTime: program.endTime,
    createdByName: program.createdByName,
    updatedByName: program.updatedByName,
  })
}

export function serializeTrainedTeacherServiceDetailJson(program: Program): string {
  const registrationOverlay = syncSurveyItemsIntoRegistrationOverlay(
    persistScheduleEducationFormByDetailOverlay(
      buildRegistrationOverlayForPersist(program),
      program.generalCommonInfo?.scheduleDetails
    ),
    program.generalSurveyMenuKeys
  )
  const payload: TrainedTeacherServiceDetailJsonV1 = {
    schemaVersion: TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION,
    program: trainedTeacherDetails(program),
    ...(registrationOverlay ? { registration: { overlay: registrationOverlay } } : {}),
  }
  return JSON.stringify(payload)
}

export function parseTrainedTeacherServiceDetailJson(raw?: string | null): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}

    const registrationOverlay =
      isRecord(parsed.registration) && isRecord(parsed.registration.overlay)
        ? parsed.registration.overlay
        : undefined

    // FE write envelope
    if (isRecord(parsed.program)) {
      if (
        parsed.schemaVersion != null &&
        parsed.schemaVersion !== TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION
      ) {
        return {}
      }
      const programPartial = trainedTeacherConstraints(parsed.program as Partial<Program>)
      // 일반 프로그램과 동일 — keys 없으면 overlay surveyItems에서 복원.
      // keys 없이 sync하면 overlay를 전부 false로 덮어 설문이 유실된다.
      const generalSurveyMenuKeys = resolveGeneralSurveyMenuKeys({
        keys: programPartial.generalSurveyMenuKeys,
        overlay: registrationOverlay,
      })
      const reconciledOverlay = syncSurveyItemsIntoRegistrationOverlay(
        registrationOverlay,
        generalSurveyMenuKeys
      )
      return {
        ...programPartial,
        generalSurveyMenuKeys,
        ...(reconciledOverlay ? { registrationOverlay: reconciledOverlay } : {}),
      }
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
    const constrained = trainedTeacherConstraints(normalized)
    const generalSurveyMenuKeys = resolveGeneralSurveyMenuKeys({
      keys: constrained.generalSurveyMenuKeys,
      overlay: registrationOverlay,
    })
    const reconciledOverlay = syncSurveyItemsIntoRegistrationOverlay(
      registrationOverlay,
      generalSurveyMenuKeys
    )
    return {
      ...constrained,
      generalSurveyMenuKeys,
      ...(reconciledOverlay ? { registrationOverlay: reconciledOverlay } : {}),
    }
  } catch {
    return {}
  }
}
