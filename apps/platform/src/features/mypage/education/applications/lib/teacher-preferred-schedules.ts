import type { ProgramDetail } from '@/features/program'
import type { EducationTeacherPreferredSchedule } from '../model/types'
import {
  isOpaqueScheduleOptionToken,
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredEducationScheduleLabelFromAnswers,
  resolvePreferredScheduleLabelsFromAnswers,
  type PreferredScheduleProgramLookup,
} from './application-content-from-answers.ts'

export function programDetailToPreferredScheduleLookup(
  program: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'> | undefined,
): Pick<PreferredScheduleProgramLookup, 'educationScheduleLines' | 'schedules'> {
  if (!program) return {}
  return {
    educationScheduleLines: program.educationScheduleLines,
    schedules: program.eventSchedules?.map(row => ({
      scheduleId: row.scheduleId,
      startAt: row.startAt,
      endAt: row.endAt,
      scheduleName: row.name,
      dateLabel: row.dateLabel,
    })),
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

function toPreferredScheduleCardsFromBlocks(
  blocks: readonly unknown[],
): EducationTeacherPreferredSchedule[] {
  return blocks.map((rawBlock, index) => {
    const block = rawBlock as Record<string, unknown>
    const scheduleStatus =
      typeof block.scheduleStatus === 'string' ? block.scheduleStatus : undefined
    const scheduleId =
      typeof block.scheduleId === 'number' && Number.isFinite(block.scheduleId)
        ? block.scheduleId
        : null
    const value =
      resolvePreferredEducationScheduleLabelFromAnswers({
        preferredScheduleBlocks: [rawBlock],
      } as Record<string, unknown>)?.trim() ||
      (typeof block.label === 'string' && block.label.trim()) ||
      (scheduleId != null ? `schedule:${scheduleId}` : '희망 일정')

    return {
      id: scheduleId != null ? `preferred-schedule-${scheduleId}` : `preferred-schedule-${index + 1}`,
      label: `진행 희망 교육 일정 ${index + 1}`,
      value,
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
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'>
}): EducationTeacherPreferredSchedule[] {
  if (input.preferredScheduleBlocks?.length) {
    return toPreferredScheduleCardsFromBlocks(input.preferredScheduleBlocks)
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
