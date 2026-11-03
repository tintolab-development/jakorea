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
  /**
   * GET education-classes 원문 grade/className.
   * remapping from* 는 정규화 값이 아니라 카탈로그 문자열을 그대로 보낸다.
   */
  existingWireGrade?: string
  existingWireClassName?: string
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

export type ExistingClassWireRef = {
  grade: string
  className: string
}

export type ExistingClassSelectOptions = {
  gradeOptions: Array<{ value: string; label: string }>
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>
  /** `${gradeSelectValue}:${classSelectValue}` → GET education-classes 원문 */
  wireBySelectKey: Record<string, ExistingClassWireRef>
}

export function emptyExistingClassSelectOptions(): ExistingClassSelectOptions {
  return { gradeOptions: [], classOptionsByGrade: {}, wireBySelectKey: {} }
}

function finalizeExistingClassOptions(
  gradeSet: Set<string>,
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>,
  wireBySelectKey: Record<string, ExistingClassWireRef> = {}
): ExistingClassSelectOptions {
  const gradeOptions = [...gradeSet]
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .map(value => ({ value, label: `${value}학년` }))

  for (const gradeValue of Object.keys(classOptionsByGrade)) {
    classOptionsByGrade[gradeValue].sort(
      (a, b) => Number.parseInt(a.value, 10) - Number.parseInt(b.value, 10)
    )
  }

  return { gradeOptions, classOptionsByGrade, wireBySelectKey }
}

function pushExistingClassOption(
  gradeSet: Set<string>,
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>,
  gradeLabel: string,
  classNo: number,
  wire?: ExistingClassWireRef,
  wireBySelectKey?: Record<string, ExistingClassWireRef>
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
  if (wire && wireBySelectKey) {
    wireBySelectKey[`${gradeValue}:${classValue}`] = wire
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

/**
 * remap fromClassName 용 wire.
 * className 우선. classLabel 전체("2학년 1반")를 넣지 않고, 반 번호만 추출한다.
 */
export function resolveEducationClassWireClassName(
  item: Pick<EducationClassResponse, 'className' | 'classLabel'>
): string | null {
  const className = item.className?.trim()
  if (className) return className
  const label = item.classLabel?.trim()
  if (!label) return null
  if (/^\d+$/.test(label)) return `${label}반`
  if (/^\d+반$/.test(label)) return label
  const match = label.match(/(\d+)\s*반/)
  if (match) return `${match[1]}반`
  return null
}

/** 학급 셀렉트 표시 — classLabel 의 반 부분 우선, 없으면 className */
export function resolveEducationClassDisplayClassLabel(
  item: Pick<EducationClassResponse, 'className' | 'classLabel'>,
  wireClassName: string
): string {
  const label = item.classLabel?.trim()
  if (label) {
    if (/^\d+반$/.test(label) || /^\d+$/.test(label)) {
      return normalizeClassNameForSlot(label) ?? wireClassName
    }
    const match = label.match(/(\d+)\s*반/)
    if (match) return `${match[1]}반`
  }
  return normalizeClassNameForSlot(wireClassName) ?? wireClassName
}

/**
 * education-classes GET → 기존 학급 셀렉트.
 * select value = GET grade / className 원문 (remap body 와 동일).
 */
export function buildExistingClassOptionsFromEducationClasses(
  classes: ReadonlyArray<EducationClassResponse>
): ExistingClassSelectOptions {
  const gradeMeta = new Map<string, { sortKey: number; label: string }>()
  const classOptionsByGrade: Record<string, Array<{ value: string; label: string }>> = {}
  const wireBySelectKey: Record<string, ExistingClassWireRef> = {}

  for (const item of classes) {
    const gradeRaw = item.grade?.trim()
    if (!gradeRaw) continue
    const wireClassName = resolveEducationClassWireClassName(item)
    if (!wireClassName) continue

    const sortKey = Number.parseInt(
      normalizeGradeNumberFromLabel(gradeRaw) ?? gradeRaw.replace(/학년$/, ''),
      10
    )
    const gradeLabel = Number.isFinite(sortKey) ? `${sortKey}학년` : gradeRaw
    if (!gradeMeta.has(gradeRaw)) {
      gradeMeta.set(gradeRaw, { sortKey: Number.isFinite(sortKey) ? sortKey : 999, label: gradeLabel })
    }

    if (!classOptionsByGrade[gradeRaw]) {
      classOptionsByGrade[gradeRaw] = []
    }
    if (!classOptionsByGrade[gradeRaw].some(option => option.value === wireClassName)) {
      classOptionsByGrade[gradeRaw].push({
        value: wireClassName,
        label: resolveEducationClassDisplayClassLabel(item, wireClassName),
      })
    }
    wireBySelectKey[`${gradeRaw}:${wireClassName}`] = {
      grade: gradeRaw,
      className: wireClassName,
    }
  }

  const gradeOptions = [...gradeMeta.entries()]
    .sort((a, b) => a[1].sortKey - b[1].sortKey || a[0].localeCompare(b[0], 'ko'))
    .map(([value, meta]) => ({ value, label: meta.label }))

  for (const gradeValue of Object.keys(classOptionsByGrade)) {
    classOptionsByGrade[gradeValue].sort((a, b) => {
      const aNo = Number.parseInt(a.value.replace(/\D/g, ''), 10)
      const bNo = Number.parseInt(b.value.replace(/\D/g, ''), 10)
      if (Number.isFinite(aNo) && Number.isFinite(bNo) && aNo !== bNo) return aNo - bNo
      return a.value.localeCompare(b.value, 'ko')
    })
  }

  return { gradeOptions, classOptionsByGrade, wireBySelectKey }
}

export function resolveExistingClassWire(
  options: ExistingClassSelectOptions,
  existingGrade: string | undefined,
  existingClassNo: string | undefined
): ExistingClassWireRef | null {
  if (!existingGrade || !existingClassNo) return null
  return options.wireBySelectKey[`${existingGrade}:${existingClassNo}`] ?? null
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
  const fromGrade =
    mapping.existingWireGrade?.trim() || gradeWireFromLabel(mapping.existingGradeLabel)
  const fromClassName =
    mapping.existingWireClassName?.trim() || classNameWireFromNo(mapping.existingClassNo)
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
  newClassNo: string,
  wire?: ExistingClassWireRef | null
): ChangeClassMapping | null {
  if (!existingGrade || !existingClassNo || !newGrade) return null

  const existingGradeLabel = formatGradeLabelFromValue(normalizeGradeSelectValue(existingGrade))
  const existingClassNoNum = parseClassSelectNo(existingClassNo)
  if (existingClassNoNum == null) return null

  const wireFields =
    wire?.grade && wire.className
      ? { existingWireGrade: wire.grade, existingWireClassName: wire.className }
      : {}

  if (newGrade === UNASSIGNED_GRADE_VALUE) {
    return {
      existingGradeLabel,
      existingClassNo: existingClassNoNum,
      newGradeLabel: null,
      newClassNo: null,
      ...wireFields,
    }
  }

  const newClassNoNum = Number.parseInt(newClassNo.replace(/\D/g, ''), 10)
  if (!Number.isFinite(newClassNoNum) || newClassNoNum < 1) return null

  return {
    existingGradeLabel,
    existingClassNo: existingClassNoNum,
    newGradeLabel: formatGradeLabelFromValue(newGrade),
    newClassNo: newClassNoNum,
    ...wireFields,
  }
}

export function isSameClassMapping(
  existingGrade: string | undefined,
  existingClassNo: string | undefined,
  newGrade: string | undefined,
  newClassNo: string
): boolean {
  if (newGrade === UNASSIGNED_GRADE_VALUE) return false
  const existingKey = normalizedClassKey(existingGrade, existingClassNo)
  const newKey = normalizedClassKey(newGrade, newClassNo)
  return existingKey != null && existingKey === newKey
}

export type ChangeClassRowFields = {
  existingGrade?: string
  existingClassNo?: string
  newGrade?: string
  newClassNo: string
}

function normalizeGradeSelectValue(grade: string): string {
  return normalizeGradeNumberFromLabel(grade) ?? grade.replace(/학년$/, '').trim()
}

function parseClassSelectNo(classNo: string): number | null {
  const value = Number.parseInt(classNo.replace(/\D/g, ''), 10)
  return Number.isFinite(value) && value >= 1 ? value : null
}

/**
 * 학년·반 비교 키. 기존 학급 셀렉트 값은 GET 원문("1학년"·"2반")일 수 있어
 * 변경 학급 셀렉트 값("1"·"2")과 같은 형태로 맞춘 뒤 비교한다.
 */
export function normalizedClassKey(
  grade: string | undefined,
  classNo: string | undefined
): string | null {
  if (!grade || !classNo || grade === UNASSIGNED_GRADE_VALUE) return null
  const gradeValue = normalizeGradeSelectValue(grade)
  const classNoNum = parseClassSelectNo(classNo)
  if (!gradeValue || classNoNum == null) return null
  return `${gradeValue}:${classNoNum}`
}

/** 카탈로그(기존 학급 셀렉트)에 있는 학급의 정규화 키 */
export function collectCatalogClassKeys(options: ExistingClassSelectOptions): Set<string> {
  const keys = new Set<string>()
  for (const [grade, classOptions] of Object.entries(options.classOptionsByGrade)) {
    for (const option of classOptions) {
      const key = normalizedClassKey(grade, option.value)
      if (key) keys.add(key)
    }
  }
  return keys
}

/**
 * excludeIndex 행의 「변경할 학급」으로 고를 수 없는 학급.
 * - 다른 행이 이미 변경 대상으로 고른 학급
 * - 카탈로그에 남아 있는 학급 (다른 행에서 다른 곳으로 옮기거나 미배정하는 학급은 제외)
 * 자기 행의 기존 학급은 남아 있으므로 동일 학급 선택도 막힌다.
 */
export function collectBlockedTargetClassKeys(
  rows: ReadonlyArray<ChangeClassRowFields>,
  excludeIndex: number,
  catalogKeys: ReadonlySet<string>
): Set<string> {
  const movedAwayKeys = new Set<string>()
  const blocked = new Set<string>()
  rows.forEach((row, index) => {
    if (index === excludeIndex) return
    const existingKey = normalizedClassKey(row.existingGrade, row.existingClassNo)
    if (existingKey) movedAwayKeys.add(existingKey)
    const targetKey = normalizedClassKey(row.newGrade, row.newClassNo)
    if (targetKey) blocked.add(targetKey)
  })
  for (const key of catalogKeys) {
    if (!movedAwayKeys.has(key)) blocked.add(key)
  }
  return blocked
}

export function existingClassKey(
  grade: string | undefined,
  classNo: string | undefined
): string | null {
  if (!grade || !classNo) return null
  return `${grade}:${classNo}`
}

/** 기존 학급·변경 학급 필수 입력이 채워졌는지 (동일 학급 여부는 검사하지 않음) */
export function isChangeClassRowComplete(row: ChangeClassRowFields): boolean {
  if (!row.existingGrade || !row.existingClassNo || !row.newGrade) return false
  if (row.newGrade === UNASSIGNED_GRADE_VALUE) return true
  const classNo = Number.parseInt(row.newClassNo.replace(/\D/g, ''), 10)
  return Number.isFinite(classNo) && classNo >= 1 && classNo <= 20
}

export function countAvailableExistingClasses(
  options: ExistingClassSelectOptions
): number {
  return Object.values(options.classOptionsByGrade).reduce(
    (sum, classOptions) => sum + classOptions.length,
    0
  )
}

export function collectUsedExistingClassKeys(
  rows: ReadonlyArray<ChangeClassRowFields>,
  excludeIndex?: number
): Set<string> {
  const keys = new Set<string>()
  rows.forEach((row, index) => {
    if (excludeIndex != null && index === excludeIndex) return
    const key = existingClassKey(row.existingGrade, row.existingClassNo)
    if (key) keys.add(key)
  })
  return keys
}

/**
 * 「추가」 가능 여부. 미완성 행이 있거나 기존 학급 수 상한을 넘으면 거부.
 */
export function getChangeClassAddRowBlockReason(
  rows: ReadonlyArray<ChangeClassRowFields>,
  availableExistingClassCount: number
): string | null {
  if (rows.some(row => !isChangeClassRowComplete(row))) {
    return '입력 중인 행의 학급 정보를 모두 선택한 뒤 추가해 주세요.'
  }
  if (availableExistingClassCount <= 0) {
    return '변경할 기존 학급이 없습니다.'
  }
  if (rows.length >= availableExistingClassCount) {
    return '변경 가능한 기존 학급 수만큼만 추가할 수 있습니다.'
  }
  return null
}

/** Validates row fields; returns error message or null */
export function validateChangeClassRows(
  rows: ReadonlyArray<ChangeClassRowFields>,
  catalogKeys: ReadonlySet<string> = new Set()
): string | null {
  const existingKeys = new Set<string>()
  const targetKeys = new Set<string>()

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

    const existingKey =
      normalizedClassKey(row.existingGrade, row.existingClassNo) ??
      `${row.existingGrade}:${row.existingClassNo}`
    if (existingKeys.has(existingKey)) {
      return '동일한 기존 학급이 중복 선택되었습니다.'
    }
    existingKeys.add(existingKey)
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const targetKey = normalizedClassKey(row.newGrade, row.newClassNo)
    if (!targetKey) continue
    if (targetKeys.has(targetKey)) {
      return `${index + 1}번째 행의 변경 학급이 다른 행과 중복됩니다.`
    }
    targetKeys.add(targetKey)
    if (catalogKeys.has(targetKey) && !existingKeys.has(targetKey)) {
      return `${index + 1}번째 행의 변경 학급은 이미 진행 중인 학급입니다.`
    }
  }

  return null
}

export function parseGradeClassFromScheduleValue(value: string) {
  return parseGradeClassSectionValue(value)
}
