/**
 * 교육받은 교사 「교사 연수」 블록 SSOT (시안 9899:221372 · 5416:111561 · 5416:111869).
 *
 * - 연수는 차시·일정과 별개 블록이다. ■1차시·■2차시 … 는 연수를 뺀 나머지 행을 **화면 순서**로 번호 매긴다
 *   (`sessionNo`·program_schedule.sessionNo 로 차시 번호를 만들지 않는다).
 * - 진행 일정 저장: `generalCommonInfo.scheduleDetails` 에 name = teacherTrainingScheduleName 인 행
 *   (scheduleDateLabel). scheduleRole·blockKind 로 연수를 표시하지 않는다(BE는 일정명 일치로 구분).
 * - 교육 형태 저장: `PATCH …/trained-teacher/detail` 최상위 teacherTrainingEducationFormat.
 * - IPS: Prepare 고정 — 저장·응답 없음, 화면 고정 표기.
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { isEducationScheduleProgressLineMissingOrWithoutClock } from '@/features/template/lib/education-schedule-line-clock-required'
import { TRAINED_TEACHER_TRAINING_SCHEDULE_NAME } from './is-trained-teachers-primary-program'

dayjs.extend(utc)
dayjs.extend(timezone)

/** 화면 블록 라벨 (시안). 저장 일정명과 별개 */
export const TEACHER_TRAINING_BLOCK_LABEL = '교사 연수'

/** 교사 연수 IPS — Prepare 고정 표기 */
export const TEACHER_TRAINING_IPS_LABEL = 'Prepare | 해당 없음'

export type TeacherTrainingEducationFormat = 'ONLINE' | 'OFFLINE' | 'HYBRID'

/** 시안 라디오 라벨 (9899:221372 · 5416:111869) */
export const TEACHER_TRAINING_EDUCATION_FORMAT_OPTIONS: ReadonlyArray<{
  value: TeacherTrainingEducationFormat
  label: string
}> = [
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'HYBRID', label: '온/오프라인' },
]

/** API 오류 코드 — 교사 연수 교육 형태가 허용값이 아님 */
export const TEACHER_TRAINING_INVALID_EDUCATION_FORMAT_ERROR_CODE =
  'INVALID_REQUESTED_EDUCATION_FORMAT'
export const TEACHER_TRAINING_INVALID_EDUCATION_FORMAT_ALERT = {
  title: '입력 확인',
  content: '교사 연수 교육 형태를 온라인, 오프라인, 온/오프라인 중에서 다시 선택해 주세요.',
} as const

export const TEACHER_TRAINING_SCHEDULE_REQUIRED_ALERT = {
  title: '입력 확인',
  content: '교사 연수 진행 일정을 날짜와 시간까지 입력해 주세요.',
} as const

const TRAINING_NAME_TOKENS = new Set(['교육연수', '교사연수', 'teachertraining'])

function compactName(value: string | null | undefined): string {
  return (value ?? '').replace(/[\s_-]+/g, '').toLowerCase()
}

/** 서버/레거시 일정명이 연수인지 — 대소문자·공백 무시 (BE 일정명 일치 규칙과 같음) */
export function isTeacherTrainingScheduleName(
  name: string | null | undefined,
  configuredName?: string | null
): boolean {
  const compact = compactName(name)
  if (!compact) return false
  if (TRAINING_NAME_TOKENS.has(compact)) return true
  const configured = compactName(configuredName)
  return configured !== '' && compact === configured
}

/**
 * 저장할 연수 일정명. 서버에 저장된 이름을 그대로 쓰고, 없을 때만 기본값.
 * 기본값은 BE 기본(`TrainedTeacherProgramPolicy.DEFAULT_TRAINING_SCHEDULE_NAME`)·OpenAPI 설명·기존 데이터와 같은 「교육 연수」.
 */
export function resolveTeacherTrainingScheduleName(name: string | null | undefined): string {
  return name?.trim() || TRAINED_TEACHER_TRAINING_SCHEDULE_NAME
}

export function normalizeTeacherTrainingEducationFormat(
  value: unknown
): TeacherTrainingEducationFormat | undefined {
  if (typeof value !== 'string') return undefined
  const token = value.trim().replace(/[\s/·_-]+/g, '').toUpperCase()
  if (token === 'ONLINE' || token === '온라인') return 'ONLINE'
  if (token === 'OFFLINE' || token === '오프라인') return 'OFFLINE'
  if (token === 'HYBRID' || token === '온오프라인' || token === 'MIXED') return 'HYBRID'
  return undefined
}

export function teacherTrainingEducationFormatLabel(value: unknown): string {
  const format = normalizeTeacherTrainingEducationFormat(value)
  return TEACHER_TRAINING_EDUCATION_FORMAT_OPTIONS.find(option => option.value === format)?.label ?? '-'
}

/** 등록 위저드 교육 형태 라디오 값(online/offline/hybrid) → API 값 */
export function teacherTrainingEducationFormatFromFormValue(
  value: unknown
): TeacherTrainingEducationFormat | undefined {
  return normalizeTeacherTrainingEducationFormat(value)
}

/** GET teacherTrainingSchedule(ISO) → 화면·저장 한 줄 (Asia/Seoul) */
export type TeacherTrainingScheduleProjection = NonNullable<
  Program['generalCommonInfo']
>['teacherTrainingSchedule']

export function formatTeacherTrainingScheduleLine(
  schedule: TeacherTrainingScheduleProjection
): string {
  if (!schedule?.startAt) return ''
  const start = dayjs(schedule.startAt).tz('Asia/Seoul')
  if (!start.isValid()) return ''
  const end = schedule.endAt ? dayjs(schedule.endAt).tz('Asia/Seoul') : start
  return formatEducationScheduleLineFromRange([start, end.isValid() ? end : start])
}

export function isTeacherTrainingScheduleLineIncomplete(line: string | null | undefined): boolean {
  return isEducationScheduleProgressLineMissingOrWithoutClock(line)
}

function isLegacyTrainingCurriculumRow(row: GeneralProgramCurriculumSessionRow | undefined): boolean {
  if (!row) return false
  return (
    isTeacherTrainingScheduleName(row.sessionLabel) ||
    (isTeacherTrainingScheduleName(row.title) && !row.description?.trim())
  )
}

function curriculumRowHasLessonContent(row: GeneralProgramCurriculumSessionRow): boolean {
  const title = row.title?.trim() ?? ''
  const description = row.description?.trim() ?? ''
  if (description) return true
  return title !== '' && !isTeacherTrainingScheduleName(title)
}

/** 차시/회차 라벨 — 화면 순서 (sessionNo 무시) */
export function relabelTrainedTeachersCurriculumSessions(
  sessions: GeneralProgramCurriculumSessionRow[],
  isMulti: boolean
): GeneralProgramCurriculumSessionRow[] {
  return sessions.map((session, index) => ({
    ...session,
    sessionLabel: isMulti ? `${index + 1}회차` : `${index + 1}차시`,
  }))
}

/** 세부/행사 일정 라벨 — 화면 순서 */
export function relabelTrainedTeachersScheduleDetails(
  details: GeneralProgramScheduleDetailRow[],
  isMulti: boolean
): GeneralProgramScheduleDetailRow[] {
  return details.map((detail, index) => ({
    ...detail,
    scheduleLabel: `${isMulti ? '행사 일정' : '세부 일정'} ${String(index + 1).padStart(2, '0')}`,
  }))
}

export type TeacherTrainingSplit = {
  /** 연수 행 (scheduleDetails). 없으면 undefined */
  trainingDetail?: GeneralProgramScheduleDetailRow
  /** 연수를 뺀 차시 — 화면 순서 라벨 */
  curriculumSessions: GeneralProgramCurriculumSessionRow[]
  /** 연수를 뺀 세부/행사 일정 — 화면 순서 라벨 */
  scheduleDetails: GeneralProgramScheduleDetailRow[]
}

/**
 * 저장된 nested 를 「교사 연수 블록 + 나머지 행」으로 나눈다.
 *
 * 기존 데이터(이관 없음) 처리:
 * - 일정형: name 이 연수 일정명인 첫 행을 연수로 본다. 이름이 달라도 연수 ON + 첫 행 라벨이 「교육 연수」면
 *   (예전 첫 행 치환 방식) 그 행을 연수로 본다 → 나머지 행만 ■행사/세부 일정 01… 로 다시 번호.
 * - 커리큘럼형: 예전 첫 차시 치환 행(sessionLabel 「교육 연수」)은
 *   단원명·교육 내용이 있으면 **일반 차시로 남긴다**(■1차시) — 차시가 사라지지 않게.
 *   내용이 없으면 연수 표시용 빈 행이므로 뺀다 — 같은 차시가 두 번 보이지 않게.
 */
export function splitTeacherTrainingFromCommonInfo(input: {
  enabled: boolean
  scheduleName?: string | null
  sessionRound: 'single' | 'multi'
  curriculumSessions?: GeneralProgramCurriculumSessionRow[]
  scheduleDetails?: GeneralProgramScheduleDetailRow[]
}): TeacherTrainingSplit {
  const isMulti = input.sessionRound === 'multi'
  const sessions = [...(input.curriculumSessions ?? [])]
  const details = [...(input.scheduleDetails ?? [])]
  if (!input.enabled) {
    return {
      curriculumSessions: relabelTrainedTeachersCurriculumSessions(sessions, isMulti),
      scheduleDetails: relabelTrainedTeachersScheduleDetails(details, isMulti),
    }
  }

  let trainingIndex = details.findIndex(detail =>
    isTeacherTrainingScheduleName(detail.name, input.scheduleName)
  )
  if (trainingIndex < 0 && details[0] && isTeacherTrainingScheduleName(details[0].scheduleLabel)) {
    trainingIndex = 0
  }
  const trainingDetail = trainingIndex >= 0 ? details[trainingIndex] : undefined
  const regularDetails = details.filter((_, index) => index !== trainingIndex)

  const regularSessions =
    sessions[0] && isLegacyTrainingCurriculumRow(sessions[0]) && !curriculumRowHasLessonContent(sessions[0])
      ? sessions.slice(1)
      : sessions

  return {
    trainingDetail,
    curriculumSessions: relabelTrainedTeachersCurriculumSessions(regularSessions, isMulti),
    scheduleDetails: relabelTrainedTeachersScheduleDetails(regularDetails, isMulti),
  }
}

/** 연수 행 시드 일시 — 행의 scheduleDateLabel(시간 포함) 우선, 없으면 GET teacherTrainingSchedule 투영 */
export function resolveTeacherTrainingScheduleLine(input: {
  trainingDetail?: GeneralProgramScheduleDetailRow
  schedule?: TeacherTrainingScheduleProjection
}): string {
  const fromRow = input.trainingDetail?.scheduleDateLabel?.trim() ?? ''
  if (fromRow && !isTeacherTrainingScheduleLineIncomplete(fromRow)) return fromRow
  const fromSchedule = formatTeacherTrainingScheduleLine(input.schedule ?? null)
  return fromSchedule || fromRow
}

/** 저장용 연수 행 — 일정명은 teacherTrainingScheduleName 과 같게 */
export function buildTeacherTrainingScheduleDetail(input: {
  scheduleName: string
  scheduleLine: string
  base?: GeneralProgramScheduleDetailRow
}): GeneralProgramScheduleDetailRow {
  const base = { ...(input.base ?? {}) } as GeneralProgramScheduleDetailRow & Record<string, unknown>
  delete base.assignmentEnabled
  delete base.assignmentPeriod
  delete base.educationFormLabel
  delete base.participationMethodLabel
  delete base.ipsTypeSummary
  delete base.blockKind
  delete base.scheduleRole
  const line = input.scheduleLine.trim()
  if (line) {
    // 시간 포함 일시로 저장 — 예전 세부 일정 진행 시간은 연수 일시로 대체
    delete base.progressTimeSummary
    delete base.groupTimes
  }
  return {
    ...base,
    scheduleLabel: TEACHER_TRAINING_BLOCK_LABEL,
    name: input.scheduleName,
    ...(line ? { scheduleDateLabel: line } : {}),
  }
}

/** 화면 순서 행 + 연수 행 → 저장 scheduleDetails (연수가 맨 앞) */
export function composeTeacherTrainingScheduleDetails(input: {
  enabled: boolean
  trainingDetail?: GeneralProgramScheduleDetailRow
  regularDetails: GeneralProgramScheduleDetailRow[]
}): GeneralProgramScheduleDetailRow[] {
  if (!input.enabled || !input.trainingDetail) return input.regularDetails
  return [input.trainingDetail, ...input.regularDetails]
}
