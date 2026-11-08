import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import {
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredScheduleLabelsFromAnswers,
} from './application-content-from-answers.ts'
import { resolveInstructorAvailableScheduleLines } from './instructor-available-schedule-from-answers.ts'
import { programDetailToPreferredScheduleLookup } from './teacher-preferred-schedules.ts'
import { stripAutoMaterializedScheduleNameFromLabel } from '@/shared/lib/education-schedule-name'

const BLANK_PREFERRED_SCHEDULE_LINE = /^(?:-|–|—|진행 희망 교육 일정\s*\d+\s*[-–—]?)$/

/**
 * 날짜·시간이 없는 `진행 희망 교육 일정 1 -` 같은 빈 줄은 신청 내용 카드로 만들지 않는다.
 * 기존 저장 문구의 기관 승인 일정 내부명(`| 기관 확정 YYYY-MM-DD`)도 표시에서 뺀다.
 */
export function filterBlankMypagePreferredScheduleLines(lines: readonly string[]): string[] {
  return lines
    .map(line => stripAutoMaterializedScheduleNameFromLabel(line))
    .filter(line => line.length > 0 && !BLANK_PREFERRED_SCHEDULE_LINE.test(line))
}

export function resolveMypagePreferredScheduleLines(input: {
  applicationType?: ProgramApplicationType
  answers?: Record<string, unknown> | null
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: readonly string[]
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'> &
    Partial<Pick<ProgramDetail, 'scheduleOptionLookup'>>
}): string[] {
  const lookup = programDetailToPreferredScheduleLookup(input.program)

  if (input.applicationType === 'VOLUNTEER' || input.applicationType === 'INSTRUCTOR') {
    const slotPickerLines = resolveInstructorAvailableScheduleLines({
      answers: input.answers,
      preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
      preferredScheduleOptionValues: input.preferredScheduleOptionValues,
      program: lookup,
    })
    if (slotPickerLines.length > 0) return filterBlankMypagePreferredScheduleLines(slotPickerLines)
  }

  const fromAnswers = resolvePreferredScheduleLabelsFromAnswers({
    answers: input.answers,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    ...lookup,
  })
  if (fromAnswers.length > 0) return filterBlankMypagePreferredScheduleLines(fromAnswers)

  const display = resolvePreferredEducationScheduleDisplayLabel({
    preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    ...lookup,
  })
  if (!display?.trim()) return []
  return filterBlankMypagePreferredScheduleLines(
    display
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean),
  )
}
