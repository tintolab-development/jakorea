import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { getUjatInstitutionApplicationRowById } from '@/features/program/ujat/model/ujat-institution-application'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import {
  toGradeClassSectionValue,
  parseGradeClassSectionValue,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import { patchUjatScheduleAssignDay } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/store'
import {
  gradeClassValueFromSlot,
  normalizeClassNameForSlot,
  normalizeGradeNumberFromLabel,
} from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/temporary-schedule-mapper'
import {
  isoDateFromScheduleInstant,
  type UjatOrganizationScheduleSlotResponse,
  type UjatTemporaryScheduleSlotRequest,
} from '@/features/program/ujat/api/temporary-schedule-api'
import type {
  UjatEducationClassRemappingItemRequest,
  UjatEducationClassRemappingRequest,
} from '@/features/program/ujat/api/education-classes-api'
import type { EducationClassResponse } from '@/shared/api/generated/dashboard/schemas/educationClassResponse'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressInstitutionDetail } from './types'
import {
  flattenExistingClasses,
  formatGradeLabelFromValue,
  mergePendingClassesIntoGradeBlocks,
  removeClassesFromGradeBlocks,
  type UjatEducationProgressClassRemoval,
  type UjatEducationProgressPendingClassRow,
} from './grade-blocks'

dayjs.extend(isSameOrAfter)

export const UNASSIGNED_GRADE_VALUE = '__unassigned__'

export const UNASSIGNED_GRADE_LABEL = '미배정'

export type ChangeClassScheduleOption = {
  value: string
  label: string
  isoDate: string
}

export type ChangeClassMapping = {
  existingGradeLabel: string
  existingClassNo: number
  newGradeLabel: string | null
  newClassNo: number | null
}

export type ChangeClassConfirmPayload = {
  applyScheduleRowId: string
  /** matrix/API numeric schedule id — remapping applyFromScheduleId */
  applyFromScheduleId: number | null
  applyIsoDate: string
  /** GET education-classes.revision — remapping expectedRevision */
  expectedRevision: number | null
  mappings: ChangeClassMapping[]
}

export function getUjatEducationProgressToday(): dayjs.Dayjs {
  return dayjs()
}

function parseIsoDateFromScheduleId(scheduleId: string, institutionId: string): string {
  const prefix = `${institutionId}-`
  if (scheduleId.startsWith(prefix)) {
    return scheduleId.slice(prefix.length)
  }
  return scheduleId
}

export function buildChangeClassScheduleOptions(
  detail: UjatEducationProgressInstitutionDetail,
  _half: EducationProgressHalfKey,
  remoteScheduleRows: ReadonlyArray<{
    id: string
    dateDisplay: string
    isoDate?: string
  }> = []
): ChangeClassScheduleOption[] {
  void _half
  const today = getUjatEducationProgressToday().startOf('day')
  const byIso = new Map<string, ChangeClassScheduleOption>()

  for (const row of detail.confirmedScheduleRows) {
    const isoDate = parseIsoDateFromScheduleId(row.id, detail.institutionId)
    byIso.set(isoDate, {
      value: row.id,
      label: row.dateDisplay,
      isoDate,
    })
  }

  for (const row of remoteScheduleRows) {
    const isoDate =
      row.isoDate?.trim() || parseIsoDateFromScheduleId(row.id, detail.institutionId)
    if (!isoDate || byIso.has(isoDate)) continue
    byIso.set(isoDate, {
      value: row.id,
      label: row.dateDisplay,
      isoDate,
    })
  }

  return [...byIso.values()]
    .filter(option => dayjs(option.isoDate).isSameOrAfter(today, 'day'))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

export type ExistingClassSelectOptions = {
  gradeOptions: Array<{ value: string; label: string }>
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>
}

function finalizeExistingClassOptions(
  gradeSet: Set<string>,
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>
): ExistingClassSelectOptions {
  const gradeOptions = [...gradeSet]
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .map(value => ({ value, label: `${value}학년` }))

  for (const gradeValue of Object.keys(classOptionsByGrade)) {
    classOptionsByGrade[gradeValue].sort(
      (a, b) => Number.parseInt(a.value, 10) - Number.parseInt(b.value, 10)
    )
  }

  return { gradeOptions, classOptionsByGrade }
}

function pushExistingClassOption(
  gradeSet: Set<string>,
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>,
  gradeLabel: string,
  classNo: number
) {
  const gradeValue = gradeLabel.replace(/학년$/, '').trim()
  if (!gradeValue || !Number.isFinite(classNo) || classNo < 1) return
  gradeSet.add(gradeValue)
  if (!classOptionsByGrade[gradeValue]) {
    classOptionsByGrade[gradeValue] = []
  }
  const classValue = String(classNo)
  if (!classOptionsByGrade[gradeValue].some(option => option.value === classValue)) {
    classOptionsByGrade[gradeValue].push({
      value: classValue,
      label: `${classNo}반`,
    })
  }
}

export function buildExistingClassOptions(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
): ExistingClassSelectOptions {
  const rows = flattenExistingClasses(gradeBlocks)
  const gradeSet = new Set<string>()
  const classOptionsByGrade: Record<string, Array<{ value: string; label: string }>> = {}

  for (const row of rows) {
    pushExistingClassOption(gradeSet, classOptionsByGrade, row.gradeLabel, row.classNo)
  }

  return finalizeExistingClassOptions(gradeSet, classOptionsByGrade)
}

/** education-classes GET → 기존 학급 셀렉트 옵션 */
export function buildExistingClassOptionsFromEducationClasses(
  classes: ReadonlyArray<EducationClassResponse>
): ExistingClassSelectOptions {
  const gradeSet = new Set<string>()
  const classOptionsByGrade: Record<string, Array<{ value: string; label: string }>> = {}

  for (const item of classes) {
    const gradeRaw = item.grade?.trim()
    if (!gradeRaw) continue
    const gradeValue = normalizeGradeNumberFromLabel(gradeRaw) ?? gradeRaw.replace(/학년$/, '')
    const className = item.className ?? item.classLabel
    const classNoMatch = String(className ?? '').match(/(\d+)/)
    const classNo = classNoMatch ? Number.parseInt(classNoMatch[1]!, 10) : NaN
    pushExistingClassOption(gradeSet, classOptionsByGrade, `${gradeValue}학년`, classNo)
  }

  return finalizeExistingClassOptions(gradeSet, classOptionsByGrade)
}

function mappingKey(gradeLabel: string, classNo: number): string {
  return toGradeClassSectionValue({ gradeLabel, classNo })
}

function slotMatchesMapping(
  slot: UjatOrganizationScheduleSlotResponse,
  mapping: ChangeClassMapping
): boolean {
  const value = gradeClassValueFromSlot(slot)
  if (!value) return false
  return value === mappingKey(mapping.existingGradeLabel, mapping.existingClassNo)
}

/**
 * 적용일 이후 슬롯 remap 순수 변환.
 * BE education-class-remapping 계약이 생기기 전 로컬/어댑터 검증용.
 * temporary-schedule PUT·education-classes POST·schedule-change-request 로 저장하지 말 것.
 */
export function remapTemporaryScheduleSlotsForClassChange(
  slots: ReadonlyArray<UjatOrganizationScheduleSlotResponse>,
  payload: ChangeClassConfirmPayload
): UjatTemporaryScheduleSlotRequest[] {
  const applyDay = dayjs(payload.applyIsoDate).startOf('day')
  const out: UjatTemporaryScheduleSlotRequest[] = []

  for (const slot of slots) {
    if (slot.scheduleId == null) continue
    const gradeRaw = slot.grade?.trim()
    if (!gradeRaw) continue
    const className = normalizeClassNameForSlot(slot.className ?? slot.classLabel)
    if (!className) continue

    const slotIso =
      isoDateFromScheduleInstant(slot.scheduleStartAt) ??
      isoDateFromScheduleInstant(slot.scheduleEndAt)
    const isFromApplyDate =
      !slotIso || dayjs(slotIso).isSameOrAfter(applyDay, 'day')

    let nextGrade =
      normalizeGradeNumberFromLabel(gradeRaw) ?? (/^\d+$/.test(gradeRaw) ? gradeRaw : gradeRaw)
    let nextClassName = className
    let drop = false

    if (isFromApplyDate) {
      for (const mapping of payload.mappings) {
        if (!slotMatchesMapping(slot, mapping)) continue
        if (mapping.newGradeLabel == null || mapping.newClassNo == null) {
          drop = true
          break
        }
        nextGrade =
          normalizeGradeNumberFromLabel(mapping.newGradeLabel) ??
          mapping.newGradeLabel.replace(/학년$/, '')
        nextClassName = normalizeClassNameForSlot(mapping.newClassNo) ?? nextClassName
        break
      }
    }

    if (drop) continue

    out.push({
      scheduleId: Number(slot.scheduleId),
      grade: nextGrade,
      className: nextClassName,
      studentCount:
        typeof slot.studentCount === 'number' && Number.isFinite(slot.studentCount)
          ? slot.studentCount
          : 0,
    })
  }

  return out
}

function mappingToOldValue(mapping: ChangeClassMapping): string {
  return toGradeClassSectionValue({
    gradeLabel: mapping.existingGradeLabel,
    classNo: mapping.existingClassNo,
  })
}

function mappingToNewValue(mapping: ChangeClassMapping): string | null {
  if (mapping.newGradeLabel == null || mapping.newClassNo == null) return null
  return toGradeClassSectionValue({
    gradeLabel: mapping.newGradeLabel,
    classNo: mapping.newClassNo,
  })
}

export function applyClassChangesToSchedules(
  detail: UjatEducationProgressInstitutionDetail,
  regionKey: UjatInstitutionApplicationRegionKey,
  payload: ChangeClassConfirmPayload
): void {
  const { applyIsoDate, mappings } = payload
  if (mappings.length === 0) return

  const oldToNew = new Map<string, string | null>()
  for (const mapping of mappings) {
    oldToNew.set(mappingToOldValue(mapping), mappingToNewValue(mapping))
  }

  const targetIsoDates = detail.confirmedScheduleRows
    .map(row => parseIsoDateFromScheduleId(row.id, detail.institutionId))
    .filter(isoDate => dayjs(isoDate).isSameOrAfter(dayjs(applyIsoDate), 'day'))

  for (const isoDate of targetIsoDates) {
    patchUjatScheduleAssignDay(regionKey, isoDate, day => ({
      ...day,
      rows: day.rows.map(row => {
        if (row.institutionRowId !== detail.institutionId) return row

        let nextValues = [...row.gradeValues]

        for (const [oldValue, newValue] of oldToNew) {
          const index = nextValues.indexOf(oldValue)
          if (index < 0) continue

          if (newValue == null) {
            nextValues = nextValues.filter((_, i) => i !== index)
            continue
          }

          nextValues[index] = newValue
        }

        return {
          ...row,
          gradeValues: nextValues,
        }
      }),
    }))
  }
}

function gradeWireFromLabel(gradeLabel: string): string {
  return normalizeGradeNumberFromLabel(gradeLabel) ?? gradeLabel.replace(/학년$/, '').trim()
}

function classNameWireFromNo(classNo: number): string {
  return normalizeClassNameForSlot(classNo) ?? `${classNo}반`
}

export function mappingToRemappingItem(
  mapping: ChangeClassMapping
): UjatEducationClassRemappingItemRequest {
  const fromGrade = gradeWireFromLabel(mapping.existingGradeLabel)
  const fromClassName = classNameWireFromNo(mapping.existingClassNo)
  if (mapping.newGradeLabel == null || mapping.newClassNo == null) {
    return {
      fromGrade,
      fromClassName,
      toGrade: null,
      toClassName: null,
      unassign: true,
    }
  }
  return {
    fromGrade,
    fromClassName,
    toGrade: gradeWireFromLabel(mapping.newGradeLabel),
    toClassName: classNameWireFromNo(mapping.newClassNo),
    unassign: false,
  }
}

/**
 * ChangeClassConfirmPayload → POST education-class-remappings body.
 * applyFromScheduleId(numeric) + applyFromDate + expectedRevision 필수.
 */
export function buildEducationClassRemappingRequest(
  payload: ChangeClassConfirmPayload
): UjatEducationClassRemappingRequest | null {
  if (payload.expectedRevision == null || !Number.isFinite(payload.expectedRevision)) {
    return null
  }
  if (payload.mappings.length === 0) return null

  const body: UjatEducationClassRemappingRequest = {
    expectedRevision: payload.expectedRevision,
    applyFromDate: payload.applyIsoDate,
    mappings: payload.mappings.map(mappingToRemappingItem),
  }
  if (payload.applyFromScheduleId != null && Number.isFinite(payload.applyFromScheduleId)) {
    body.applyFromScheduleId = payload.applyFromScheduleId
  }
  return body
}

export function applyClassChangesToGradeBlocks(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  mappings: ChangeClassMapping[]
): UjatInstitutionApplicationGradeBlockDetail[] {
  const rows = flattenExistingClasses(gradeBlocks)
  const removals: UjatEducationProgressClassRemoval[] = []
  const additions: UjatEducationProgressPendingClassRow[] = []

  for (const mapping of mappings) {
    removals.push({
      gradeLabel: mapping.existingGradeLabel,
      classNo: mapping.existingClassNo,
    })

    if (mapping.newGradeLabel == null || mapping.newClassNo == null) continue

    const existing = rows.find(
      row =>
        row.gradeLabel === mapping.existingGradeLabel &&
        row.classNo === mapping.existingClassNo
    )

    additions.push({
      id: `change-${mapping.existingGradeLabel}-${mapping.existingClassNo}`,
      gradeLabel: mapping.newGradeLabel,
      classNo: mapping.newClassNo,
      studentCount: existing?.studentCount ?? 0,
    })
  }

  return mergePendingClassesIntoGradeBlocks(
    removeClassesFromGradeBlocks(gradeBlocks, removals),
    additions
  )
}

export function resolveRegionKeyForInstitution(
  institutionId: string
): UjatInstitutionApplicationRegionKey | null {
  return getUjatInstitutionApplicationRowById(institutionId)?.regionKey ?? null
}

export function buildMappingFromRowFields(
  existingGrade: string | undefined,
  existingClassNo: string | undefined,
  newGrade: string | undefined,
  newClassNo: string
): ChangeClassMapping | null {
  if (!existingGrade || !existingClassNo || !newGrade) return null

  const existingGradeLabel = formatGradeLabelFromValue(existingGrade)
  const existingClassNoNum = Number.parseInt(existingClassNo, 10)
  if (!Number.isFinite(existingClassNoNum) || existingClassNoNum < 1) return null

  if (newGrade === UNASSIGNED_GRADE_VALUE) {
    return {
      existingGradeLabel,
      existingClassNo: existingClassNoNum,
      newGradeLabel: null,
      newClassNo: null,
    }
  }

  const newClassNoNum = Number.parseInt(newClassNo.replace(/\D/g, ''), 10)
  if (!Number.isFinite(newClassNoNum) || newClassNoNum < 1) return null

  return {
    existingGradeLabel,
    existingClassNo: existingClassNoNum,
    newGradeLabel: formatGradeLabelFromValue(newGrade),
    newClassNo: newClassNoNum,
  }
}

export function isSameClassMapping(
  existingGrade: string | undefined,
  existingClassNo: string | undefined,
  newGrade: string | undefined,
  newClassNo: string
): boolean {
  if (newGrade === UNASSIGNED_GRADE_VALUE) return false
  if (!existingGrade || !existingClassNo || !newGrade) return false
  const classNo = Number.parseInt(newClassNo.replace(/\D/g, ''), 10)
  if (!Number.isFinite(classNo)) return false
  return existingGrade === newGrade && Number.parseInt(existingClassNo, 10) === classNo
}

/** Validates row fields; returns error message or null */
export function validateChangeClassRows(
  rows: Array<{
    existingGrade?: string
    existingClassNo?: string
    newGrade?: string
    newClassNo: string
  }>
): string | null {
  const existingKeys = new Set<string>()

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNum = index + 1

    if (!row.existingGrade || !row.existingClassNo) {
      return `${rowNum}번째 행의 기존 학급을 선택해 주세요.`
    }

    if (!row.newGrade) {
      return `${rowNum}번째 행의 변경 학급 학년을 선택해 주세요.`
    }

    if (row.newGrade !== UNASSIGNED_GRADE_VALUE) {
      const classNo = Number.parseInt(row.newClassNo.replace(/\D/g, ''), 10)
      if (!Number.isFinite(classNo) || classNo < 1) {
        return `${rowNum}번째 행의 변경 학급을 선택해 주세요.`
      }
      if (classNo > 20) {
        return `${rowNum}번째 행의 학급은 20반 이하로 입력해 주세요.`
      }
    }

    if (isSameClassMapping(row.existingGrade, row.existingClassNo, row.newGrade, row.newClassNo)) {
      return `${rowNum}번째 행의 기존 학급과 변경 학급이 동일합니다.`
    }

    const existingKey = `${row.existingGrade}:${row.existingClassNo}`
    if (existingKeys.has(existingKey)) {
      return '동일한 기존 학급이 중복 선택되었습니다.'
    }
    existingKeys.add(existingKey)
  }

  return null
}

export function parseGradeClassFromScheduleValue(value: string) {
  return parseGradeClassSectionValue(value)
}
