import { getUjatInstitutionApplicationRowById } from '@/features/program/ujat/model/ujat-institution-application'
import { parseGradeClassSectionValue } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import { getUjatScheduleAssignRegionState } from '../../../application-institution/schedule-assign/store'
import { calculateGradeTextbookSupply } from './textbook'
import {
  attendanceManagerForScheduleFromSources,
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
  isoDate: string
  dateDisplay: string
  attendanceManagerLabel: string
  totalClassCount: number
  rows: AssignmentClassRow[]
}

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

function compareGradeClass(
  a: { gradeLabel: string; classNo: number },
  b: { gradeLabel: string; classNo: number }
): number {
  const gradeA = Number.parseInt(a.gradeLabel, 10)
  const gradeB = Number.parseInt(b.gradeLabel, 10)
  if (Number.isFinite(gradeA) && Number.isFinite(gradeB) && gradeA !== gradeB) {
    return gradeA - gradeB
  }
  if (a.classNo !== b.classNo) return a.classNo - b.classNo
  return a.gradeLabel.localeCompare(b.gradeLabel, 'ko')
}

function getGradeValuesForSchedule(
  institutionId: string,
  regionKey: NonNullable<ReturnType<typeof getUjatInstitutionApplicationRowById>>['regionKey'],
  isoDate: string
): Array<{ gradeLabel: string; classNo: number }> {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const day = state.days[isoDate]
  if (!day) return []

  const sections: Array<{ gradeLabel: string; classNo: number }> = []

  for (const assignRow of day.rows) {
    if (assignRow.institutionRowId !== institutionId) continue
    for (const value of assignRow.gradeValues) {
      const parsed = parseGradeClassSectionValue(value)
      if (!parsed) continue
      sections.push(parsed)
    }
  }

  return sections.sort(compareGradeClass)
}

function buildRowsForSchedule(
  detail: UjatEducationProgressInstitutionDetail,
  isoDate: string,
  sources: InstitutionAssignmentSources | null,
  scheduleId: number | null
): AssignmentClassRow[] {
  const institutionRow = getUjatInstitutionApplicationRowById(detail.institutionId)
  if (!institutionRow) return []

  const sections = getGradeValuesForSchedule(
    detail.institutionId,
    institutionRow.regionKey,
    isoDate
  )
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

function parseIsoDateFromScheduleId(scheduleId: string, institutionId: string): string {
  const prefix = `${institutionId}-`
  if (scheduleId.startsWith(prefix)) {
    return scheduleId.slice(prefix.length)
  }
  return scheduleId
}

export function buildAssignmentScheduleSections(
  detail: UjatEducationProgressInstitutionDetail,
  sources: InstitutionAssignmentSources | null = null
): AssignmentScheduleSection[] {
  return detail.confirmedScheduleRows.map(schedule => {
    const isoDate = parseIsoDateFromScheduleId(schedule.id, detail.institutionId)
    const numericScheduleId = sources ? scheduleIdForInstitutionDate(sources, isoDate) : null
    const rows = buildRowsForSchedule(detail, isoDate, sources, numericScheduleId)
    const attendanceManagerLabel =
      sources && numericScheduleId != null
        ? attendanceManagerForScheduleFromSources(sources, numericScheduleId)
        : '미정'

    return {
      scheduleId: schedule.id,
      isoDate,
      dateDisplay: schedule.dateDisplay,
      attendanceManagerLabel,
      totalClassCount: rows.length,
      rows,
    }
  })
}
