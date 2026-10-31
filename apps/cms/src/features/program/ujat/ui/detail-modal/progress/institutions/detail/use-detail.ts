/**
 * UJAT 교육 진행 · 참여 기관 상세 — Admin detail + temporary-schedule SSOT
 */

import { useMemo } from 'react'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { UjatEducationProgressInstitutionDetail } from './types'
import {
  formatUjatInstitutionFridayDisplay,
  resolveEducationSemesterForIsoDate,
} from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import {
  buildProgressConfirmedScheduleRowsFromTemporarySchedule,
  mapUjatOrganizationGuidanceNotes,
} from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/build-confirmed-detail'

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

  const remoteDetail = applicationDetail.remoteDetail

  const detail = useMemo((): UjatEducationProgressInstitutionDetail | null => {
    const row = applicationDetail.row
    const application = applicationDetail.detail
    if (!row || !application) return null

    const guidanceNotes = mapUjatOrganizationGuidanceNotes(remoteDetail)
    const confirmedScheduleRows = buildProgressConfirmedScheduleRowsFromTemporarySchedule({
      institutionId,
      half,
      temporarySchedule: applicationDetail.temporarySchedule,
      resolveHalf: isoDate => {
        const known = scheduleDates.find(entry => entry.isoDate === isoDate)
        return known?.semester ?? resolveEducationSemesterForIsoDate(isoDate)
      },
      formatDateDisplay: formatUjatInstitutionFridayDisplay,
    })

    return {
      institutionId,
      half,
      institutionName: row.institutionName,
      educationRegion: getUjatEducationRegionLabel(row.regionKey, row.regionKey),
      adminComment: '',
      applicationDetail: application,
      confirmedScheduleRows,
      guidance: {
        deviceAvailability: guidanceNotes.searchDeviceGrade6,
        waitingAreaGuide: guidanceNotes.waitingArea,
        leftoverTextbookDisposal: guidanceNotes.textbookDisposalLocation,
        parkingAndNotes: guidanceNotes.otherSpecialNotes,
        snackAvailability: guidanceNotes.snackAvailability,
        criminalRecordCheckRequest: guidanceNotes.sexOffenderCheck,
      },
    }
  }, [
    applicationDetail.detail,
    applicationDetail.temporarySchedule,
    applicationDetail.row,
    half,
    institutionId,
    remoteDetail,
    scheduleDates,
  ])

  return {
    detail,
    loading: applicationDetail.loading,
  }
}
