/**
 * UJAT 교육 진행 · 참여 기관 상세 — 승인 기관 신청 목록에서 hydrate
 */

import { useMemo } from 'react'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type {
  UjatEducationProgressInstitutionConfirmedScheduleRow,
  UjatEducationProgressInstitutionDetail,
} from './types'
import {
  formatUjatInstitutionFridayDisplay,
  resolveEducationSemesterForIsoDate,
  type UjatInstitutionScheduleAssignDateEntry,
} from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import { getUjatScheduleAssignRegionState } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-assign/store'
import {
  formatGradeClassSectionLabel,
  parseGradeClassSectionValue,
} from '@/features/program/ujat/ui/detail-modal/application-institution/list/grade-class-sections'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'

const DEFAULT_GUIDANCE = {
  deviceAvailability: '-',
  waitingAreaGuide: '-',
  leftoverTextbookDisposal: '-',
  parkingAndNotes: '-',
  snackAvailability: '-',
  criminalRecordCheckRequest: '-',
} as const

function buildConfirmedEducationScheduleRows(
  institutionId: string,
  regionKey: UjatInstitutionApplicationRegionKey,
  half: EducationProgressHalfKey,
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[]
): UjatEducationProgressInstitutionConfirmedScheduleRow[] {
  const state = getUjatScheduleAssignRegionState(regionKey)
  const rows: UjatEducationProgressInstitutionConfirmedScheduleRow[] = []

  for (const isoDate of Object.keys(state.days).sort()) {
    const known = scheduleDates.find(entry => entry.isoDate === isoDate)
    const semester = known?.semester ?? resolveEducationSemesterForIsoDate(isoDate)
    if (semester !== half) continue
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

export function useUjatEducationProgressInstitutionDetail(input: {
  programId: string
  half: EducationProgressHalfKey
  institutionId: string
}) {
  const { programId, half, institutionId } = input
  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const applicationDetail = useUjatInstitutionApplicationDetail({
    institutionId,
    programId,
  })

  const detail = useMemo((): UjatEducationProgressInstitutionDetail | null => {
    const row = applicationDetail.row
    const application = applicationDetail.detail
    if (!row || !application) return null
    return {
      institutionId,
      half,
      institutionName: row.institutionName,
      educationRegion: getUjatEducationRegionLabel(row.regionKey, row.regionKey),
      adminComment: '',
      applicationDetail: application,
      confirmedScheduleRows: buildConfirmedEducationScheduleRows(
        institutionId,
        row.regionKey,
        half,
        scheduleDates
      ),
      guidance: { ...DEFAULT_GUIDANCE },
    }
  }, [applicationDetail.detail, applicationDetail.row, half, institutionId, scheduleDates])

  return {
    detail,
    loading: applicationDetail.loading,
  }
}
