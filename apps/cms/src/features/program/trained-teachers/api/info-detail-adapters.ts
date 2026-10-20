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
 * 교육받은 교사 공통정보(detail) 저장 직후 캐시.
 * 차시·일지·연수는 GET이 정본이다.
 * 설문 진행 항목은 이 PATCH가 쓰지 않는다. 열린 상세에 키가 있으면 그 값을 유지하고,
 * 없을 때만 GET 키를 쓴다.
 */
export function applyTrainedTeacherInfoDetailSaveToCache(
  cached: Program | undefined,
  saved: Program,
  programId: string,
  _payloadCommon?: Partial<NonNullable<Program['generalCommonInfo']>>
): Program {
  const cachedSurveyKeys = cached?.generalSurveyMenuKeys
  const keepCachedSurvey = cachedSurveyKeys !== undefined
  const generalSurveyMenuKeys = keepCachedSurvey ? cachedSurveyKeys : saved.generalSurveyMenuKeys
  const registrationOverlay = keepCachedSurvey
    ? (cached?.registrationOverlay ?? saved.registrationOverlay)
    : (saved.registrationOverlay ?? cached?.registrationOverlay)
  return {
    ...saved,
    id: programId || saved.id,
    ...(generalSurveyMenuKeys !== undefined ? { generalSurveyMenuKeys } : {}),
    ...(registrationOverlay !== undefined ? { registrationOverlay } : {}),
  }
}

export function mergeTrainedTeacherInfoDetailIntoProgram(
  program: Program,
  dto: TrainedTeacherProgramDetailResponse
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
        // detail GET 배열이 정본. programs JSON 이전 행으로 셀을 채우지 않는다. 없으면 빈 표.
        curriculumSessions: patchCommon?.curriculumSessions,
        scheduleDetails: patchCommon?.scheduleDetails,
        educationScheduleLines: patchCommon?.educationScheduleLines,
        educationScheduleMode: patchCommon?.educationScheduleMode,
        educationScheduleRange: patchCommon?.educationScheduleRange,
        kpi: programKpi ?? patchKpi,
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
    educatedTeachers: program.educatedTeachers,
    totalParticipants: program.totalParticipants,
    participatingSchoolCount: program.participatingSchoolCount,
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
