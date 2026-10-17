/**
 * GENERAL_ORGANIZATION 강사/봉사 「진행 가능 일정」 — 확정 OSA 런타임 선택지.
 * 프로그램 공통 일정·기관 희망 일정 fallback 금지.
 */

import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { ProgramApplyFormCase } from './apply-form-case.ts'

export const OSA_AVAILABLE_SCHEDULE_STALE_MESSAGE =
  '선택 가능한 일정이 변경되었습니다. 새로고침 후 다시 선택해 주세요.'

export const OSA_SCHEDULE_OPTION_VALUE_PREFIX = 'schedule:'

export function isGeneralOrganizationProgram(program?: {
  programType?: string | null
} | null): boolean {
  return (program?.programType ?? '').trim().toUpperCase() === 'GENERAL_ORGANIZATION'
}

/** 일반 기관 프로그램의 강사·봉사 신청 — 선택지 SSOT = form-bindings OSA */
export function usesConfirmedOsaAvailableSchedule(input: {
  program?: { programType?: string | null } | null
  applyCase: ProgramApplyFormCase | null
}): boolean {
  if (!isGeneralOrganizationProgram(input.program)) return false
  return input.applyCase === 'instructor' || input.applyCase === 'individual-volunteer'
}

export function confirmOsaScheduleOptionValue(
  scheduleId: number | string,
  organizationApplicationId: number | string,
): string {
  return `schedule:${scheduleId}:organization-application:${organizationApplicationId}`
}

export function pruneSelectedSlotIdsToCurrentOptions(
  selectedSlotIds: readonly string[],
  currentOptionIds: readonly string[],
): string[] {
  const valid = new Set(currentOptionIds)
  return selectedSlotIds.filter(id => valid.has(id))
}

export function hasStaleSelectedSlotIds(
  selectedSlotIds: readonly string[],
  currentOptionIds: readonly string[],
): boolean {
  if (selectedSlotIds.length === 0) return false
  const valid = new Set(currentOptionIds)
  return selectedSlotIds.some(id => !valid.has(id))
}

export function instructorAvailableScheduleParagraphId(): string {
  return PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
}

export function volunteerActivityScheduleParagraphId(): string {
  return PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule
}
