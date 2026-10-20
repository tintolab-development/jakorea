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
  /** 일반 프로그램 serviceDetailJson과 동일 위치. 체크박스 ↔ LNB SSOT */
  generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
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

/** BE nested 병합 — 빈 문자열·null로 기존 값을 지우지 않도록 omit */
function omitEmptyNestedString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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
  // 빈 venue/교육과정 문자열은 omit — BE가 기존 nested를 유지한다.
  delete stripped.venueKind
  delete stripped.venueDetail
  delete stripped.educationProcess
  delete stripped.ipOwned
  delete stripped.courseDeliveredBy
  delete stripped.partnerInvolvement
  const venueKind = omitEmptyNestedString(
    typeof common.venueKind === 'string' ? common.venueKind : undefined
  )
  const venueDetail = omitEmptyNestedString(common.venueDetail)
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
  const detailedProgramName = common.detailedProgramName?.trim() || undefined
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
    ...(venueKind === 'inside' || venueKind === 'outside' || venueKind === 'other'
      ? { venueKind }
      : {}),
    ...(venueDetail ? { venueDetail } : {}),
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

/** TT 설문 키 정규화 — survey / satisfaction / lecture_evaluation (공통정보 체크 ↔ LNB SSOT) */
function trainedTeacherSurveyMenuKeys(
  keys: Program['generalSurveyMenuKeys']
): Program['generalSurveyMenuKeys'] {
  if (keys === undefined) return undefined
  return resolveGeneralSurveyMenuKeys({ keys })
}

function readStoredSurveyMenuKeys(value: unknown): Program['generalSurveyMenuKeys'] | undefined {
  return Array.isArray(value) ? (value as Program['generalSurveyMenuKeys']) : undefined
}

/**
 * 루트 `generalSurveyMenuKeys`가 있으면(빈 배열 포함) 그게 SSOT.
 * BE가 루트 필드를 버리고 `program`만 남기면 그 안의 키를 쓴다.
 * overlay surveyItems만으로 체크를 되살리지 않는다.
 */
function resolveStoredTrainedTeacherSurveyMenuKeys(input: {
  rootKeys: unknown
  programKeys: unknown
}): Program['generalSurveyMenuKeys'] {
  const rootKeys = readStoredSurveyMenuKeys(input.rootKeys)
  if (rootKeys !== undefined) return trainedTeacherSurveyMenuKeys(rootKeys)
  return trainedTeacherSurveyMenuKeys(readStoredSurveyMenuKeys(input.programKeys))
}

/** 키가 있을 때만 overlay 체크를 맞춘다. 키 생략 시 저장된 surveyItems를 false로 지우지 않는다. */
function reconcileSurveyOverlay(
  overlay: Record<string, unknown> | undefined,
  keys: Program['generalSurveyMenuKeys']
): Record<string, unknown> | undefined {
  if (keys === undefined) return overlay
  return syncSurveyItemsIntoRegistrationOverlay(overlay, keys)
}

function trainedTeacherDetails(program: Program): Partial<Program> {
  const businessArea = resolveStoredBusinessArea(program.businessArea) || undefined
  const sessionRound =
    program.generalProgramSessionRound === 'single' ||
    program.generalProgramSessionRound === 'multi'
      ? program.generalProgramSessionRound
      : undefined
  const generalSurveyMenuKeys = trainedTeacherSurveyMenuKeys(program.generalSurveyMenuKeys)
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
    // 빈 배열도 실어 전부 해제를 BE에 전달 (키 생략 ≠ 해제)
    ...(generalSurveyMenuKeys !== undefined ? { generalSurveyMenuKeys } : {}),
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    ...(sessionRound ? { generalProgramSessionRound: sessionRound } : {}),
    generalCommonInfo: sanitizeTrainedTeacherCommonInfo(program.generalCommonInfo, program),
    scheduleTimeEnabled: program.scheduleTimeEnabled,
    startTime: program.startTime,
    endTime: program.endTime,
    createdByName: program.createdByName,
    updatedByName: program.updatedByName,
  })
}

export function serializeTrainedTeacherServiceDetailJson(program: Program): string {
  const generalSurveyMenuKeys = trainedTeacherSurveyMenuKeys(program.generalSurveyMenuKeys)
  const baseOverlay = persistScheduleEducationFormByDetailOverlay(
    buildRegistrationOverlayForPersist(program),
    program.generalCommonInfo?.scheduleDetails
  )
  // keys가 있을 때만(빈 배열 포함) overlay surveyItems를 맞춤. 키 생략 시 overlay를 지우지 않는다.
  const registrationOverlay =
    generalSurveyMenuKeys !== undefined
      ? syncSurveyItemsIntoRegistrationOverlay(baseOverlay, generalSurveyMenuKeys)
      : baseOverlay
  const payload: TrainedTeacherServiceDetailJsonV1 = {
    schemaVersion: TRAINED_TEACHER_SERVICE_DETAIL_JSON_VERSION,
    // 일반 프로그램과 동일 — 루트 generalSurveyMenuKeys가 LNB SSOT
    ...(generalSurveyMenuKeys !== undefined ? { generalSurveyMenuKeys } : {}),
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
      const generalSurveyMenuKeys = resolveStoredTrainedTeacherSurveyMenuKeys({
        rootKeys: parsed.generalSurveyMenuKeys,
        programKeys: programPartial.generalSurveyMenuKeys,
      })
      const reconciledOverlay = reconcileSurveyOverlay(registrationOverlay, generalSurveyMenuKeys)
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
    const generalSurveyMenuKeys = resolveStoredTrainedTeacherSurveyMenuKeys({
      rootKeys: parsed.generalSurveyMenuKeys,
      programKeys: constrained.generalSurveyMenuKeys,
    })
    const reconciledOverlay = reconcileSurveyOverlay(registrationOverlay, generalSurveyMenuKeys)
    return {
      ...constrained,
      generalSurveyMenuKeys,
      ...(reconciledOverlay ? { registrationOverlay: reconciledOverlay } : {}),
    }
  } catch {
    return {}
  }
}
