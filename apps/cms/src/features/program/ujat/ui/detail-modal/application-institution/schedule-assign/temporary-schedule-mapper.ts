/**
 * 임시 배정 draft ↔ temporary-schedule slots 변환
 */

import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  parseGradeClassSectionValue,
  toGradeClassSectionValue,
} from '../list/grade-class-sections'
import type { UjatScheduleAssignRegionState, UjatScheduleAssignRow } from './types'
import type {
  UjatOrganizationScheduleSlotResponse,
  UjatTemporaryScheduleSaveRequest,
  UjatTemporaryScheduleSlotRequest,
} from '@/features/program/ujat/api/temporary-schedule-api'
import { isoDateFromScheduleInstant } from '@/features/program/ujat/api/temporary-schedule-api'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'

function createEmptyRow(): UjatScheduleAssignRow {
  return {
    id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    institutionRowId: null,
    gradeValues: [],
  }
}

export function buildTemporaryScheduleSlotsFromDraft(input: {
  regionState: UjatScheduleAssignRegionState
  institutionRowId: string
  scheduleIdByIsoDate: Map<string, number>
  defaultStudentCount?: number
}): UjatTemporaryScheduleSlotRequest[] {
  const slots: UjatTemporaryScheduleSlotRequest[] = []
  const studentCount = input.defaultStudentCount ?? 0

  for (const day of Object.values(input.regionState.days)) {
    const scheduleId = input.scheduleIdByIsoDate.get(day.isoDate)
    if (scheduleId == null) continue

    for (const row of day.rows) {
      if (row.institutionRowId !== input.institutionRowId) continue
      for (const value of row.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        const gradeNumber = parsed.gradeLabel.replace(/[^0-9]/g, '') || parsed.gradeLabel
        slots.push({
          scheduleId,
          grade: gradeNumber,
          className: `${parsed.classNo}반`,
          studentCount,
        })
      }
    }
  }

  return slots
}

export function buildTemporaryScheduleSaveRequest(input: {
  regionKey: UjatInstitutionApplicationRegionKey
  regionState: UjatScheduleAssignRegionState
  institutionRowId: string
  scheduleIdByIsoDate: Map<string, number>
  defaultStudentCount?: number
}): UjatTemporaryScheduleSaveRequest | null {
  const slots = buildTemporaryScheduleSlotsFromDraft(input)
  if (slots.length === 0) return null
  return {
    educationRegionCode: toUjatEducationRegionCode(input.regionKey),
    slots,
  }
}

function gradeClassValueFromSlot(slot: UjatOrganizationScheduleSlotResponse): string | null {
  const gradeRaw = slot.grade?.trim()
  if (!gradeRaw) return null
  const gradeLabel = /^\d+$/.test(gradeRaw) ? `${gradeRaw}학년` : gradeRaw
  const classMatch = (slot.className ?? slot.classLabel ?? '').match(/(\d+)\s*반/)
  const classNo = classMatch ? Number.parseInt(classMatch[1]!, 10) : 1
  if (!Number.isFinite(classNo) || classNo < 1) return null
  return toGradeClassSectionValue({ gradeLabel, classNo })
}

/** remote slots → region draft days (institution별 병합) */
export function applyTemporaryScheduleSlotsToDraft(input: {
  regionState: UjatScheduleAssignRegionState
  institutionRowId: string
  slots: UjatOrganizationScheduleSlotResponse[]
  scheduleIdByIsoDate: Map<string, number>
}): UjatScheduleAssignRegionState {
  const isoByScheduleId = new Map<number, string>()
  for (const [iso, scheduleId] of input.scheduleIdByIsoDate) {
    isoByScheduleId.set(scheduleId, iso)
  }

  const next = {
    ...input.regionState,
    days: { ...input.regionState.days },
    estimation: {
      h1: { ...input.regionState.estimation.h1 },
      h2: { ...input.regionState.estimation.h2 },
    },
  }

  const gradeValuesByIso = new Map<string, string[]>()

  for (const slot of input.slots) {
    const scheduleId = slot.scheduleId
    if (scheduleId == null) continue
    const iso =
      isoByScheduleId.get(Number(scheduleId)) ??
      isoDateFromScheduleInstant(slot.scheduleStartAt) ??
      null
    if (!iso || !next.days[iso]) continue
    const value = gradeClassValueFromSlot(slot)
    if (!value) continue
    const list = gradeValuesByIso.get(iso) ?? []
    if (!list.includes(value)) list.push(value)
    gradeValuesByIso.set(iso, list)
  }

  for (const [isoDate, gradeValues] of gradeValuesByIso) {
    const day = next.days[isoDate]
    if (!day) continue
    const withoutInstitution = day.rows.filter(
      row => row.institutionRowId !== input.institutionRowId
    )
    const assignRow: UjatScheduleAssignRow = {
      id: `remote-${input.institutionRowId}-${isoDate}`,
      institutionRowId: input.institutionRowId,
      gradeValues,
    }
    next.days[isoDate] = {
      ...day,
      rows: [...withoutInstitution.filter(r => r.institutionRowId != null || r.gradeValues.length > 0), assignRow, createEmptyRow()],
    }
  }

  return next
}
