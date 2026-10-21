import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import {
  resolvePreferredEducationScheduleDisplayLabel,
  resolvePreferredScheduleLabelsFromAnswers,
} from './application-content-from-answers.ts'
import { resolveInstructorAvailableScheduleLines } from './instructor-available-schedule-from-answers.ts'
import { programDetailToPreferredScheduleLookup } from './teacher-preferred-schedules.ts'

export function resolveMypagePreferredScheduleLines(input: {
  applicationType?: ProgramApplicationType
  answers?: Record<string, unknown> | null
  preferredEducationScheduleLabel?: string
  preferredScheduleOptionValues?: readonly string[]
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'>
}): string[] {
  const lookup = programDetailToPreferredScheduleLookup(input.program)

  if (input.applicationType === 'VOLUNTEER' || input.applicationType === 'INSTRUCTOR') {
    const slotPickerLines = resolveInstructorAvailableScheduleLines({
      answers: input.answers,
      preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
      preferredScheduleOptionValues: input.preferredScheduleOptionValues,
      program: lookup,
    })
    if (slotPickerLines.length > 0) return slotPickerLines
  }

  const fromAnswers = resolvePreferredScheduleLabelsFromAnswers({
    answers: input.answers,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    ...lookup,
  })
  if (fromAnswers.length > 0) return fromAnswers

  const display = resolvePreferredEducationScheduleDisplayLabel({
    preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    ...lookup,
  })
  if (!display?.trim()) return []
  return display
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}
