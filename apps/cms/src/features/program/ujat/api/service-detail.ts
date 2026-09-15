import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { normalizeUjatProgressStatus } from '@/features/program/ujat/lib/normalize-ujat-progress-status'

const VERSION = 1 as const

const ROUND_TRIP_FIELDS = [
  'ujatProgressStatus',
  'ujatFirstHalfVolunteerCount',
  'ujatSecondHalfVolunteerCount',
  'targetLevels',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
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
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'volunteerTarget',
  'volunteerTargets',
  'volunteerTargetDetail',
  'applicationMethod',
  'otherNotes',
  'applicationFormTemplateId',
  'surveyFormTemplateId',
  'satisfactionFormTemplateId',
  'lectureReportFormTemplateId',
  'scheduleTimeEnabled',
  'startTime',
  'endTime',
  'generalSurveyMenuKeys',
  'generalCommonInfo',
] as const satisfies readonly (keyof Program)[]

type RoundTripField = (typeof ROUND_TRIP_FIELDS)[number]
export type ServiceDetailProgram = Pick<Program, RoundTripField>

export type RegistrationSnapshot = {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
}

/** FE write envelope + Primary flat config_jsonb extras (표시용, Program 필드 외) */
export type UjatServiceDetailExtras = {
  /** FULL_YEAR — Semester 자식 없음 */
  semesterType?: string
  educationForm?: string
  preTrainingDeliveredBy?: string
  blockedDates?: unknown
  blockedDatesH1?: unknown
  blockedDatesH2?: unknown
  listCaps?: unknown
  semesterCalendars?: unknown
  surveyMenuKeys?: string[]
}

type ServiceDetailV1 = {
  version: typeof VERSION
  program: Partial<ServiceDetailProgram>
  registration?: RegistrationSnapshot
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function pickProgramFields(program: Program): Partial<ServiceDetailProgram> {
  const result: Partial<ServiceDetailProgram> = {}
  for (const key of ROUND_TRIP_FIELDS) {
    const value = program[key]
    if (value !== undefined) {
      Object.assign(result, { [key]: value })
    }
  }
  return result
}

function hydrateFromRecord(source: Record<string, unknown>): Partial<ServiceDetailProgram> {
  const result: Partial<ServiceDetailProgram> = {}
  for (const key of ROUND_TRIP_FIELDS) {
    if (!(key in source)) continue
    if (key === 'ujatProgressStatus') {
      const normalized = normalizeUjatProgressStatus(
        typeof source[key] === 'string' ? source[key] : null
      )
      if (normalized) result.ujatProgressStatus = normalized
      continue
    }
    Object.assign(result, { [key]: source[key] })
  }

  // survey menu — BE flat keys
  if (!result.generalSurveyMenuKeys) {
    const keys = source.surveyMenuKeys ?? source.generalSurveyMenuKeys
    if (Array.isArray(keys)) {
      result.generalSurveyMenuKeys = normalizeGeneralSurveyMenuKeys(
        keys.filter((item): item is string => typeof item === 'string')
      )
    }
  }

  return result
}

export function serializeServiceDetail(
  program: Program,
  registration?: RegistrationSnapshot
): string {
  const payload: ServiceDetailV1 = {
    version: VERSION,
    program: pickProgramFields(program),
    ...(registration ? { registration } : {}),
  }
  return JSON.stringify(payload)
}

/**
 * FE `{ version:1, program }` envelope + BE Primary flat `config_jsonb` 모두 수용.
 */
export function parseServiceDetail(value: string | undefined): Partial<ServiceDetailProgram> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed)) return {}

    // FE write envelope
    if (isRecord(parsed.program)) {
      if (parsed.version != null && parsed.version !== VERSION) {
        // still try hydrate program if Primary nested under program
        return hydrateFromRecord(parsed.program)
      }
      return hydrateFromRecord(parsed.program)
    }

    // Primary flat config (ujat_program_detail.config_jsonb)
    const hasPrimaryShape =
      parsed.ujatProgressStatus != null ||
      parsed.semesterType != null ||
      parsed.educationForm != null ||
      parsed.preTrainingDeliveredBy != null ||
      parsed.blockedDates != null ||
      parsed.blockedDatesH1 != null ||
      parsed.listCaps != null ||
      parsed.surveyMenuKeys != null ||
      parsed.seedCase != null ||
      parsed.frontendProgramId != null

    if (!hasPrimaryShape) return {}
    return hydrateFromRecord(parsed)
  } catch {
    return {}
  }
}

/** 표시·LNB용 extras (Program 타입 밖 키) */
export function parseUjatServiceDetailExtras(
  value: string | undefined
): UjatServiceDetailExtras {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed)) return {}
    const root = isRecord(parsed.program) ? { ...parsed, ...parsed.program } : parsed
    const surveyMenuKeys = Array.isArray(root.surveyMenuKeys)
      ? root.surveyMenuKeys.filter((item): item is string => typeof item === 'string')
      : Array.isArray(root.generalSurveyMenuKeys)
        ? root.generalSurveyMenuKeys.filter((item): item is string => typeof item === 'string')
        : undefined

    return {
      semesterType: typeof root.semesterType === 'string' ? root.semesterType : undefined,
      educationForm: typeof root.educationForm === 'string' ? root.educationForm : undefined,
      preTrainingDeliveredBy:
        typeof root.preTrainingDeliveredBy === 'string'
          ? root.preTrainingDeliveredBy
          : undefined,
      blockedDates: root.blockedDates,
      blockedDatesH1: root.blockedDatesH1,
      blockedDatesH2: root.blockedDatesH2,
      listCaps: root.listCaps,
      semesterCalendars: root.semesterCalendars ?? root.calendars,
      surveyMenuKeys,
    }
  } catch {
    return {}
  }
}

/** PATCH 전에 기존 등록 draft/overlay를 다시 포함하기 위한 보존용 파서 */
export function parseRegistrationSnapshot(
  value: string | undefined
): RegistrationSnapshot | undefined {
  if (!value) return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || parsed.version !== VERSION || !isRecord(parsed.registration)) {
      return undefined
    }
    if (!isRecord(parsed.registration.draft) || !isRecord(parsed.registration.overlay)) {
      return undefined
    }
    return {
      draft: parsed.registration.draft as unknown as WritingFormDraft,
      overlay: parsed.registration.overlay,
    }
  } catch {
    return undefined
  }
}
