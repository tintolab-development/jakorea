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

export function studentCountLookupKey(
  institutionRowId: string,
  grade: string,
  className: string
): string {
  return `${institutionRowId}|${grade}|${className}`
}

export function collectStudentCountByClass(
  slots: readonly UjatOrganizationScheduleSlotResponse[],
  fallbackInstitutionId?: string
): Map<string, number> {
  const map = new Map<string, number>()
  for (const slot of slots) {
    const appId = slot.organizationApplicationId ?? fallbackInstitutionId
    const grade = slot.grade?.trim()
    const className = (slot.className ?? slot.classLabel ?? '').trim()
    const count = slot.studentCount
    if (appId == null || !grade || !className) continue
    if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) continue
    map.set(studentCountLookupKey(String(appId), grade, className), count)
  }
  return map
}

export function normalizeGradeNumberFromLabel(gradeLabel: string | null | undefined): string | null {
  const raw = gradeLabel?.trim()
  if (!raw) return null
  const digits = raw.replace(/[^0-9]/g, '')
  return digits || raw
}

/** classNo "1" | "1반" | 1 → 슬롯 className "1반" */
export function normalizeClassNameForSlot(
  classNo: string | number | null | undefined
): string | null {
  if (classNo == null) return null
  const raw = String(classNo).trim()
  if (!raw) return null
  const match = raw.match(/(\d+)/)
  if (match) return `${match[1]}반`
  return raw.endsWith('반') ? raw : `${raw}반`
}

/** 서버 응답 슬롯 서명 — API studentCount만 사용 (BE hydrate SSOT) */
export function serializeRemoteTemporaryScheduleSlots(
  slots: readonly UjatOrganizationScheduleSlotResponse[]
): string {
  const normalized: UjatTemporaryScheduleSlotRequest[] = []
  for (const slot of slots) {
    if (slot.scheduleId == null) continue
    const gradeRaw = slot.grade?.trim()
    if (!gradeRaw) continue
    const grade = /^\d+$/.test(gradeRaw)
      ? gradeRaw
      : normalizeGradeNumberFromLabel(gradeRaw) ?? gradeRaw
    const className = normalizeClassNameForSlot(slot.className ?? slot.classLabel)
    if (!className) continue
    normalized.push({
      scheduleId: Number(slot.scheduleId),
      grade,
      className,
      studentCount:
        typeof slot.studentCount === 'number' && Number.isFinite(slot.studentCount)
          ? slot.studentCount
          : 0,
    })
  }
  return serializeTemporaryScheduleSlots(normalized)
}

export function serializeTemporaryScheduleSlots(
  slots: readonly UjatTemporaryScheduleSlotRequest[]
): string {
  return [...slots]
    .map(
      slot =>
        `${slot.scheduleId}|${slot.grade}|${slot.className}|${slot.studentCount}`
    )
    .sort()
    .join(';')
}

export function buildTemporaryScheduleSlotsFromDraft(input: {
  regionState: UjatScheduleAssignRegionState
  institutionRowId: string
  scheduleIdByIsoDate: Map<string, number>
  defaultStudentCount?: number
  studentCountByClass?: Map<string, number>
}): UjatTemporaryScheduleSlotRequest[] {
  const slots: UjatTemporaryScheduleSlotRequest[] = []
  const fallback = input.defaultStudentCount

  for (const day of Object.values(input.regionState.days)) {
    const scheduleId = input.scheduleIdByIsoDate.get(day.isoDate)
    if (scheduleId == null) continue

    for (const row of day.rows) {
      if (row.institutionRowId !== input.institutionRowId) continue
      for (const value of row.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        const gradeNumber = parsed.gradeLabel.replace(/[^0-9]/g, '') || parsed.gradeLabel
        const className = `${parsed.classNo}반`
        const exact = input.studentCountByClass?.get(
          studentCountLookupKey(input.institutionRowId, gradeNumber, className)
        )
        const fromSameInstitution =
          exact && exact > 0
            ? exact
            : [...(input.studentCountByClass?.entries() ?? [])].find(
                ([key, value]) =>
                  key.startsWith(`${input.institutionRowId}|`) && value > 0
              )?.[1]
        const studentCount =
          typeof fromSameInstitution === 'number' && fromSameInstitution > 0
            ? fromSameInstitution
            : typeof fallback === 'number' && fallback > 0
              ? fallback
              : 0
        slots.push({
          scheduleId,
          grade: gradeNumber,
          className,
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
  studentCountByClass?: Map<string, number>
}): UjatTemporaryScheduleSaveRequest | null {
  const slots = buildTemporaryScheduleSlotsFromDraft(input)
  if (slots.length === 0) return null
  return {
    educationRegionCode: toUjatEducationRegionCode(input.regionKey),
    slots,
  }
}

export function gradeClassValueFromSlot(
  slot: UjatOrganizationScheduleSlotResponse
): string | null {
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
      isoDateFromScheduleInstant(slot.scheduleStartAt) ??
      isoByScheduleId.get(Number(scheduleId)) ??
      null
    if (!iso) continue
    if (!next.days[iso]) {
      next.days[iso] = { isoDate: iso, rows: [createEmptyRow()] }
    }
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
