/**
 * 1사1교 serviceDetailJson 파서.
 * - FE write: `{ schemaVersion: 1, program: Partial<Program> }`
 * - Primary seed (ONE-01~03): flat config_jsonb (generalCommonInfo + axes) — 일반 Primary와 동일 shape
 */

import type { Program } from '@/types/domain'
import { normalizeGeneralProgramServiceDetailParsed } from '@/features/program/general/lib/general-program-service-detail-json'
import { persistScheduleEducationFormByDetailOverlay } from '@/features/program/general/model/common-info-edit-schema'
import { buildRegistrationOverlayForPersist } from '@/features/program/shared/lib/public-program-title'
import { resolveParticipantRecruitmentRemarks } from '@/features/program/shared/lib/program-update-common-string-fields'
import { resolveGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { resyncEconomyRegistrationOverlayFromProgram } from '@/features/program/1c-1s/lib/registration-overlay-sync'
import { preserveCompanySchoolCompatibilityOverlay } from '@/features/program/1c-1s/lib/serialize-registration-overlay-from-canonical'

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
    targetLevels: resolvePersistedProgramTargetLevels(program),
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

function persistCompanySchoolRegistrationOverlay(
  program: Program
): Record<string, unknown> | undefined {
  const economy = resyncEconomyRegistrationOverlayFromProgram(
    program,
    program.registrationOverlay
  )
  const remarks = resolveParticipantRecruitmentRemarks(program)
  const notesNA = program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable
  const overlay: Record<string, unknown> = { ...economy }
  if (remarks) {
    overlay['recruit.notes'] = remarks
    overlay['recruit.individual.notes'] = remarks
  }
  if (notesNA === true || notesNA === false) {
    overlay['recruit.notesNotApplicable'] = notesNA
  }
  const rebuilt = persistScheduleEducationFormByDetailOverlay(
    buildRegistrationOverlayForPersist({ ...program, registrationOverlay: overlay }),
    program.generalCommonInfo?.scheduleDetails
  )
  return preserveCompanySchoolCompatibilityOverlay(rebuilt ?? {}, program.registrationOverlay)
}

export function serializeCompanySchoolServiceDetailJson(program: Program): string {
  const registrationOverlay = persistCompanySchoolRegistrationOverlay(program)
  const payload: CompanySchoolServiceDetailJsonV1 = {
    schemaVersion: COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION,
    program: companySchoolDetails(program),
    ...(registrationOverlay ? { registration: { overlay: registrationOverlay } } : {}),
  }
  return JSON.stringify(payload)
}

type GeneralCommonInfo = NonNullable<Program['generalCommonInfo']>

const RECRUITMENT_GENERAL_COMMON_INFO_KEYS = new Set<keyof GeneralCommonInfo>([
  'participantRecruitmentInfo',
  'instructorRecruitmentInfo',
  'volunteerRecruitmentInfo',
  'volunteerInterviewScheduleInfo',
])

const PARTICIPANT_RECRUITMENT_PATCH_KEYS = [
  'applicationStartDate',
  'applicationEndDate',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'recruitmentGuide',
  'learningSupportContent',
  'additionalContentHtml',
  'remarks',
  'generalParticipantInterviewEnabled',
] as const satisfies ReadonlyArray<keyof Program>

const INSTRUCTOR_RECRUITMENT_PATCH_KEYS = [
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'documentPassAnnouncementDate',
  'documentPassAnnouncementMethod',
  'interviewStartDate',
  'interviewEndDate',
  'interviewMethod',
  'finalPassAnnouncementDate',
  'finalPassAnnouncementMethod',
  'instructorTarget',
  'instructorTargets',
  'instructorTargetDetail',
  'instructorCapacity',
  'applicationMethod',
] as const satisfies ReadonlyArray<keyof Program>

const VOLUNTEER_RECRUITMENT_PATCH_KEYS = [
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'volunteerTarget',
  'volunteerTargets',
  'volunteerTargetDetail',
  'generalVolunteerInterviewEnabled',
  'otherNotes',
] as const satisfies ReadonlyArray<keyof Program>

const PARTICIPANT_RECRUITMENT_PROGRAM_SLICE_KEYS = [
  'studentListRequired',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'applicationMethod',
  'generalParticipantInterviewEnabled',
] as const satisfies ReadonlyArray<keyof Program>

const INSTRUCTOR_RECRUITMENT_PROGRAM_SLICE_KEYS = [
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'documentPassAnnouncementDate',
  'documentPassAnnouncementMethod',
  'interviewStartDate',
  'interviewEndDate',
  'interviewMethod',
  'finalPassAnnouncementDate',
  'finalPassAnnouncementMethod',
  'instructorTarget',
  'instructorTargets',
  'instructorTargetDetail',
  'instructorCapacity',
] as const satisfies ReadonlyArray<keyof Program>

const VOLUNTEER_RECRUITMENT_PROGRAM_SLICE_KEYS = [
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'volunteerTarget',
  'volunteerTargets',
  'volunteerTargetDetail',
  'generalVolunteerInterviewEnabled',
  'otherNotes',
] as const satisfies ReadonlyArray<keyof Program>

const SERVICE_DETAIL_PROGRAM_SLICE_KEYS = [
  'posterImage',
  'targetLevels',
  'approvedStudentCount',
  'instructorCapacity',
  'participatingSchoolCount',
  'participatingStudentCount',
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'documentPassAnnouncementDate',
  'documentPassAnnouncementMethod',
  'interviewStartDate',
  'interviewEndDate',
  'interviewMethod',
  'finalPassAnnouncementDate',
  'finalPassAnnouncementMethod',
  'instructorTarget',
  'instructorTargets',
  'instructorTargetDetail',
  'applicationMethod',
  'otherNotes',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'applicationFormTemplateId',
  'surveyFormTemplateId',
  'satisfactionFormTemplateId',
  'lectureReportFormTemplateId',
  'generalParticipantTypes',
  'generalVolunteerInterviewEnabled',
  'generalParticipantInterviewEnabled',
  'generalSurveyMenuKeys',
  'generalProgramAudience',
  'generalProgramEducationStructure',
  'generalProgramSessionRound',
  'scheduleTimeEnabled',
  'startTime',
  'endTime',
  'createdByName',
  'updatedByName',
  'generalVolunteers',
  'staffVolunteers',
  'returningVolunteers',
] as const satisfies ReadonlyArray<keyof Program>

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

function patchTouchesParticipantRecruitment(patch: Partial<Program>): boolean {
  if (PARTICIPANT_RECRUITMENT_PATCH_KEYS.some(key => patchHasKey(patch, key))) return true
  const gci = patch.generalCommonInfo
  return gci != null && Object.prototype.hasOwnProperty.call(gci, 'participantRecruitmentInfo')
}

function patchTouchesInstructorRecruitment(patch: Partial<Program>): boolean {
  if (INSTRUCTOR_RECRUITMENT_PATCH_KEYS.some(key => patchHasKey(patch, key))) return true
  const gci = patch.generalCommonInfo
  return gci != null && Object.prototype.hasOwnProperty.call(gci, 'instructorRecruitmentInfo')
}

function patchTouchesVolunteerRecruitment(patch: Partial<Program>): boolean {
  if (VOLUNTEER_RECRUITMENT_PATCH_KEYS.some(key => patchHasKey(patch, key))) return true
  const gci = patch.generalCommonInfo
  return (
    gci != null &&
    (Object.prototype.hasOwnProperty.call(gci, 'volunteerRecruitmentInfo') ||
      Object.prototype.hasOwnProperty.call(gci, 'volunteerInterviewScheduleInfo'))
  )
}

function shouldIncludeProgramSliceKey(key: keyof Program, patch: Partial<Program>): boolean {
  if (
    !patchTouchesParticipantRecruitment(patch) &&
    (PARTICIPANT_RECRUITMENT_PROGRAM_SLICE_KEYS as readonly string[]).includes(key)
  ) {
    return false
  }
  if (
    !patchTouchesInstructorRecruitment(patch) &&
    (INSTRUCTOR_RECRUITMENT_PROGRAM_SLICE_KEYS as readonly string[]).includes(key)
  ) {
    return false
  }
  if (
    !patchTouchesVolunteerRecruitment(patch) &&
    (VOLUNTEER_RECRUITMENT_PROGRAM_SLICE_KEYS as readonly string[]).includes(key)
  ) {
    return false
  }
  return true
}

/** 공통정보 패치는 모집 블록을 빼고, 이번 패치가 건드린 모집 종류만 중첩 객체를 남긴다. */
function includeRecruitmentCommonInfoKey(
  key: keyof GeneralCommonInfo,
  patch: Partial<Program>
): boolean {
  if (key === 'participantRecruitmentInfo') return patchTouchesParticipantRecruitment(patch)
  if (key === 'instructorRecruitmentInfo') return patchTouchesInstructorRecruitment(patch)
  if (key === 'volunteerRecruitmentInfo' || key === 'volunteerInterviewScheduleInfo') {
    return patchTouchesVolunteerRecruitment(patch)
  }
  return false
}

function generalCommonInfoForUpdatePatch(
  merged: Program,
  patch: Partial<Program>
): GeneralCommonInfo | undefined {
  if (!patchHasKey(patch, 'generalCommonInfo') || !patch.generalCommonInfo) return undefined

  const next: Record<string, unknown> = {}
  for (const key of Object.keys(patch.generalCommonInfo) as (keyof GeneralCommonInfo)[]) {
    if (
      RECRUITMENT_GENERAL_COMMON_INFO_KEYS.has(key) &&
      !includeRecruitmentCommonInfoKey(key, patch)
    ) {
      continue
    }
    const value = merged.generalCommonInfo?.[key] ?? patch.generalCommonInfo[key]
    if (value !== undefined) {
      next[key] = value
    }
  }
  return Object.keys(next).length > 0 ? (next as GeneralCommonInfo) : undefined
}

function buildProgramSliceForUpdatePatch(merged: Program, patch: Partial<Program>): Partial<Program> {
  const slice: Record<string, unknown> = {}

  for (const key of SERVICE_DETAIL_PROGRAM_SLICE_KEYS) {
    if (!patchHasKey(patch, key)) continue
    if (!shouldIncludeProgramSliceKey(key, patch)) continue
    slice[key] = merged[key]
  }

  const commonInfo = generalCommonInfoForUpdatePatch(merged, patch)
  if (commonInfo) {
    slice.generalCommonInfo = commonInfo
  }

  return companySchoolVolunteerOff(slice as Partial<Program>)
}

/**
 * 부분 PATCH용 — patch에 실린 serviceDetail 키만 JSON에 담고,
 * 모집 탭을 건드리지 않았으면 참여자/강사/봉사 모집 블록·registration overlay 를 제외한다.
 */
export function serializeCompanySchoolServiceDetailJsonForUpdatePatch(
  merged: Program,
  patch: Partial<Program>
): string {
  const payload: CompanySchoolServiceDetailJsonV1 = {
    schemaVersion: COMPANY_SCHOOL_SERVICE_DETAIL_JSON_VERSION,
    program: buildProgramSliceForUpdatePatch(merged, patch),
  }

  if (
    patchHasKey(patch, 'registrationOverlay') ||
    patchHasKey(patch, 'ujatRegistrationOverlay') ||
    patchHasKey(patch, 'remarks')
  ) {
    const registrationOverlay = persistCompanySchoolRegistrationOverlay(merged)
    if (registrationOverlay) {
      payload.registration = { overlay: registrationOverlay }
    }
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
      const fromProgram = companySchoolVolunteerOff(parsed.program as Partial<Program>)
      return applyWageSidecar(
        {
          ...fromProgram,
          ...(registrationOverlay ? { registrationOverlay } : {}),
          generalSurveyMenuKeys: resolveGeneralSurveyMenuKeys({
            keys: fromProgram.generalSurveyMenuKeys,
            overlay: registrationOverlay,
          }),
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
    const fromNormalized = companySchoolVolunteerOff(normalized)
    return applyWageSidecar(
      {
        ...fromNormalized,
        ...(registrationOverlay ? { registrationOverlay } : {}),
        generalSurveyMenuKeys: resolveGeneralSurveyMenuKeys({
          keys: fromNormalized.generalSurveyMenuKeys,
          overlay: registrationOverlay,
        }),
      },
      wageSidecar
    )
  } catch {
    return applyWageSidecar({}, extractCompanySchoolWageSidecar(parsed))
  }
}
