/**
 * 일반 프로그램 상세 — 봉사자 면접 진행 가능 일정 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
 */

import type { GeneralProgramVolunteerInterviewScheduleException, Program } from '@/types/domain'
import {
  buildVolunteerInterviewScheduleEditSeed,
  type VolunteerInterviewScheduleEditSeed,
} from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
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

export function resolveGeneralProgramVolunteerInterviewScheduleDisplay(
  program: Program
): GeneralProgramVolunteerInterviewScheduleDisplay {
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo

  return {
    recurringUnavailable: dashOr(info?.recurringUnavailable),
    specificUnavailableDates: dashOr(info?.specificUnavailableDates),
    availableTimeSlots: dashOr(info?.availableTimeSlots),
    exceptions: resolveVolunteerInterviewExceptions(program),
  }
}

export function resolveGeneralProgramVolunteerInterviewScheduleEditSeed(
  program: Program
): VolunteerInterviewScheduleEditSeed | undefined {
  const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
  const info = program.generalCommonInfo?.volunteerInterviewScheduleInfo

  if (
    display.recurringUnavailable === '-' &&
    display.specificUnavailableDates === '-' &&
    display.availableTimeSlots === '-' &&
    !info?.specificUnavailableDateIsos?.length
  ) {
    return undefined
  }

  return buildVolunteerInterviewScheduleEditSeed({
    recurringUnavailable:
      display.recurringUnavailable === '-' ? '' : display.recurringUnavailable,
    specificUnavailableDateIsos: info?.specificUnavailableDateIsos,
    availableTimeSlots:
      display.availableTimeSlots === '-' ? '' : display.availableTimeSlots,
  })
}

export function isGeneralProgramVolunteerInterviewScheduleVisible(program: Program): boolean {
  return program.generalVolunteerInterviewEnabled !== false
}
