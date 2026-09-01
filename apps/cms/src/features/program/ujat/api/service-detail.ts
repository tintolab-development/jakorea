import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'

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
] as const satisfies readonly (keyof Program)[]

type RoundTripField = (typeof ROUND_TRIP_FIELDS)[number]
export type ServiceDetailProgram = Pick<Program, RoundTripField>

export type RegistrationSnapshot = {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
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

export function parseServiceDetail(value: string | undefined): Partial<ServiceDetailProgram> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || parsed.version !== VERSION || !isRecord(parsed.program)) return {}

    const result: Partial<ServiceDetailProgram> = {}
    for (const key of ROUND_TRIP_FIELDS) {
      if (key in parsed.program) {
        Object.assign(result, { [key]: parsed.program[key] })
      }
    }
    return result
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
