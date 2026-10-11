/**
 * 일반 프로그램 상세 — 봉사자 면접 진행 가능 일정 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
 */

import type { GeneralProgramVolunteerInterviewScheduleException, Program } from '@/types/domain'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import {
  applyGeneralRecruitOverlayToProgram,
  formatAvailableTimeSlotsFromSelectedKeys,
  resolveVolunteerInterviewAvailableTimeSlotsForDisplay,
  volunteerInterviewHasSelectedSlotKeys,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import dayjs from 'dayjs'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'

export type { VolunteerInterviewScheduleEditSeed }

export type GeneralProgramVolunteerInterviewScheduleDisplay = {
  recurringUnavailable: string
  specificUnavailableDates: string
  availableTimeSlots: string
  exceptions: GeneralProgramVolunteerInterviewScheduleException[]
}

function readRegistrationOverlay(program: Program): Record<string, unknown> {
  const overlay = program.registrationOverlay
  if (overlay == null || typeof overlay !== 'object' || Array.isArray(overlay)) return {}
  return overlay as Record<string, unknown>
}

function resolveVolunteerInterviewExceptions(
  program: Program
): GeneralProgramVolunteerInterviewScheduleException[] {
  const fromOverlay = mapVolunteerInterviewExceptionsFromOverlay(readRegistrationOverlay(program))
  if (fromOverlay.length > 0) return fromOverlay
  return program.generalCommonInfo?.volunteerInterviewScheduleInfo?.exceptions ?? []
}

function dashOr(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function resolveAvailableTimeSlotsDisplay(
  nestedAvailableTimeSlots: string | undefined,
  overlay: Record<string, unknown>
): string {
  return dashOr(
    resolveVolunteerInterviewAvailableTimeSlotsForDisplay(
      nestedAvailableTimeSlots,
      overlay,
      'recruit'
    )
  )
}

function resolveVolunteerInterviewScheduleProgramForDisplay(program: Program): Program {
  const overlay = readRegistrationOverlay(program)
  if (Object.keys(overlay).length === 0) return program
  return applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: false })
}

function parseInterviewTimeRangeFromOverlay(
  overlay: Record<string, unknown>
): VolunteerInterviewScheduleEditSeed['interviewTimeRange'] | undefined {
  const raw = overlay[buildVolunteerInterviewOverlayKey('recruit', 'interviewTimeRange')]
  if (!Array.isArray(raw) || raw.length < 2) return undefined
  const start = dayjs(raw[0] as string | number | Date)
  const end = dayjs(raw[1] as string | number | Date)
  if (!start.isValid() || !end.isValid()) return undefined
  return {
    startHour: start.hour(),
    startMinute: start.minute(),
    endHour: end.hour(),
    endMinute: end.minute(),
  }
}

function parseInterviewTimeUnitFromOverlay(
  overlay: Record<string, unknown>
): VolunteerInterviewScheduleEditSeed['timeUnit'] | undefined {
  const raw = overlay[buildVolunteerInterviewOverlayKey('recruit', 'timeUnit')]
  if (raw === '15' || raw === 15) return '15'
  if (raw === '60' || raw === 60) return '60'
  if (raw === '30' || raw === 30) return '30'
  return undefined
}

function selectedSlotLabelsFromOverlay(overlay: Record<string, unknown>): string[] {
  if (!volunteerInterviewHasSelectedSlotKeys(overlay, 'recruit')) return []
  const formatted = formatAvailableTimeSlotsFromSelectedKeys(
    overlay[buildVolunteerInterviewOverlayKey('recruit', 'selectedSlotKeys')]
  )
  if (!formatted) return []
  return formatted
    .split(',')
    .map(label => label.trim())
    .filter(Boolean)
}

export function resolveGeneralProgramVolunteerInterviewScheduleDisplay(
  program: Program
): GeneralProgramVolunteerInterviewScheduleDisplay {
  const overlay = readRegistrationOverlay(program)
  const merged = resolveVolunteerInterviewScheduleProgramForDisplay(program)
  const nestedInfo = program.generalCommonInfo?.volunteerInterviewScheduleInfo
  const mergedInfo = merged.generalCommonInfo?.volunteerInterviewScheduleInfo

  return {
    recurringUnavailable: dashOr(mergedInfo?.recurringUnavailable),
    specificUnavailableDates: dashOr(mergedInfo?.specificUnavailableDates),
    availableTimeSlots: resolveAvailableTimeSlotsDisplay(
      nestedInfo?.availableTimeSlots,
      overlay
    ),
    exceptions: resolveVolunteerInterviewExceptions(merged),
  }
}

export function resolveGeneralProgramVolunteerInterviewScheduleEditSeed(
  program: Program
): VolunteerInterviewScheduleEditSeed | undefined {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const overlay = readRegistrationOverlay(program)
  const info = resolveVolunteerInterviewScheduleProgramForDisplay(program).generalCommonInfo
    ?.volunteerInterviewScheduleInfo
  const interviewTimeRange = parseInterviewTimeRangeFromOverlay(overlay)
  const selectedTimeSlotLabels = selectedSlotLabelsFromOverlay(overlay)

  if (
    display.recurringUnavailable === '-' &&
    display.specificUnavailableDates === '-' &&
    display.availableTimeSlots === '-' &&
    !info?.specificUnavailableDateIsos?.length &&
    selectedTimeSlotLabels.length === 0 &&
    !interviewTimeRange
  ) {
    return undefined
  }

  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable:
      display.recurringUnavailable === '-' ? '' : display.recurringUnavailable,
    specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
    selectedTimeSlotLabels,
    interviewTimeRange,
    timeUnit: parseInterviewTimeUnitFromOverlay(overlay),
  })
}

export function isGeneralProgramVolunteerInterviewScheduleVisible(program: Program): boolean {
  return program.generalVolunteerInterviewEnabled !== false
}
