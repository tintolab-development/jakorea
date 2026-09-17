import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationRowById,
} from '@/features/program/ujat/model/ujat-institution-application'
import { formatUjatInstitutionFridayDisplay } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { formatGradeClassSectionLabel } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { getUjatScheduleAssignRegionState } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/store'
import { parseGradeClassSectionValue } from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import { resolveEducationSemesterForIsoDate } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatEducationProgressInstitutionConfirmedScheduleRow,
  UjatEducationProgressInstitutionDetail,
  UjatEducationProgressInstitutionGuidance,
} from './types'

const DEFAULT_GUIDANCE: UjatEducationProgressInstitutionGuidance = {
  deviceAvailability: '-',
  waitingAreaGuide: '-',
  leftoverTextbookDisposal: '-',
  parkingAndNotes: '-',
  snackAvailability: '-',
  criminalRecordCheckRequest: '-',
}

function regionLabel(regionKey: UjatInstitutionApplicationRegionKey): string {
  return getUjatEducationRegionLabel(regionKey, regionKey)
}

function buildConfirmedEducationScheduleRows(
  institutionId: string,
  regionKey: UjatInstitutionApplicationRegionKey,
  half: EducationProgressHalfKey
): UjatEducationProgressInstitutionConfirmedScheduleRow[] {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const rows: UjatEducationProgressInstitutionConfirmedScheduleRow[] = []

  for (const { isoDate } of UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES) {
    if (resolveEducationSemesterForIsoDate(isoDate) !== half) continue
    const day = state.days[isoDate]
    if (!day) continue

    const classLabels: string[] = []
    for (const assignRow of day.rows) {
      if (assignRow.institutionRowId !== institutionId) continue
      for (const value of assignRow.gradeValues) {
        const parsed = parseGradeClassSectionValue(value)
        if (!parsed) continue
        classLabels.push(formatGradeClassSectionLabel(parsed))
      }
    }

    if (classLabels.length === 0) continue

    rows.push({
      id: `${institutionId}-${isoDate}`,
      dateDisplay: formatUjatInstitutionFridayDisplay(isoDate),
      classLabels,
    })
  }

  return rows
}

export function getUjatEducationProgressInstitutionDetail(
  _programId: string,
  half: EducationProgressHalfKey,
  institutionId: string
): UjatEducationProgressInstitutionDetail | null {
  const row = getUjatInstitutionApplicationRowById(institutionId)
  if (!row) return null

  const applicationDetail = getUjatInstitutionApplicationDetail(row)
  const guidance = DEFAULT_GUIDANCE

  return {
    institutionId,
    half,
    institutionName: row.institutionName,
    educationRegion: regionLabel(row.regionKey),
    adminComment: '',
    applicationDetail,
    confirmedScheduleRows: buildConfirmedEducationScheduleRows(
      institutionId,
      row.regionKey,
      half
    ),
    guidance,
  }
}

export function getUjatEducationProgressInstitutionName(
  institutionId: string
): string | null {
  return getUjatInstitutionApplicationRowById(institutionId)?.institutionName ?? null
}
