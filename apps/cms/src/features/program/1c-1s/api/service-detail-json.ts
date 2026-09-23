/**
 * 1사1교 serviceDetailJson 파서.
 * - FE write: `{ schemaVersion: 1, program: Partial<Program> }`
 * - Primary seed (ONE-01~03): flat config_jsonb (generalCommonInfo + axes) — 일반 Primary와 동일 shape
 */

import type { Program } from '@/types/domain'
import { normalizeGeneralProgramServiceDetailParsed } from '@/features/program/general/lib/general-program-service-detail-json'
import { persistScheduleEducationFormByDetailOverlay } from '@/features/program/general/model/common-info-edit-schema'
import { buildRegistrationOverlayForPersist } from '@/features/program/shared/lib/public-program-title'

export const COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface CompanySchoolServiceDetailJsonV1 {
  schemaVersion: typeof COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION
  program: Partial<Program>
  registration?: { overlay?: Record<string, unknown> }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

type CompanySchoolWageSidecar = {
  wageGradeRows?: NonNullable<Program['generalCommonInfo']>['wageGradeRows']
  paymentItems?: string
  deductionItems?: string
}

/** BE가 jsonb를 string이 아니라 object로 내려주거나, 이중 stringify 하는 경우 */
function coerceServiceDetailObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (isRecord(raw)) return raw
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    let parsed: unknown = JSON.parse(trimmed)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readWageSidecar(common: unknown): CompanySchoolWageSidecar | undefined {
  if (!isRecord(common)) return undefined
  const wageGradeRows = Array.isArray(common.wageGradeRows)
    ? (common.wageGradeRows as NonNullable<Program['generalCommonInfo']>['wageGradeRows'])
    : undefined
  const paymentItems = typeof common.paymentItems === 'string' ? common.paymentItems : undefined
  const deductionItems =
    typeof common.deductionItems === 'string' ? common.deductionItems : undefined
  if (!wageGradeRows?.length && !paymentItems?.trim() && !deductionItems?.trim()) {
    return undefined
  }
  return { wageGradeRows, paymentItems, deductionItems }
}

/**
 * 186014처럼 `{ program.generalCommonInfo(임금 있음), generalCommonInfo(임금 없음) }` 가
 * 같이 있을 때 중첩 program 쪽 임금을 쓴다.
 */
export function extractCompanySchoolWageSidecar(raw: unknown): CompanySchoolWageSidecar | undefined {
  const parsed = coerceServiceDetailObject(raw)
  if (!parsed) return undefined
  const program = isRecord(parsed.program)
    ? parsed.program
    : coerceServiceDetailObject(parsed.program)
  const fromProgram = program ? readWageSidecar(program.generalCommonInfo) : undefined
  if (fromProgram) return fromProgram
  return readWageSidecar(parsed.generalCommonInfo)
}

function applyWageSidecar(
  partial: Partial<Program>,
  sidecar: CompanySchoolWageSidecar | undefined
): Partial<Program> {
  if (!sidecar) return partial
  return {
    ...partial,
    generalCommonInfo: {
      ...partial.generalCommonInfo,
      ...(sidecar.wageGradeRows?.length ? { wageGradeRows: sidecar.wageGradeRows } : {}),
      ...(sidecar.paymentItems?.trim() ? { paymentItems: sidecar.paymentItems } : {}),
      ...(sidecar.deductionItems?.trim() ? { deductionItems: sidecar.deductionItems } : {}),
    },
  }
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
  const registrationOverlay = persistScheduleEducationFormByDetailOverlay(
    buildRegistrationOverlayForPersist(program),
    program.generalCommonInfo?.scheduleDetails
  )
  const payload: CompanySchoolServiceDetailJsonV1 = {
    schemaVersion: COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION,
    program: companySchoolDetails(program),
    ...(registrationOverlay ? { registration: { overlay: registrationOverlay } } : {}),
  }
  return JSON.stringify(payload)
}

export function parseCompanySchoolServiceDetailJson(raw?: unknown): Partial<Program> {
  const parsed = coerceServiceDetailObject(raw)
  if (!parsed) return {}

  try {
    const registrationOverlay =
      isRecord(parsed.registration) && isRecord(parsed.registration.overlay)
        ? parsed.registration.overlay
        : undefined
    const wageSidecar = extractCompanySchoolWageSidecar(parsed)

    // FE write envelope
    if (isRecord(parsed.program)) {
      if (
        parsed.schemaVersion != null &&
        parsed.schemaVersion !== COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION
      ) {
        return applyWageSidecar({}, wageSidecar)
      }
      return applyWageSidecar(
        {
          ...companySchoolVolunteerOff(parsed.program as Partial<Program>),
          ...(registrationOverlay ? { registrationOverlay } : {}),
        },
        wageSidecar
      )
    }

    // Primary seed flat config (generalCommonInfo / generalParticipantTypes / axes)
    const hasPrimaryShape =
      parsed.generalCommonInfo != null ||
      parsed.generalParticipantTypes != null ||
      parsed.participantRecruitment != null ||
      parsed.frontendProgramId != null ||
      parsed.seedCase != null

    if (!hasPrimaryShape) return applyWageSidecar({}, wageSidecar)

    const normalized = normalizeGeneralProgramServiceDetailParsed(
      parsed as Parameters<typeof normalizeGeneralProgramServiceDetailParsed>[0]
    )
    return applyWageSidecar(
      {
        ...companySchoolVolunteerOff(normalized),
        ...(registrationOverlay ? { registrationOverlay } : {}),
      },
      wageSidecar
    )
  } catch {
    return applyWageSidecar({}, extractCompanySchoolWageSidecar(parsed))
  }
}
