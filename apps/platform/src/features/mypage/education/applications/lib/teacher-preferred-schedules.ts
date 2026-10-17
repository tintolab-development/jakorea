import type { ProgramDetail } from '@/features/program'
import type { EducationTeacherPreferredSchedule } from '../model/types'
import {
  isOpaqueScheduleOptionToken,
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredEducationScheduleLabelFromAnswers,
  resolvePreferredScheduleLabelsFromAnswers,
  type PreferredScheduleProgramLookup,
} from './application-content-from-answers'

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

function splitScheduleDisplayLines(label: string): string[] {
  return label
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function toPreferredScheduleCards(labels: string[]): EducationTeacherPreferredSchedule[] {
  return labels.map((value, index) => ({
    id: `preferred-schedule-${index + 1}`,
    label: `진행 희망 교육 일정 ${index + 1}`,
    value,
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
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'>
}): EducationTeacherPreferredSchedule[] {
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

  if (labels.length === 0 && input.preferredScheduleBlocks?.length) {
    const fromBlocks = resolvePreferredEducationScheduleLabelFromAnswers({
      preferredScheduleBlocks: input.preferredScheduleBlocks,
    } as Record<string, unknown>)
    if (fromBlocks) labels = splitScheduleDisplayLines(fromBlocks)
  }

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
