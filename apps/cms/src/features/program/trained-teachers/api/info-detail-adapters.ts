import type { Program } from '@/types/domain'
import type { TrainedTeacherProgramDetailRequest } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailRequest'
import type { TrainedTeacherProgramDetailResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailResponse'

export const TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION = 1 as const

export type TrainedTeachersCommonInfoSavePayload = {
  educatedTeachers?: number
  commonInfo: NonNullable<Program['generalCommonInfo']>
}

type InfoConfigJsonV1 = {
  schemaVersion: typeof TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION
  educatedTeachers?: number
  generalCommonInfo?: NonNullable<Program['generalCommonInfo']>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function serializeTrainedTeacherInfoConfigJson(
  payload: TrainedTeachersCommonInfoSavePayload
): string {
  const body: InfoConfigJsonV1 = {
    schemaVersion: TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION,
    educatedTeachers: payload.educatedTeachers,
    generalCommonInfo: payload.commonInfo,
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
    return {
      educatedTeachers:
        typeof parsed.educatedTeachers === 'number' ? parsed.educatedTeachers : undefined,
      generalCommonInfo: isRecord(parsed.generalCommonInfo)
        ? (parsed.generalCommonInfo as NonNullable<Program['generalCommonInfo']>)
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
  return {
    ...program,
    ...patch,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      ...patch.generalCommonInfo,
    },
    educatedTeachers: patch.educatedTeachers ?? program.educatedTeachers,
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
    teacherTrainingScheduleName: payload.commonInfo.teacherTrainingEnabled
      ? '교육 연수'
      : undefined,
    configJson: serializeTrainedTeacherInfoConfigJson(payload),
  }
}
