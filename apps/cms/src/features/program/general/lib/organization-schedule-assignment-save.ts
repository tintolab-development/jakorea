import {
  filterOrganizationScheduleAssignmentSlotsForDisplay,
  type OrganizationApplicationScheduleScope,
} from '@/features/program/general/lib/organization-education-schedule-sources'
import type { OrganizationScheduleAssignmentSlotRequest } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import { resolveProgramSchedulePhysicalId } from '@/features/program/shared/lib/program-schedule-canonical'

export type OrganizationScheduleAssignmentValidationResult =
  | { ok: true; scheduleIds: number[] }
  | { ok: false; message: string }

function resolveSlotScheduleId(slot: SlotResponse): number | null {
  const raw =
    (slot as SlotResponse & { programScheduleId?: number | null }).programScheduleId ??
    slot.scheduleId
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null
  return Math.trunc(raw)
}

/** OSA display 슬롯 → 선택된 scheduleId 배열 (canonical state) */
export function scheduleIdsFromOrganizationAssignmentSlots(
  slots: ReadonlyArray<SlotResponse>,
  scope?: OrganizationApplicationScheduleScope
): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  for (const slot of filterOrganizationScheduleAssignmentSlotsForDisplay(slots, scope)) {
    const scheduleId = resolveSlotScheduleId(slot)
    if (scheduleId == null || seen.has(scheduleId)) continue
    seen.add(scheduleId)
    ids.push(scheduleId)
  }
  return ids
}

export function slotsFromScheduleIds(
  scheduleIds: ReadonlyArray<number>
): OrganizationScheduleAssignmentSlotRequest[] {
  return scheduleIds.map(scheduleId => ({ scheduleId }))
}

export function validateOrganizationScheduleAssignmentReplace(input: {
  selectedScheduleIds: ReadonlyArray<number>
  allowedScheduleIds: ReadonlyArray<number>
}): OrganizationScheduleAssignmentValidationResult {
  const allowed = new Set(
    input.allowedScheduleIds.filter(id => Number.isInteger(id) && id > 0).map(id => Math.trunc(id))
  )
  const normalized: number[] = []
  const seen = new Set<number>()

  for (const raw of input.selectedScheduleIds) {
    if (!Number.isInteger(raw) || raw <= 0) {
      return {
        ok: false,
        message: '유효한 교육 일정 ID(scheduleId)를 선택해 주세요.',
      }
    }
    const scheduleId = Math.trunc(raw)
    if (seen.has(scheduleId)) {
      return {
        ok: false,
        message: '동일한 교육 일정이 중복 선택되었습니다.',
      }
    }
    seen.add(scheduleId)
    if (!allowed.has(scheduleId)) {
      return {
        ok: false,
        message:
          '선택한 교육 일정이 현재 프로그램 운영 일정과 일치하지 않습니다. 목록을 새로고침한 후 다시 선택해 주세요.',
      }
    }
    normalized.push(scheduleId)
  }

  return { ok: true, scheduleIds: normalized }
}

/** PUT body용 — program schedules 목록에서 assignable id 집합 추출 */
export function collectAssignableProgramScheduleIds(
  schedules: ReadonlyArray<unknown>
): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  for (const schedule of schedules) {
    const id = resolveProgramSchedulePhysicalId(schedule)
    if (id == null || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}
