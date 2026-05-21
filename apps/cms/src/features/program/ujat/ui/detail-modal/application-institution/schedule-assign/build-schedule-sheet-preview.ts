import { getUjatInstitutionApplicationMockRows } from '@/data/mock/ujat-institution-application-mock'
import {
  UJAT_INSTITUTION_APPLICATION_REGIONS,
  type UjatInstitutionApplicationRegionKey,
} from '../list/regions'
import type { UjatInstitutionApplicationRow } from '../list/types'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '../education-schedule'
import { formatAssignedGradeClassesDisplay } from './format-assigned-grade-classes'
import { getUjatScheduleAssignRegionState } from './store'

export type ScheduleSheetPreviewColumn = {
  isoDate: string
  dateTitle: string
  institutionName: string
  gradeClassLines: string[]
  totalClassCount: number
}

export type ScheduleSheetPreviewRegion = {
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  columns: ScheduleSheetPreviewColumn[]
}

const EMPTY_PLACEHOLDER = '-'

function createEmptyDateColumn(isoDate: string, dateTitle: string): ScheduleSheetPreviewColumn {
  return {
    isoDate,
    dateTitle,
    institutionName: EMPTY_PLACEHOLDER,
    gradeClassLines: [],
    totalClassCount: 0,
  }
}

export function buildScheduleSheetPreview(
  applicationRows: readonly UjatInstitutionApplicationRow[] = getUjatInstitutionApplicationMockRows()
): ScheduleSheetPreviewRegion[] {
  const rowById = new Map(applicationRows.map(row => [row.id, row]))

  return UJAT_INSTITUTION_APPLICATION_REGIONS.map(region => {
    const state = getUjatScheduleAssignRegionState(region.key)
    const columns: ScheduleSheetPreviewColumn[] = []

    for (const { isoDate, title } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
      const day = state.days[isoDate]
      const assignmentEntries: ScheduleSheetPreviewColumn[] = []

      if (day) {
        for (const assignRow of day.rows) {
          if (assignRow.institutionRowId == null) continue
          const institution = rowById.get(assignRow.institutionRowId)
          if (!institution) continue

          assignmentEntries.push({
            isoDate,
            dateTitle: title,
            institutionName: institution.institutionName,
            gradeClassLines: formatAssignedGradeClassesDisplay(
              assignRow.gradeValues,
              institution.gradeClassCounts
            ),
            totalClassCount: assignRow.gradeValues.length,
          })
        }
      }

      if (assignmentEntries.length === 0) {
        columns.push(createEmptyDateColumn(isoDate, title))
      } else {
        columns.push(...assignmentEntries)
      }
    }

    return {
      regionKey: region.key,
      regionLabel: region.label,
      columns,
    }
  })
}

export { EMPTY_PLACEHOLDER as SCHEDULE_SHEET_EMPTY_PLACEHOLDER }
