import type { ProgramDetail } from '@/features/program'
import type { EducationTeacherPreferredSchedule } from '../model/types'
import {
  isOpaqueScheduleOptionToken,
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredEducationScheduleLabelFromAnswers,
  resolvePreferredScheduleLabelsFromAnswers,
  type PreferredScheduleProgramLookup,
} from './application-content-from-answers.ts'
import { formatDisplayClockLabel, formatDisplayDate } from '@/shared/lib/format-display-date'
import { formatCompanySchoolDottedDate } from './company-school-date-label.ts'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'

export function programDetailToPreferredScheduleLookup(
  program:
    | (Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'> &
        Partial<Pick<ProgramDetail, 'scheduleOptionLookup'>>)
    | undefined,
): Pick<PreferredScheduleProgramLookup, 'educationScheduleLines' | 'schedules'> {
  if (!program) return {}
  const fromEventSchedules = (program.eventSchedules ?? []).map(row => ({
    scheduleId: row.scheduleId,
    startAt: row.startAt,
    endAt: row.endAt,
    scheduleName: row.name,
    dateLabel: row.dateLabel,
  }))
  /**
   * 일정형(scheduleDetails) 프로그램은 eventSchedules에 scheduleId가 없다.
   * Portal `schedules[]` 원본을 뒤에 붙여 `schedule:{id}` 토큰을 해석한다 (eventSchedules 우선).
   */
  const fromPortalSchedules = (program.scheduleOptionLookup ?? []).map(row => ({
    scheduleId: row.scheduleId,
    startAt: row.startAt,
    endAt: row.endAt,
    scheduleName: row.scheduleName,
  }))
  const schedules = [...fromEventSchedules, ...fromPortalSchedules]
  return {
    educationScheduleLines: program.educationScheduleLines,
    ...(program.eventSchedules || program.scheduleOptionLookup ? { schedules } : {}),
  }
}

function toPreferredScheduleCards(labels: string[]): EducationTeacherPreferredSchedule[] {
  return labels.map((value, index) => ({
    id: `preferred-schedule-${index + 1}`,
    label: `진행 희망 교육 일정 ${index + 1}`,
    value,
  }))
}

function splitScheduleDisplayLines(label: string): string[] {
  return label
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function scheduleStatusLabel(status: string | null | undefined): string | undefined {
  switch (status?.trim().toUpperCase()) {
    case 'INACTIVE_OR_DELETED':
      return '비활성 또는 삭제된 일정'
    case 'UNMATCHED':
      return '매칭되지 않은 희망 일정'
    default:
      return undefined
  }
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function readPositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof parsed === 'number' && Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/** 교시 원문(`1` / `1교시`) → `1교시`. 숫자가 아니면 원문 그대로. */
function formatClassPeriodLabel(raw: string): string {
  const digits = raw.replace(/교시\s*$/u, '').trim()
  return /^\d+$/.test(digits) ? `${digits}교시` : raw
}

/**
 * 교육받은교사 희망 일정 블록 — 시안 「날짜 ㅣ N차시」 + 차시별 「K차시: M교시 ㅣ 시작 ~ 종료」.
 * 차시 = 그날 수업 개수(sessionCount, 없으면 sessionTimes 줄 수), 교시 = 각 차시의 classPeriod.
 */
function formatTrainedTeacherPreferredBlock(
  block: Record<string, unknown>,
): { value: string; sessionLines: string[] } | undefined {
  const dateRaw = readText(block.date) || readText(block.dateText)
  const dateLabel = dateRaw ? formatDisplayDate(dateRaw) || dateRaw : ''
  if (!dateLabel) return undefined
  const sessions = (
    Array.isArray(block.sessionTimes) ? block.sessionTimes : Array.isArray(block.times) ? block.times : []
  ).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  const sessionCount = readPositiveInt(block.sessionCount) ?? (sessions.length > 0 ? sessions.length : null)
  const value = [dateLabel, sessionCount != null ? `${sessionCount}차시` : '']
    .filter(Boolean)
    .join(' | ')
  const sessionLines = sessions.flatMap((row, index) => {
    const sessionIndex = readPositiveInt(row.sessionIndex) ?? index + 1
    const classPeriod = readText(row.classPeriod)
    const start = readText(row.startTime) || readText(row.start)
    const end = readText(row.endTime) || readText(row.end)
    const timeRange =
      start && end
        ? `${formatDisplayClockLabel(start)} ~ ${formatDisplayClockLabel(end)}`
        : readText(row.timeRange)
    const head = [`${sessionIndex}차시:`, classPeriod ? formatClassPeriodLabel(classPeriod) : '']
      .filter(Boolean)
      .join(' ')
    if (!classPeriod && !timeRange) return []
    return [[head, timeRange].filter(Boolean).join(' | ')]
  })
  return { value, sessionLines }
}

/**
 * 1사1교 교시 라벨 — 2차시는 1차시 교시 + 1(연강 고정).
 * `N~(N+1)교시 (2차시)` / `N교시 (1차시)`. 교시를 모르면 `N차시`만.
 */
function formatCompanySchoolPeriodUnit(startPeriod: number | null, sessionCount: number | null): string {
  if (startPeriod == null) return sessionCount != null ? `${sessionCount}차시` : ''
  const count = sessionCount ?? 1
  const periods = count > 1 ? `${startPeriod}~${startPeriod + count - 1}교시` : `${startPeriod}교시`
  return `${periods} (${count}차시)`
}

/**
 * 1사1교 희망 일정 블록(USER-FUNC-0205) —
 * 「YYYY.MM.DD(요일) ㅣ N~(N+1)교시 (N차시)」 + 교시별 「N교시 (시작 ~ 종료) ㅣ N+1교시 (시작 ~ 종료)」.
 */
function formatCompanySchoolPreferredBlock(
  block: Record<string, unknown>,
): { value: string; sessionLines: string[] } | undefined {
  const dateRaw = readText(block.date) || readText(block.dateText) || readText(block.requestedDate)
  // 1사1교 기획 형식 「YYYY.MM.DD(요일)」 — 플랫폼 공통 날짜 표기와 다르다
  const dateLabel = dateRaw ? formatCompanySchoolDottedDate(dateRaw) || dateRaw : ''
  if (!dateLabel) return undefined
  const sessions = (
    Array.isArray(block.sessionTimes) ? block.sessionTimes : Array.isArray(block.times) ? block.times : []
  ).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  const sessionCount = readPositiveInt(block.sessionCount) ?? (sessions.length > 0 ? sessions.length : null)
  const first = sessions[0]
  const firstPeriod = first
    ? (readPositiveInt(readText(first.classPeriod).replace(/교시\s*$/u, '')) ??
      readPositiveInt(first.period))
    : null
  const startPeriod = readPositiveInt(block.startPeriod) ?? firstPeriod
  const value = [dateLabel, formatCompanySchoolPeriodUnit(startPeriod, sessionCount)]
    .filter(Boolean)
    .join(' | ')
  const timeParts = sessions.flatMap((row, index) => {
    const start = readText(row.startTime) || readText(row.start)
    const end = readText(row.endTime) || readText(row.end)
    if (!start || !end) return []
    const range = `${formatDisplayClockLabel(start)} ~ ${formatDisplayClockLabel(end)}`
    const period = startPeriod != null ? startPeriod + index : null
    return [period != null ? `${period}교시 (${range})` : range]
  })
  return { value, sessionLines: timeParts.length > 0 ? [timeParts.join(' | ')] : [] }
}

type PreferredBlockDetailMode = 'default' | 'trained-teacher' | 'company-school'

function toPreferredScheduleCardsFromBlocks(
  blocks: readonly unknown[],
  detailMode: PreferredBlockDetailMode = 'default',
): EducationTeacherPreferredSchedule[] {
  return blocks.map((rawBlock, index) => {
    const block = rawBlock as Record<string, unknown>
    const trainedTeacher =
      detailMode === 'trained-teacher'
        ? formatTrainedTeacherPreferredBlock(block)
        : detailMode === 'company-school'
          ? formatCompanySchoolPreferredBlock(block)
          : undefined
    const scheduleStatus =
      typeof block.scheduleStatus === 'string' ? block.scheduleStatus : undefined
    const scheduleId =
      typeof block.scheduleId === 'number' && Number.isFinite(block.scheduleId)
        ? block.scheduleId
        : null
    const value =
      trainedTeacher?.value ||
      resolvePreferredEducationScheduleLabelFromAnswers({
        preferredScheduleBlocks: [rawBlock],
      } as Record<string, unknown>)?.trim() ||
      (typeof block.label === 'string' && block.label.trim()) ||
      (scheduleId != null ? `schedule:${scheduleId}` : '희망 일정')

    return {
      id: scheduleId != null ? `preferred-schedule-${scheduleId}` : `preferred-schedule-${index + 1}`,
      label: `진행 희망 교육 일정 ${index + 1}`,
      value,
      ...(trainedTeacher && trainedTeacher.sessionLines.length > 0
        ? { sessionLines: trainedTeacher.sessionLines }
        : {}),
      scheduleId,
      startAt: typeof block.startAt === 'string' ? block.startAt : null,
      endAt: typeof block.endAt === 'string' ? block.endAt : null,
      round: typeof block.round === 'number' ? block.round : null,
      scheduleStatus: scheduleStatus ?? null,
      statusLabel: scheduleStatusLabel(scheduleStatus),
    }
  })
}

function toPreservedOpaqueScheduleCards(
  values: readonly string[],
): EducationTeacherPreferredSchedule[] {
  return values.filter(value => value.trim()).map((value, index) => ({
    id: `preferred-schedule-${index + 1}`,
    label: `진행 희망 교육 일정 ${index + 1}`,
    value: value.trim(),
    scheduleStatus: 'UNMATCHED',
    statusLabel: '매칭되지 않은 희망 일정',
  }))
}

/**
 * 교사·기관 신청 내용 탭 하단 「신청 정보」 일정 카드.
 * answers opaque token은 프로그램 일정 lookup이 필요하다.
 */
export function resolveTeacherPreferredSchedules(input: {
  preferredSchedules?: EducationTeacherPreferredSchedule[]
  answers?: Record<string, unknown> | null
  preferredScheduleOptionValues?: readonly string[]
  preferredEducationScheduleLabel?: string
  preferredScheduleBlocks?: readonly unknown[] | null
  /** TRAINED_TEACHER에서는 line:N을 실제 일정으로 추정하지 않는다. */
  preserveLegacyLineTokens?: boolean
  /** TRAINED_TEACHER — 블록 카드를 「날짜 | N차시」 + 차시별 「K차시: M교시 | 시간」으로 표시 */
  trainedTeacherSessionDetail?: boolean
  /** 1사1교 — 블록 카드를 「날짜 | N~(N+1)교시 (N차시)」 + 「N교시 (시간) | N+1교시 (시간)」으로 표시 */
  companySchoolPeriodDetail?: boolean
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'>
}): EducationTeacherPreferredSchedule[] {
  const detailMode: PreferredBlockDetailMode =
    input.trainedTeacherSessionDetail === true
      ? 'trained-teacher'
      : input.companySchoolPeriodDetail === true
        ? 'company-school'
        : 'default'
  if (input.preferredScheduleBlocks?.length) {
    return toPreferredScheduleCardsFromBlocks(input.preferredScheduleBlocks, detailMode)
  }
  // 1사1교 — 신청 답변의 희망 일정 블록(객체 배열)도 같은 형식으로
  if (detailMode === 'company-school') {
    const answerBlocks = input.answers?.[PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule]
    if (
      Array.isArray(answerBlocks) &&
      answerBlocks.length > 0 &&
      answerBlocks.every(item => Boolean(item) && typeof item === 'object')
    ) {
      return toPreferredScheduleCardsFromBlocks(answerBlocks, detailMode)
    }
  }

  const optionValues = input.preferredScheduleOptionValues ?? []
  if (input.preserveLegacyLineTokens && optionValues.length > 0) {
    return toPreservedOpaqueScheduleCards(optionValues)
  }

  const existing =
    input.preferredSchedules?.filter(
      row => row.value?.trim() && !isOpaqueScheduleOptionToken(row.value.trim()),
    ) ?? []
  if (existing.length > 0) return existing

  const lookup = programDetailToPreferredScheduleLookup(input.program)

  let labels = resolvePreferredScheduleLabelsFromAnswers({
    answers: input.answers,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    ...lookup,
  })

  if (labels.length === 0) {
    const fromLabel = resolvePreferredEducationScheduleDisplayLabel({
      preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
      preferredScheduleOptionValues: input.preferredScheduleOptionValues,
      ...lookup,
    })
    if (fromLabel) labels = splitScheduleDisplayLines(fromLabel)
  }

  return toPreferredScheduleCards(labels)
}
