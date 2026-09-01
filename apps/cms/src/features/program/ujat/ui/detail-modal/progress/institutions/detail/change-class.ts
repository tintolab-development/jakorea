import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { getUjatInstitutionApplicationRowById } from '@/data/mock/ujat-institution-application-mock'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import {
  toGradeClassSectionValue,
  parseGradeClassSectionValue,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import { patchUjatScheduleAssignDay } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/store'
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
  applyIsoDate: string
  mappings: ChangeClassMapping[]
}

export function getUjatEducationProgressMockToday(half: EducationProgressHalfKey): dayjs.Dayjs {
  return half === 'h1' ? dayjs('2026-04-03') : dayjs('2026-09-11')
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
  half: EducationProgressHalfKey
): ChangeClassScheduleOption[] {
  const today = getUjatEducationProgressMockToday(half).startOf('day')

  return detail.confirmedScheduleRows
    .map(row => ({
      value: row.id,
      label: row.dateDisplay,
      isoDate: parseIsoDateFromScheduleId(row.id, detail.institutionId),
    }))
    .filter(option => dayjs(option.isoDate).isSameOrAfter(today, 'day'))
}

export type ExistingClassSelectOptions = {
  gradeOptions: Array<{ value: string; label: string }>
  classOptionsByGrade: Record<string, Array<{ value: string; label: string }>>
}

export function buildExistingClassOptions(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
): ExistingClassSelectOptions {
  const rows = flattenExistingClasses(gradeBlocks)
  const gradeSet = new Set<string>()
  const classOptionsByGrade: Record<string, Array<{ value: string; label: string }>> = {}

  for (const row of rows) {
    const gradeValue = row.gradeLabel.replace(/학년$/, '').trim()
    gradeSet.add(gradeValue)
    if (!classOptionsByGrade[gradeValue]) {
      classOptionsByGrade[gradeValue] = []
    }
    const classValue = String(row.classNo)
    if (!classOptionsByGrade[gradeValue].some(option => option.value === classValue)) {
      classOptionsByGrade[gradeValue].push({
        value: classValue,
        label: `${row.classNo}반`,
      })
    }
  }

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
        return `${rowNum}번째 행의 변경 학급을 입력해 주세요.`
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
