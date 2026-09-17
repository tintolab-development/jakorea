/**
 * UJAT 교육 진행 · 참여 기관 상세 — 승인 기관 신청 목록에서 hydrate
 */

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { getUjatInstitutionApplicationDetail } from '@/features/program/ujat/model/ujat-institution-application'
import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import {
  getUjatEducationProgressInstitutionDetail,
} from './institution-detail-data'
import type {
  UjatEducationProgressInstitutionConfirmedScheduleRow,
  UjatEducationProgressInstitutionDetail,
} from './types'
import {
  UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES,
  formatUjatInstitutionFridayDisplay,
  resolveEducationSemesterForIsoDate,
} from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
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

export function useUjatEducationProgressInstitutionDetail(input: {
  programId: string
  half: EducationProgressHalfKey
  institutionId: string
}) {
  const { programId, half, institutionId } = input
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      ...ujatQueryKeys.organizationApplications(programId, { status: 'APPROVED' }),
      'edu-progress-detail',
    ] as const,
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(programId, pageParam, { status: 'APPROVED' }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && Boolean(institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const detail = useMemo((): UjatEducationProgressInstitutionDetail | null => {
    if (remoteEnabled) {
      const rows = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
      const row = rows.find(item => item.id === institutionId)
      if (!row) return null
      return {
        institutionId,
        half,
        institutionName: row.institutionName,
        educationRegion: getUjatEducationRegionLabel(row.regionKey, row.regionKey),
        adminComment: '',
        applicationDetail: getUjatInstitutionApplicationDetail(row),
        confirmedScheduleRows: buildConfirmedEducationScheduleRows(
          institutionId,
          row.regionKey,
          half
        ),
        guidance: { ...DEFAULT_GUIDANCE },
      }
    }
    return getUjatEducationProgressInstitutionDetail(programId, half, institutionId)
  }, [half, institutionId, programId, remoteEnabled, remoteQuery.data])

  return {
    detail,
    loading: remoteEnabled ? remoteQuery.isLoading || remoteQuery.isFetching : false,
  }
}
