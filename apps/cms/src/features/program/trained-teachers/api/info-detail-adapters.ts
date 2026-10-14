import type { Program } from '@/types/domain'
import type { TrainedTeacherProgramDetailRequest } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailRequest'
import type { TrainedTeacherProgramDetailResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailResponse'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import { clearTeacherTrainingScheduleIfOff } from '@/features/program/trained-teachers/lib/teacher-training-schedule'

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

function mergeDetailRows<T extends object>(
  programRows: T[] | undefined,
  patchRows: T[] | undefined
): T[] | undefined {
  if (!patchRows?.length) return programRows
  if (!programRows?.length) return patchRows
  const length = Math.max(programRows.length, patchRows.length)
  return Array.from({ length }, (_, index) => {
    const base = (programRows[index] ?? {}) as Record<string, unknown>
    const overlay = (patchRows[index] ?? {}) as Record<string, unknown>
    const merged: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(overlay)) {
      if (value !== undefined && value !== null && value !== '') merged[key] = value
    }
    return merged as T
  })
}

function commonInfoFromConfigJson(
  parsed: Record<string, unknown>
): NonNullable<Program['generalCommonInfo']> | undefined {
  const fromProgram =
    isRecord(parsed.program) && isRecord(parsed.program.generalCommonInfo)
      ? (parsed.program.generalCommonInfo as NonNullable<Program['generalCommonInfo']>)
      : undefined
  const fromRoot = isRecord(parsed.generalCommonInfo)
    ? (parsed.generalCommonInfo as NonNullable<Program['generalCommonInfo']>)
    : undefined
  // BE가 serviceDetailJson 전체를 configJson에 미러하면 루트 generalCommonInfo는 구값일 수 있음.
  // FE write SSOT는 program.generalCommonInfo.
  return fromProgram ?? fromRoot
}

/**
 * B `configJson.generalCommonInfo` 는 이 키만. 공고명·세부명·후원·장소·KPI 는 A envelope.
 * GET detail `configJson` 에 announcementTitle / sponsorManagementIds / textbookName 이 있으면 실패.
 * 여기 없는 키는 B가 지우지 않는다 (overlay).
 */
const TRAINED_TEACHER_INFO_CONFIG_OVERLAY_KEYS = [
  'curriculumSessions',
  'scheduleDetails',
  'educationScheduleLines',
  'educationScheduleMode',
  'educationScheduleRange',
] as const

function narrowTrainedTeacherInfoConfigCommonInfo(
  commonInfo: NonNullable<Program['generalCommonInfo']>
): NonNullable<Program['generalCommonInfo']> {
  const trainingEnabled = commonInfo.teacherTrainingEnabled === true
  const cleared = clearTeacherTrainingScheduleIfOff(commonInfo, {
    teacherTrainingEnabled: trainingEnabled,
    teacherTrainingScheduleName: trainingEnabled ? TRAINED_TEACHER_TRAINING_SCHEDULE_NAME : '',
  })
  const source = cleared as Record<string, unknown>
  const next: Record<string, unknown> = {
    educationJournalEnabled: cleared.educationJournalEnabled === true,
    teacherTrainingEnabled: trainingEnabled,
    teacherTrainingScheduleName: trainingEnabled ? TRAINED_TEACHER_TRAINING_SCHEDULE_NAME : '',
  }
  for (const key of TRAINED_TEACHER_INFO_CONFIG_OVERLAY_KEYS) {
    if (source[key] !== undefined) next[key] = source[key]
  }
  return next as NonNullable<Program['generalCommonInfo']>
}

export function serializeTrainedTeacherInfoConfigJson(
  payload: TrainedTeachersCommonInfoSavePayload
): string {
  const body: InfoConfigJsonV1 = {
    schemaVersion: TRAINED_TEACHER_INFO_CONFIG_JSON_VERSION,
    generalCommonInfo: narrowTrainedTeacherInfoConfigCommonInfo(payload.commonInfo),
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
    const nestedCommon = commonInfoFromConfigJson(parsed)
    const nestedRange = parseIsoRange(nestedCommon?.educationScheduleRange)
    const rootRange = parseIsoRange(parsed.educationScheduleRange)
    const educationScheduleRange = nestedRange ?? rootRange
    const educationScheduleMode =
      nestedCommon?.educationScheduleMode === 'date' ||
      nestedCommon?.educationScheduleMode === 'period'
        ? nestedCommon.educationScheduleMode
        : parsed.educationScheduleMode === 'date' || parsed.educationScheduleMode === 'period'
          ? parsed.educationScheduleMode
          : undefined
    const educationScheduleLines = Array.isArray(nestedCommon?.educationScheduleLines)
      ? nestedCommon.educationScheduleLines
      : Array.isArray(parsed.educationScheduleLines)
        ? (parsed.educationScheduleLines.filter(line => typeof line === 'string') as string[])
        : undefined
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
    generalCommonInfo: clearTeacherTrainingScheduleIfOff(
      {
        ...baseCommon,
        educationJournalEnabled:
          dto.educationJournalEnabled ?? baseCommon.educationJournalEnabled,
      },
      {
        teacherTrainingEnabled: dto.teacherTrainingEnabled ?? baseCommon.teacherTrainingEnabled,
        teacherTrainingScheduleName:
          dto.teacherTrainingScheduleName ?? baseCommon.teacherTrainingScheduleName,
      }
    ),
    updatedAt: dto.updatedAt ?? undefined,
  }
}

/**
 * 교육받은 교사 공통정보 저장 직후 캐시.
 * programs PATCH가 넣어 둔 기본정보(장소·후원·공고)는 유지하고,
 * 일지·연수·커리큘럼·일정은 이번 detail 저장 payload로 덮는다.
 * detail 저장 뒤 programs GET이 구값이면 그 GET으로 캐시를 통째로 바꾸지 않는다.
 */
export function applyTrainedTeacherInfoDetailSaveToCache(
  cached: Program | undefined,
  saved: Program,
  programId: string,
  payloadCommon?: Partial<NonNullable<Program['generalCommonInfo']>>
): Program {
  const base = cached ?? saved
  return {
    ...base,
    id: programId || base.id,
    updatedAt: saved.updatedAt ?? base.updatedAt,
    educatedTeachers: saved.educatedTeachers ?? base.educatedTeachers,
    generalCommonInfo: {
      ...base.generalCommonInfo,
      ...payloadCommon,
      kpi: base.generalCommonInfo?.kpi ?? payloadCommon?.kpi,
      curriculumSessions:
        payloadCommon?.curriculumSessions ??
        saved.generalCommonInfo?.curriculumSessions ??
        base.generalCommonInfo?.curriculumSessions,
      scheduleDetails:
        payloadCommon?.scheduleDetails ??
        saved.generalCommonInfo?.scheduleDetails ??
        base.generalCommonInfo?.scheduleDetails,
      educationJournalEnabled:
        payloadCommon?.educationJournalEnabled ??
        saved.generalCommonInfo?.educationJournalEnabled ??
        base.generalCommonInfo?.educationJournalEnabled,
      teacherTrainingEnabled:
        payloadCommon?.teacherTrainingEnabled ??
        saved.generalCommonInfo?.teacherTrainingEnabled ??
        base.generalCommonInfo?.teacherTrainingEnabled,
      teacherTrainingScheduleName:
        payloadCommon?.teacherTrainingScheduleName ??
        saved.generalCommonInfo?.teacherTrainingScheduleName ??
        base.generalCommonInfo?.teacherTrainingScheduleName,
    },
  }
}

export function mergeTrainedTeacherInfoDetailIntoProgram(
  program: Program,
  dto: TrainedTeacherProgramDetailResponse,
  options?: { tablePreference?: 'program' | 'detail' }
): Program {
  const patch = mapTrainedTeacherInfoDetailToProgramPatch(dto)
  const programCommon = program.generalCommonInfo
  const patchCommon = patch.generalCommonInfo
  const programKpi = programCommon?.kpi
  const patchKpi = patchCommon?.kpi
  return {
    ...program,
    ...patch,
    generalCommonInfo: clearTeacherTrainingScheduleIfOff(
      {
        ...patchCommon,
        ...programCommon,
        educationJournalEnabled:
          dto.educationJournalEnabled ??
          programCommon?.educationJournalEnabled ??
          patchCommon?.educationJournalEnabled,
        // 한쪽 JSON이 일정명·진행 시간을 빼도 다른 쪽 값을 남긴다.
        curriculumSessions:
          options?.tablePreference === 'program'
            ? mergeDetailRows(patchCommon?.curriculumSessions, programCommon?.curriculumSessions)
            : mergeDetailRows(programCommon?.curriculumSessions, patchCommon?.curriculumSessions),
        scheduleDetails:
          options?.tablePreference === 'program'
            ? mergeDetailRows(patchCommon?.scheduleDetails, programCommon?.scheduleDetails)
            : mergeDetailRows(programCommon?.scheduleDetails, patchCommon?.scheduleDetails),
        educationScheduleLines:
          programCommon?.educationScheduleLines ?? patchCommon?.educationScheduleLines,
        educationScheduleMode:
          programCommon?.educationScheduleMode ?? patchCommon?.educationScheduleMode,
        educationScheduleRange:
          programCommon?.educationScheduleRange ?? patchCommon?.educationScheduleRange,
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
      {
        teacherTrainingEnabled:
          dto.teacherTrainingEnabled ??
          programCommon?.teacherTrainingEnabled ??
          patchCommon?.teacherTrainingEnabled,
        teacherTrainingScheduleName:
          dto.teacherTrainingScheduleName ??
          programCommon?.teacherTrainingScheduleName ??
          patchCommon?.teacherTrainingScheduleName,
      }
    ),
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
      : '',
    configJson: serializeTrainedTeacherInfoConfigJson(payload),
  }
}
