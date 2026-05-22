import { getUjatInstitutionApplicationRowById } from '@/data/mock/ujat-institution-application-mock'
import { parseGradeClassSectionValue } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import { getUjatScheduleAssignRegionState } from '../../../application-institution/schedule-assign/store'
import { UJAT_ELEMENTARY_TEXTBOOK_BY_GRADE } from './ujat-education-progress-institution-textbook'
import {
  getAttendanceManagerForSchedule,
  getVolunteersForClass,
} from './ujat-education-progress-assignment-mock'
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

function findStudentCount(
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>,
  gradeLabel: string,
  classNo: number
): number {
  const block = gradeBlocks.find(item => item.gradeLabel === gradeLabel)
  const classRow = block?.classes.find(item => item.classNo === classNo)
  return classRow?.studentCount ?? 0
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
  isoDate: string
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
    const studentCount = findStudentCount(gradeBlocks, section.gradeLabel, section.classNo)
    const volunteers = getVolunteersForClass(
      detail.institutionId,
      isoDate,
      section.gradeLabel,
      section.classNo
    )

    return {
      gradeLabel: section.gradeLabel,
      classNo: section.classNo,
      classLabel: `${section.classNo}반`,
      gradeRowSpan: 0,
      volunteerA: volunteers.volunteerA,
      volunteerB: volunteers.volunteerB,
      textbookName: UJAT_ELEMENTARY_TEXTBOOK_BY_GRADE[section.gradeLabel] ?? '-',
      textbookQuantityLabel: studentCount > 0 ? `${studentCount}권` : '-',
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
  detail: UjatEducationProgressInstitutionDetail
): AssignmentScheduleSection[] {
  return detail.confirmedScheduleRows.map(schedule => {
    const isoDate = parseIsoDateFromScheduleId(schedule.id, detail.institutionId)
    const rows = buildRowsForSchedule(detail, isoDate)
    const manager = getAttendanceManagerForSchedule(detail.institutionId, isoDate)

    return {
      scheduleId: schedule.id,
      isoDate,
      dateDisplay: schedule.dateDisplay,
      attendanceManagerLabel: manager ?? '미정',
      totalClassCount: rows.length,
      rows,
    }
  })
}
