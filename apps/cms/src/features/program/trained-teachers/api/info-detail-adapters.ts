import type { Program } from '@/types/domain'
import type { TrainedTeacherProgramDetailRequest } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailRequest'
import type { TrainedTeacherProgramDetailResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherProgramDetailResponse'
import { parseCompatibleBoolean } from '@/features/program/trained-teachers/lib/common-info-persist'
import { clearTeacherTrainingScheduleIfOff } from '@/features/program/trained-teachers/lib/teacher-training-schedule'
import {
  normalizeTeacherTrainingEducationFormat,
  resolveTeacherTrainingScheduleName,
} from '@/features/program/trained-teachers/lib/teacher-training-block'

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

function parseIsoRange(
  value: unknown
): { start: string; end: string } | null | undefined {
  if (value === null) return null
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
  // 연수 일정명은 서버 저장값 유지 — scheduleDetails 연수 행 name 과 일치해야 BE가 연수로 본다
  const trainingScheduleName = trainingEnabled
    ? resolveTeacherTrainingScheduleName(commonInfo.teacherTrainingScheduleName)
    : ''
  const cleared = clearTeacherTrainingScheduleIfOff(commonInfo, {
    teacherTrainingEnabled: trainingEnabled,
    teacherTrainingScheduleName: trainingScheduleName,
  })
  const source = cleared as Record<string, unknown>
  const next: Record<string, unknown> = {
    educationJournalEnabled: parseCompatibleBoolean(cleared.educationJournalEnabled) === true,
    teacherTrainingEnabled: trainingEnabled,
    teacherTrainingScheduleName: trainingScheduleName,
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
              ...(educationScheduleRange !== undefined ? { educationScheduleRange } : {}),
              ...(educationScheduleMode ? { educationScheduleMode } : {}),
              ...(educationScheduleLines ? { educationScheduleLines } : {}),
            }
          : undefined,
    }
  } catch {
    return {}
  }
}

/**
 * 교사 연수 typed 필드 (BE T2). 응답에 키가 없으면(구 BE) 넣지 않는다 — undefined 는 「서버 미제공」.
 */
function readTeacherTrainingTypedFields(
  dto: TrainedTeacherProgramDetailResponse
): Pick<
  NonNullable<Program['generalCommonInfo']>,
  'teacherTrainingEducationFormat' | 'teacherTrainingSchedule'
> {
  const out: Pick<
    NonNullable<Program['generalCommonInfo']>,
    'teacherTrainingEducationFormat' | 'teacherTrainingSchedule'
  > = {}
  if (Object.prototype.hasOwnProperty.call(dto, 'teacherTrainingEducationFormat')) {
    out.teacherTrainingEducationFormat =
      normalizeTeacherTrainingEducationFormat(dto.teacherTrainingEducationFormat) ?? null
  }
  if (Object.prototype.hasOwnProperty.call(dto, 'teacherTrainingSchedule')) {
    const schedule = dto.teacherTrainingSchedule
    out.teacherTrainingSchedule =
      schedule != null
        ? {
            scheduleId: schedule.scheduleId,
            scheduleName: schedule.scheduleName ?? null,
            startAt: schedule.startAt ?? null,
            endAt: schedule.endAt ?? null,
          }
        : null
  }
  return out
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
        ...readTeacherTrainingTypedFields(dto),
        educationJournalEnabled:
          parseCompatibleBoolean(dto.educationJournalEnabled) ??
          parseCompatibleBoolean(baseCommon.educationJournalEnabled),
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

/** 저장 직후 재조회한 원격 응답을 그대로 상세 캐시에 반영한다. */
export function applyTrainedTeacherInfoDetailSaveToCache(
  _cached: Program | undefined,
  saved: Program,
  programId: string,
  _payloadCommon?: Partial<NonNullable<Program['generalCommonInfo']>>
): Program {
  return {
    ...saved,
    id: programId || saved.id,
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
  const typedJournal = parseCompatibleBoolean(dto.educationJournalEnabled)
  const configJournal = parseCompatibleBoolean(
    parseTrainedTeacherInfoConfigJson(dto.configJson).generalCommonInfo?.educationJournalEnabled
  )
  const warnings = [...(program.trainedTeacherInfoDetailWarnings ?? [])]
  if (
    typedJournal !== undefined &&
    configJournal !== undefined &&
    typedJournal !== configJournal
  ) {
    warnings.push('educationJournalEnabled typed/configJson mismatch')
  }
  return {
    ...program,
    ...patch,
    generalCommonInfo: clearTeacherTrainingScheduleIfOff(
      {
        ...patchCommon,
        ...programCommon,
        educationJournalEnabled:
          typedJournal ??
          configJournal ??
          parseCompatibleBoolean(programCommon?.educationJournalEnabled),
        // B 배열이 있으면 B가 정본. 키 생략 시 A nested 를 undefined 로 지우지 않는다.
        curriculumSessions: Array.isArray(patchCommon?.curriculumSessions)
          ? patchCommon.curriculumSessions
          : programCommon?.curriculumSessions,
        scheduleDetails: Array.isArray(patchCommon?.scheduleDetails)
          ? patchCommon.scheduleDetails
          : programCommon?.scheduleDetails,
        educationScheduleLines: Array.isArray(patchCommon?.educationScheduleLines)
          ? patchCommon.educationScheduleLines
          : programCommon?.educationScheduleLines,
        educationScheduleMode:
          patchCommon?.educationScheduleMode ?? programCommon?.educationScheduleMode,
        educationScheduleRange:
          patchCommon != null &&
          Object.prototype.hasOwnProperty.call(patchCommon, 'educationScheduleRange')
            ? patchCommon.educationScheduleRange
            : programCommon?.educationScheduleRange,
        kpi: programKpi ?? patchKpi,
        // 교사 연수 교육 형태·일정 투영은 B(detail) 응답만 정본
        ...(patchCommon != null &&
        Object.prototype.hasOwnProperty.call(patchCommon, 'teacherTrainingEducationFormat')
          ? { teacherTrainingEducationFormat: patchCommon.teacherTrainingEducationFormat }
          : {}),
        ...(patchCommon != null &&
        Object.prototype.hasOwnProperty.call(patchCommon, 'teacherTrainingSchedule')
          ? { teacherTrainingSchedule: patchCommon.teacherTrainingSchedule }
          : {}),
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
    trainedTeacherInfoDetailWarnings: warnings.length > 0 ? warnings : undefined,
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
  const trainingEnabled = payload.commonInfo.teacherTrainingEnabled === true
  const educationFormat = trainingEnabled
    ? normalizeTeacherTrainingEducationFormat(payload.commonInfo.teacherTrainingEducationFormat)
    : undefined
  return {
    teacherTrainingEnabled: trainingEnabled,
    educationJournalEnabled:
      parseCompatibleBoolean(payload.commonInfo.educationJournalEnabled) === true,
    educationJournalRequired: false,
    journalSubmissionLimitType: 'UNLIMITED',
    teacherTrainingScheduleName: trainingEnabled
      ? resolveTeacherTrainingScheduleName(payload.commonInfo.teacherTrainingScheduleName)
      : '',
    // 미선택이면 생략(=기존 유지). OFF 저장은 BE가 함께 지운다.
    ...(educationFormat ? { teacherTrainingEducationFormat: educationFormat } : {}),
    configJson: serializeTrainedTeacherInfoConfigJson(payload),
  }
}
