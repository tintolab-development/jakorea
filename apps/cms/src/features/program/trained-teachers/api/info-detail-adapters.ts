import type { Program } from '@/types/domain'
import type { TrainedTeacherProgramDetailRequest } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailRequest'
import type { TrainedTeacherProgramDetailResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailResponse'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'

export const TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION = 1 as const

export type TrainedTeachersCommonInfoSavePayload = {
  educatedTeachers?: number
  commonInfo: NonNullable<Program['generalCommonInfo']>
}

type InfoConfigJsonV1 = {
  schemaVersion: typeof TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION
  educatedTeachers?: number
  generalCommonInfo?: NonNullable<Program['generalCommonInfo']>
  /** BE may store schedule range at config root (not only nested commonInfo) */
  educationScheduleRange?: { start: string; end: string }
  educationScheduleMode?: 'date' | 'period'
  educationScheduleLines?: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function parseIsoRange(value: unknown): { start: string; end: string } | undefined {
  if (!isRecord(value)) return undefined
  const start = typeof value.start === 'string' ? value.start : undefined
  const end = typeof value.end === 'string' ? value.end : undefined
  if (!start || !end) return undefined
  return { start, end }
}

export function serializeTrainedTeacherInfoConfigJson(
  payload: TrainedTeachersCommonInfoSavePayload
): string {
  const body: InfoConfigJsonV1 = {
    schemaVersion: TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION,
    educatedTeachers: payload.educatedTeachers,
    generalCommonInfo: payload.commonInfo,
    educationScheduleRange: payload.commonInfo.educationScheduleRange,
    educationScheduleMode: payload.commonInfo.educationScheduleMode,
    educationScheduleLines: payload.commonInfo.educationScheduleLines,
  }
  return JSON.stringify(body)
}

export function parseTrainedTeacherInfoConfigJson(raw?: string | null): {
  educatedTeachers?: number
  generalCommonInfo?: NonNullable<Program['generalCommonInfo']>
} {
  if (!raw?.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return {}
    if (parsed.schemaVersion !== TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION) return {}
    const nestedCommon = isRecord(parsed.generalCommonInfo)
      ? (parsed.generalCommonInfo as NonNullable<Program['generalCommonInfo']>)
      : undefined
    const rootRange = parseIsoRange(parsed.educationScheduleRange)
    const nestedRange = parseIsoRange(nestedCommon?.educationScheduleRange)
    const educationScheduleRange = rootRange ?? nestedRange
    const educationScheduleMode =
      parsed.educationScheduleMode === 'date' || parsed.educationScheduleMode === 'period'
        ? parsed.educationScheduleMode
        : nestedCommon?.educationScheduleMode
    const educationScheduleLines = Array.isArray(parsed.educationScheduleLines)
      ? (parsed.educationScheduleLines.filter(line => typeof line === 'string') as string[])
      : nestedCommon?.educationScheduleLines
    return {
      educatedTeachers:
        typeof parsed.educatedTeachers === 'number' ? parsed.educatedTeachers : undefined,
      generalCommonInfo:
        nestedCommon || educationScheduleRange || educationScheduleMode || educationScheduleLines
          ? {
              ...nestedCommon,
              ...(educationScheduleRange ? { educationScheduleRange } : {}),
              ...(educationScheduleMode ? { educationScheduleMode } : {}),
              ...(educationScheduleLines ? { educationScheduleLines } : {}),
            }
          : undefined,
    }
  } catch {
    return {}
  }
}

/** GET detail 응답 → Program 필드 오버레이 */
export function mapTrainedTeacherInfoDetailToProgramPatch(
  dto: TrainedTeacherProgramDetailResponse
): Partial<Program> {
  const fromConfig = parseTrainedTeacherInfoConfigJson(dto.configJson)
  const baseCommon = fromConfig.generalCommonInfo ?? {}
  return {
    educatedTeachers: fromConfig.educatedTeachers,
    generalCommonInfo: {
      ...baseCommon,
      teacherTrainingEnabled:
        dto.teacherTrainingEnabled ?? baseCommon.teacherTrainingEnabled,
      educationJournalEnabled:
        dto.educationJournalEnabled ?? baseCommon.educationJournalEnabled,
    },
    updatedAt: dto.updatedAt,
  }
}

export function mergeTrainedTeacherInfoDetailIntoProgram(
  program: Program,
  dto: TrainedTeacherProgramDetailResponse
): Program {
  const patch = mapTrainedTeacherInfoDetailToProgramPatch(dto)
  const programKpi = program.generalCommonInfo?.kpi
  const patchKpi = patch.generalCommonInfo?.kpi
  return {
    ...program,
    ...patch,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      ...patch.generalCommonInfo,
      // KPI SSOT = programs PATCH / serviceDetailJson — configJson 이 옛 kpi 로 덮지 않음
      kpi: {
        ...patchKpi,
        ...programKpi,
        finalParticipants:
          program.totalParticipants ??
          programKpi?.finalParticipants ??
          patchKpi?.finalParticipants ??
          0,
        finalSchools: programKpi?.finalSchools ?? patchKpi?.finalSchools ?? 0,
        finalClasses: programKpi?.finalClasses ?? patchKpi?.finalClasses ?? 0,
        instructorCount: programKpi?.instructorCount ?? patchKpi?.instructorCount ?? 0,
        volunteerCount: programKpi?.volunteerCount ?? patchKpi?.volunteerCount ?? 0,
      },
    },
    educatedTeachers: program.educatedTeachers ?? patch.educatedTeachers,
    totalParticipants: program.totalParticipants,
    participatingSchoolCount:
      program.participatingSchoolCount ?? programKpi?.finalSchools,
    updatedAt: patch.updatedAt ?? program.updatedAt,
  }
}

/** 공통 정보 저장 payload → PATCH body */
export function mapTrainedTeacherInfoSaveToRequest(
  payload: TrainedTeachersCommonInfoSavePayload
): TrainedTeacherProgramDetailRequest {
  return {
    teacherTrainingEnabled: payload.commonInfo.teacherTrainingEnabled ?? false,
    educationJournalEnabled: payload.commonInfo.educationJournalEnabled ?? false,
    educationJournalRequired: false,
    journalSubmissionLimitType: 'UNLIMITED',
    teacherTrainingScheduleName: payload.commonInfo.teacherTrainingEnabled
      ? TRAINED_TEACHER_TRAINING_SCHEDULE_NAME
      : undefined,
    configJson: serializeTrainedTeacherInfoConfigJson(payload),
  }
}
