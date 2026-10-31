import { getUjatInstitutionApplicationRowById } from '@/features/program/ujat/model/ujat-institution-application'
import { formatUjatInstitutionFridayDisplay } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { parseGradeClassSectionValue } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import { getUjatScheduleAssignRegionState } from '../../../application-institution/schedule-assign/store'
import { calculateGradeTextbookSupply } from './textbook'
import {
  activePartnerAssignmentsForSchedule,
  attendanceManagerForScheduleFromSources,
  isoDateFromScheduleValue,
  organizationMatrixColumns,
  parseUjatAssignmentClassLabel,
  sameOrganizationApplicationId,
  scheduleIdForInstitutionDate,
  volunteersForClassFromSources,
  type InstitutionAssignmentSources,
} from './institution-assignment-data'
import type { UjatEducationProgressInstitutionDetail } from './types'

export type AssignmentClassRow = {
  gradeLabel: string
  classNo: number
  classLabel: string
  gradeRowSpan: number
  volunteerA: string
  volunteerB: string
  textbookName: string
  textbookQuantityLabel: string
}

export type AssignmentScheduleSection = {
  scheduleId: string
  /** matrix column.scheduleId — 학급 remapping applyFromScheduleId */
  numericScheduleId: number | null
  isoDate: string
  dateDisplay: string
  attendanceManagerLabel: string
  totalClassCount: number
  rows: AssignmentClassRow[]
  /** rows 비어 있을 때 일정 카드 내부 empty copy. 일정 없음 문구와 분리 */
  assignmentEmptyMessage: string | null
}

type GradeClassSection = { gradeLabel: string; classNo: number }

const EMPTY_ASSIGNMENT_PAIRS = '배정된 봉사자/학급 페어가 없습니다'
const EMPTY_ASSIGNMENT_WITH_CLASS_COUNT = (classCount: number) =>
  `확정 학급 ${classCount}개 · 봉사자 미배정`

function resolveGradeTextbook(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  gradeLabel: string
): { textbookName: string; textbookQuantityLabel: string } {
  const block = gradeBlocks.find(item => item.gradeLabel === gradeLabel)
  if (!block) return { textbookName: '-', textbookQuantityLabel: '-' }
  const supply = calculateGradeTextbookSupply(block)
  const textbookQuantityLabel =
    supply.bookCount != null ? `${supply.bookCount}권` : supply.kitCount != null ? `${supply.kitCount}키트` : '-'
  return {
    textbookName: supply.textbookName,
    textbookQuantityLabel,
  }
}

function compareGradeClass(a: GradeClassSection, b: GradeClassSection): number {
  const gradeA = Number.parseInt(a.gradeLabel, 10)
  const gradeB = Number.parseInt(b.gradeLabel, 10)
  if (Number.isFinite(gradeA) && Number.isFinite(gradeB) && gradeA !== gradeB) {
    return gradeA - gradeB
  }
  if (a.classNo !== b.classNo) return a.classNo - b.classNo
  return a.gradeLabel.localeCompare(b.gradeLabel, 'ko')
}

function uniqueSortedSections(sections: GradeClassSection[]): GradeClassSection[] {
  const seen = new Set<string>()
  const unique: GradeClassSection[] = []
  for (const section of sections) {
    const key = `${section.gradeLabel}:${section.classNo}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(section)
  }
  return unique.sort(compareGradeClass)
}

function getGradeValuesFromLocalStore(
  institutionId: string,
  regionKey: NonNullable<ReturnType<typeof getUjatInstitutionApplicationRowById>>['regionKey'],
  isoDate: string
): GradeClassSection[] {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const day = state.days[isoDate]
  if (!day) return []

  const sections: GradeClassSection[] = []
  for (const assignRow of day.rows) {
    if (assignRow.institutionRowId !== institutionId) continue
    for (const value of assignRow.gradeValues) {
      const parsed = parseGradeClassSectionValue(value)
      if (!parsed) continue
      sections.push(parsed)
    }
  }
  return uniqueSortedSections(sections)
}

function getGradeValuesFromConfirmedLabels(
  classLabels: readonly string[] | undefined
): GradeClassSection[] {
  if (!classLabels?.length) return []
  const sections: GradeClassSection[] = []
  for (const label of classLabels) {
    const parsed =
      parseUjatAssignmentClassLabel(label) ??
      (() => {
        const match = label.trim().match(/^(.+?)\s+(\d+)\s*반$/)
        if (!match) return null
        return { gradeLabel: match[1].trim(), classNo: Number(match[2]) }
      })()
    if (!parsed || !Number.isFinite(parsed.classNo) || parsed.classNo < 1) continue
    sections.push(parsed)
  }
  return uniqueSortedSections(sections)
}

function getGradeValuesFromSources(
  sources: InstitutionAssignmentSources,
  scheduleId: number
): GradeClassSection[] {
  const sections: GradeClassSection[] = []
  for (const assignment of activePartnerAssignmentsForSchedule(sources, scheduleId)) {
    const parsed = parseUjatAssignmentClassLabel(assignment.classLabel)
    if (!parsed) continue
    sections.push(parsed)
  }

  for (const volunteer of sources.matrix.volunteers ?? []) {
    for (const cell of volunteer.cells ?? []) {
      if (cell.scheduleId !== scheduleId) continue
      if (
        cell.organizationApplicationId != null &&
        !sameOrganizationApplicationId(
          cell.organizationApplicationId,
          sources.organizationApplicationId
        )
      ) {
        continue
      }
      const parsed = parseUjatAssignmentClassLabel(cell.classLabel)
      if (!parsed) continue
      sections.push(parsed)
    }
  }

  return uniqueSortedSections(sections)
}

function resolveGradeValuesForSchedule(input: {
  detail: UjatEducationProgressInstitutionDetail
  isoDate: string
  sources: InstitutionAssignmentSources | null
  scheduleId: number | null
  confirmedClassLabels?: readonly string[]
}): GradeClassSection[] {
  const institutionRow = getUjatInstitutionApplicationRowById(input.detail.institutionId)
  const fromLocal = institutionRow
    ? getGradeValuesFromLocalStore(input.detail.institutionId, institutionRow.regionKey, input.isoDate)
    : []
  if (fromLocal.length > 0) return fromLocal

  if (input.sources && input.scheduleId != null) {
    const fromRemote = getGradeValuesFromSources(input.sources, input.scheduleId)
    if (fromRemote.length > 0) return fromRemote
  }

  return getGradeValuesFromConfirmedLabels(input.confirmedClassLabels)
}

function applyGradeRowSpans(rows: AssignmentClassRow[]): AssignmentClassRow[] {
  let index = 0
  while (index < rows.length) {
    const gradeLabel = rows[index].gradeLabel
    let span = 1
    while (index + span < rows.length && rows[index + span].gradeLabel === gradeLabel) {
      span += 1
    }
    rows[index].gradeRowSpan = span
    index += span
  }
  return rows
}

function buildRowsForSchedule(
  detail: UjatEducationProgressInstitutionDetail,
  isoDate: string,
  sources: InstitutionAssignmentSources | null,
  scheduleId: number | null,
  confirmedClassLabels?: readonly string[]
): AssignmentClassRow[] {
  const sections = resolveGradeValuesForSchedule({
    detail,
    isoDate,
    sources,
    scheduleId,
    confirmedClassLabels,
  })
  const gradeBlocks = detail.applicationDetail.gradeBlocks

  const rows: AssignmentClassRow[] = sections.map(section => {
    const volunteers =
      sources && scheduleId != null
        ? volunteersForClassFromSources(sources, scheduleId, section.gradeLabel, section.classNo)
        : { volunteerA: '-', volunteerB: '-' }
    const textbook = resolveGradeTextbook(gradeBlocks, section.gradeLabel)

    return {
      gradeLabel: section.gradeLabel,
      classNo: section.classNo,
      classLabel: `${section.classNo}반`,
      gradeRowSpan: 0,
      volunteerA: volunteers.volunteerA,
      volunteerB: volunteers.volunteerB,
      textbookName: textbook.textbookName,
      textbookQuantityLabel: textbook.textbookQuantityLabel,
    }
  })

  return applyGradeRowSpans(rows)
}

function parseIsoDateFromScheduleId(scheduleId: string, institutionId: string): string {
  const prefix = `${institutionId}-`
  if (scheduleId.startsWith(prefix)) {
    return scheduleId.slice(prefix.length)
  }
  return scheduleId
}

function assignmentEmptyMessage(rowsLength: number, matrixClassCount: number): string | null {
  if (rowsLength > 0) return null
  if (matrixClassCount > 0) return EMPTY_ASSIGNMENT_WITH_CLASS_COUNT(matrixClassCount)
  return EMPTY_ASSIGNMENT_PAIRS
}

function toScheduleSection(input: {
  detail: UjatEducationProgressInstitutionDetail
  sources: InstitutionAssignmentSources | null
  scheduleKey: string
  isoDate: string
  dateDisplay: string
  numericScheduleId: number | null
  confirmedClassLabels?: readonly string[]
  matrixClassCount: number
}): AssignmentScheduleSection {
  const rows = buildRowsForSchedule(
    input.detail,
    input.isoDate,
    input.sources,
    input.numericScheduleId,
    input.confirmedClassLabels
  )
  const attendanceManagerLabel =
    input.sources && input.numericScheduleId != null
      ? attendanceManagerForScheduleFromSources(input.sources, input.numericScheduleId)
      : '미정'

  return {
    scheduleId: input.scheduleKey,
    numericScheduleId: input.numericScheduleId,
    isoDate: input.isoDate,
    dateDisplay: input.dateDisplay,
    attendanceManagerLabel,
    totalClassCount: rows.length > 0 ? rows.length : input.matrixClassCount,
    rows,
    assignmentEmptyMessage: assignmentEmptyMessage(rows.length, input.matrixClassCount),
  }
}

/**
 * remote SSOT: matrix columns(org 필터)로 일정 섹션을 만든다.
 * partner-assignments=[] / volunteers=[] 이어도 일정 카드는 유지한다.
 */
function buildSectionsFromRemoteSources(
  detail: UjatEducationProgressInstitutionDetail,
  sources: InstitutionAssignmentSources
): AssignmentScheduleSection[] {
  const confirmedByIso = new Map(
    detail.confirmedScheduleRows.map(row => [
      parseIsoDateFromScheduleId(row.id, detail.institutionId),
      row,
    ])
  )

  const sections: AssignmentScheduleSection[] = []
  const seenScheduleIds = new Set<number>()

  for (const column of organizationMatrixColumns(sources)) {
    if (column.scheduleId == null) continue
    if (seenScheduleIds.has(column.scheduleId)) continue
    seenScheduleIds.add(column.scheduleId)

    const isoDate = isoDateFromScheduleValue(column.educationStartAt)
    if (!isoDate) continue

    const confirmed = confirmedByIso.get(isoDate)
    const matrixClassCount =
      typeof column.classCount === 'number' && Number.isFinite(column.classCount)
        ? Math.max(0, column.classCount)
        : 0

    sections.push(
      toScheduleSection({
        detail,
        sources,
        scheduleKey: confirmed?.id ?? `${detail.institutionId}-${isoDate}`,
        isoDate,
        dateDisplay: confirmed?.dateDisplay ?? formatUjatInstitutionFridayDisplay(isoDate),
        numericScheduleId: column.scheduleId,
        confirmedClassLabels: confirmed?.classLabels,
        matrixClassCount,
      })
    )
  }

  return sections.sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

function buildSectionsFromConfirmedRows(
  detail: UjatEducationProgressInstitutionDetail,
  sources: InstitutionAssignmentSources | null
): AssignmentScheduleSection[] {
  return detail.confirmedScheduleRows.map(schedule => {
    const isoDate = parseIsoDateFromScheduleId(schedule.id, detail.institutionId)
    const numericScheduleId = sources ? scheduleIdForInstitutionDate(sources, isoDate) : null
    return toScheduleSection({
      detail,
      sources,
      scheduleKey: schedule.id,
      isoDate,
      dateDisplay: schedule.dateDisplay,
      numericScheduleId,
      confirmedClassLabels: schedule.classLabels,
      matrixClassCount: schedule.classLabels.length,
    })
  })
}

export function buildAssignmentScheduleSections(
  detail: UjatEducationProgressInstitutionDetail,
  sources: InstitutionAssignmentSources | null = null
): AssignmentScheduleSection[] {
  // remote matrix 가 있으면 org columns 가 일정 SSOT (로컬 confirmed 유무와 무관)
  if (sources) {
    return buildSectionsFromRemoteSources(detail, sources)
  }
  return buildSectionsFromConfirmedRows(detail, null)
}
