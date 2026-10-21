import type { Program } from '@/types/domain'
import { pickDisplayValue } from '@/features/program/general/lib/detail-value-helpers'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { persistScheduleEducationFormByDetailOverlay } from '@/features/program/general/model/common-info-edit-schema'
import { buildRegistrationOverlayForPersist } from '@/features/program/shared/lib/public-program-title'
import { buildGeneralRegistrationOverlayFromProgram } from '@/features/program/general/lib/registration-overlay-sync'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import { GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { resolveGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { coerceProgramPaymentItemsText } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { omitMirroredDetailedProgramMasterIdFromCommonInfo } from '@/features/program/general/lib/detailed-program-request-id'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'

export const GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION = 1 as const

export const GENERAL_REGISTRATION_WAGE_OVERLAY_PREFIX = 'generalRegistration.wageInfo.' as const

function wageGradeRowsSignature(
  rows: NonNullable<Program['generalCommonInfo']>['wageGradeRows'] | undefined
): string {
  if (!rows?.length) return ''
  return JSON.stringify(
    rows.map(row => ({
      grade: row.grade ?? '',
      pricing: row.pricing ?? '',
    }))
  )
}

export function wageCommonInfoFieldsUnchanged(
  next: Program['generalCommonInfo'] | undefined,
  existing: Program['generalCommonInfo'] | undefined
): boolean {
  const nextPayment = coerceProgramPaymentItemsText(next?.paymentItems).trim()
  const existingPayment = coerceProgramPaymentItemsText(existing?.paymentItems).trim()
  const nextDeduction = (next?.deductionItems ?? '').trim()
  const existingDeduction = (existing?.deductionItems ?? '').trim()
  return (
    nextPayment === existingPayment &&
    nextDeduction === existingDeduction &&
    wageGradeRowsSignature(next?.wageGradeRows) ===
      wageGradeRowsSignature(existing?.wageGradeRows)
  )
}

export function stripWageKeysFromRegistrationOverlay(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!overlay) return undefined
  const entries = Object.entries(overlay).filter(
    ([key]) => !key.startsWith(GENERAL_REGISTRATION_WAGE_OVERLAY_PREFIX)
  )
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries)
}

/**
 * 모집·학생 명단 등 임금을 건드리지 않은 PATCH에서 legacy `paymentItems`(예: 숙박비)가
 * serviceDetailJson에 재전송되며 BE 검증(400)이 나는 것을 막는다.
 */
export function omitUnchangedWageFieldsFromProgramForServiceDetail(
  program: Program,
  baseline: Program
): Program {
  const common = program.generalCommonInfo
  if (!common || !wageCommonInfoFieldsUnchanged(common, baseline.generalCommonInfo)) {
    return program
  }
  const { paymentItems: _paymentItems, deductionItems: _deductionItems, wageGradeRows: _wageGradeRows, ...rest } =
    common
  void _paymentItems
  void _deductionItems
  void _wageGradeRows
  return {
    ...program,
    generalCommonInfo: rest,
    registrationOverlay: stripWageKeysFromRegistrationOverlay(program.registrationOverlay),
  }
}

export interface GeneralProgramServiceDetailJsonV1 {
  schemaVersion?: typeof GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION | number
  generalCommonInfo?: Program['generalCommonInfo']
  generalParticipantTypes?: Program['generalParticipantTypes']
  generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
  targetLevels?: Program['targetLevels']
  /** BE 컬럼 동기화용 봉투. 파서는 `program`을 루트로 끌어올린다. */
  program?: { targetLevels?: Program['targetLevels'] }
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
  /** 등록 폼 overlay — 공고용명 등 BE가 title로 덮어쓴 announcementTitle 복원 */
  registration?: { overlay?: Record<string, unknown> }
  /** BE GET echo — DB SSOT는 `registration.overlay`. 파싱 시 overlay와 병합(루트 우선). */
  registrationOverlay?: Record<string, unknown>
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

function stripIndividualStudentRosterFromCommonInfo(
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  const info = common?.participantRecruitmentInfo
  if (!info) return common
  if (info.studentListRequired !== 'required') {
    return common
  }
  return {
    ...common,
    participantRecruitmentInfo: {
      ...info,
      studentListRequired: 'not_required',
    },
  }
}

/**
 * 기관(학교/기관) 프로그램 — BE `GENERAL_ORGANIZATION_PARTICIPATION_METHOD_NOT_ALLOWED`
 * 개인 전용 참여 방식 필드를 serviceDetailJson에서 제거한다.
 */
function stripOrganizationParticipationFromCommonInfo(
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  if (!common) return common
  const { participationMethod: _omitMethod, ...rest } = common
  void _omitMethod
  return {
    ...rest,
    curriculumSessions: rest.curriculumSessions?.map(session => {
      const { participationMethodLabel: _omitLabel, ...sessionRest } = session
      void _omitLabel
      return sessionRest
    }),
    scheduleDetails: rest.scheduleDetails?.map(detail => {
      const { participationMethodLabel: _omitLabel, ...detailRest } = detail
      void _omitLabel
      return detailRest
    }),
  }
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

const RECRUITMENT_WINDOW_JSON_KEYS = [
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'generalParticipantInterviewEnabled',
  'generalVolunteerInterviewEnabled',
] as const satisfies ReadonlyArray<keyof GeneralProgramServiceDetailJsonV1>

const NESTED_RECRUITMENT_INFO_KEYS = [
  'participantRecruitmentInfo',
  'instructorRecruitmentInfo',
  'volunteerRecruitmentInfo',
  'volunteerInterviewScheduleInfo',
] as const

/** BE echo가 commonInfo에 심은 단수 컬럼. 루트 `targetLevels`와 충돌하면 서버가 1개만 남긴다. */
function omitColumnTargetLevelsFromCommonInfo(
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  if (!common) return common
  const next = { ...common } as Record<string, unknown>
  delete next.targetLevels
  delete next.targetLevel
  return next as Program['generalCommonInfo']
}

/** 공통정보 저장 — 모집 창·모집 정보 객체는 이번 요청에 넣지 않는다. */
function omitRecruitmentWindowFromCommonInfo(
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  if (!common) return common
  const next = { ...common }
  for (const key of NESTED_RECRUITMENT_INFO_KEYS) {
    delete next[key]
  }
  return next
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function toKstDateKey(value: string | Date | undefined | null): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  }
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return undefined
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/** BE 면접 선택지 펼침 기간 — 봉사자 「2차 면접 심사」 기간을 그대로 쓴다. */
export function withVolunteerInterviewSchedulePeriod(
  program: Program,
  common: Program['generalCommonInfo']
): Program['generalCommonInfo'] {
  const schedule = common?.volunteerInterviewScheduleInfo
  if (!common || !schedule) return common
  const volunteerInfo = common.volunteerRecruitmentInfo
  const periodStartDate = toKstDateKey(
    program.interviewStartDate ?? volunteerInfo?.interviewStartDate
  )
  const periodEndDate = toKstDateKey(program.interviewEndDate ?? volunteerInfo?.interviewEndDate)
  const { periodStartDate: _start, periodEndDate: _end, ...rest } = schedule
  return {
    ...common,
    volunteerInterviewScheduleInfo: {
      ...rest,
      ...(periodStartDate ? { periodStartDate } : {}),
      ...(periodEndDate ? { periodEndDate } : {}),
    },
  }
}

export function serializeGeneralProgramServiceDetailJson(
  program: Program,
  options?: {
    omitRecruitmentWindow?: boolean
    omitUnchangedWageOverlay?: boolean
    /** 루트 모집 창 날짜는 빼되, nested `*RecruitmentInfo`는 남긴다. */
    keepNestedRecruitmentInfo?: boolean
  }
): string | undefined {
  const isIndividual = isGeneralIndividualProgram(program)
  const withAudienceRule = isIndividual
    ? stripIndividualStudentRosterFromCommonInfo(program.generalCommonInfo)
    : stripOrganizationParticipationFromCommonInfo(program.generalCommonInfo)
  const commonAfterScheduleMasterStrip =
    program.generalProgramEducationStructure === 'schedule' &&
    !isTrainedTeachersDetailProgram(program)
      ? omitMirroredDetailedProgramMasterIdFromCommonInfo(withAudienceRule)
      : withAudienceRule
  const generalCommonInfo = omitColumnTargetLevelsFromCommonInfo(
    options?.omitRecruitmentWindow && !options?.keepNestedRecruitmentInfo
      ? omitRecruitmentWindowFromCommonInfo(commonAfterScheduleMasterStrip)
      : withVolunteerInterviewSchedulePeriod(program, commonAfterScheduleMasterStrip)
  )
  const nestedProgram: Program = {
    ...program,
    generalCommonInfo,
  }
  const fromNested = buildGeneralRegistrationOverlayFromProgram(nestedProgram)
  const overlayForPersist = options?.omitRecruitmentWindow
    ? {
        ...(program.registrationOverlay ?? {}),
        ...fromNested,
      }
    : resyncGeneralRecruitOverlayFromProgram(nestedProgram, {
        ...(program.registrationOverlay ?? {}),
        ...fromNested,
      })
  const persistedOverlay = persistScheduleEducationFormByDetailOverlay(
    buildRegistrationOverlayForPersist({
      ...nestedProgram,
      registrationOverlay: overlayForPersist,
    }),
    generalCommonInfo?.scheduleDetails
  )
  const scheduleLines = generalCommonInfo?.educationScheduleLines
    ?.map(line => line.trim())
    .filter(Boolean)
  let registrationOverlay =
    scheduleLines && scheduleLines.length > 0
      ? {
          ...(persistedOverlay ?? {}),
          [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: scheduleLines,
        }
      : persistedOverlay
  if (options?.omitUnchangedWageOverlay) {
    registrationOverlay = stripWageKeysFromRegistrationOverlay(registrationOverlay)
  }
  const persistedTargetLevels = resolvePersistedProgramTargetLevels(program)
  const payload: GeneralProgramServiceDetailJsonV1 = {
    schemaVersion: GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION,
    generalCommonInfo,
    generalParticipantTypes: program.generalParticipantTypes,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    targetLevels: persistedTargetLevels,
    /** BE는 `serviceDetailJson.program.targetLevels`와 컬럼을 동기화한다. */
    program: persistedTargetLevels.length > 0 ? { targetLevels: persistedTargetLevels } : undefined,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    generalProgramAudience: program.generalProgramAudience,
    instructorApplicationStartDate: program.instructorApplicationStartDate,
    instructorApplicationEndDate: program.instructorApplicationEndDate,
    volunteerApplicationStartDate: program.volunteerApplicationStartDate,
    volunteerApplicationEndDate: program.volunteerApplicationEndDate,
    resultAnnouncementDate: program.resultAnnouncementDate,
    resultAnnouncementMethod: program.resultAnnouncementMethod,
    studentListRequired: isIndividual ? 'not_required' : program.studentListRequired,
    generalParticipantInterviewEnabled: program.generalParticipantInterviewEnabled,
    generalVolunteerInterviewEnabled: program.generalVolunteerInterviewEnabled,
    ...(registrationOverlay
      ? {
          registration: { overlay: registrationOverlay },
          registrationOverlay: { ...registrationOverlay },
        }
      : {}),
  }
  if (options?.omitRecruitmentWindow) {
    for (const key of RECRUITMENT_WINDOW_JSON_KEYS) {
      delete payload[key]
    }
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

function isServiceDetailRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/** `registration.overlay`(DB) + 루트 `registrationOverlay`(GET echo). 루트 키가 우선한다. */
export function mergeServiceDetailRegistrationOverlay(
  parsed: Record<string, unknown>
): Record<string, unknown> | undefined {
  const fromNested =
    isServiceDetailRecord(parsed.registration) &&
    isServiceDetailRecord(parsed.registration.overlay)
      ? parsed.registration.overlay
      : undefined
  const fromRoot = isServiceDetailRecord(parsed.registrationOverlay)
    ? parsed.registrationOverlay
    : undefined
  if (!fromNested && !fromRoot) return undefined
  return { ...(fromNested ?? {}), ...(fromRoot ?? {}) }
}

function unwrapGeneralServiceDetailRoot(
  parsed: GeneralProgramServiceDetailJsonV1 & Record<string, unknown>
): GeneralProgramServiceDetailJsonV1 {
  if (!isServiceDetailRecord(parsed.program)) return parsed
  const nested = parsed.program as GeneralProgramServiceDetailJsonV1 & Record<string, unknown>
  return {
    ...parsed,
    ...nested,
    generalCommonInfo: {
      ...(isServiceDetailRecord(parsed.generalCommonInfo) ? parsed.generalCommonInfo : {}),
      ...(isServiceDetailRecord(nested.generalCommonInfo) ? nested.generalCommonInfo : {}),
    },
  }
}

export function parseGeneralProgramServiceDetailJson(
  raw?: string | null
): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed = unwrapGeneralServiceDetailRoot(
      JSON.parse(raw) as GeneralProgramServiceDetailJsonV1 & Record<string, unknown>
    )
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

    const registrationOverlay = mergeServiceDetailRegistrationOverlay(
      parsed as Record<string, unknown>
    )
    const normalized = normalizeGeneralProgramServiceDetailParsed(parsed)

    return {
      ...normalized,
      ...(registrationOverlay ? { registrationOverlay } : {}),
      generalSurveyMenuKeys: resolveGeneralSurveyMenuKeys({
        keys: normalized.generalSurveyMenuKeys,
        overlay: registrationOverlay,
      }),
    }
  } catch {
    return {}
  }
}
