import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listUjatInstitutionApplicationsPage, listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import {
  findUjatEducationRegionKeyByLabel,
  isUjatInstitutionApplicationRegionKey,
  listUjatEducationRegionsActive,
} from '@/features/program/ujat/lib/ujat-education-regions'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { UjatInstitutionApplicationRow } from '../../application-institution/list/types'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { buildRegionRow } from './summary-display'
import type {
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

function zeroRegionValues(): UjatEducationProgressRegionValues {
  return Object.fromEntries(
    listUjatEducationRegionsActive().map(region => [region.key, 0])
  ) as UjatEducationProgressRegionValues
}

function nullRegionValues(): UjatEducationProgressRegionValues {
  return Object.fromEntries(
    listUjatEducationRegionsActive().map(region => [region.key, null])
  ) as UjatEducationProgressRegionValues
}

function asRegionKey(value: string | null | undefined): UjatInstitutionApplicationRegionKey | null {
  const raw = value?.trim()
  if (!raw) return null
  if (isUjatInstitutionApplicationRegionKey(raw)) return raw
  const byLabel = findUjatEducationRegionKeyByLabel(raw)
  return byLabel && isUjatInstitutionApplicationRegionKey(byLabel) ? byLabel : null
}

function addCount(
  values: UjatEducationProgressRegionValues,
  regionKey: UjatInstitutionApplicationRegionKey | null,
  amount = 1
) {
  if (!regionKey || amount === 0) return
  values[regionKey] = (values[regionKey] ?? 0) + amount
}

async function listAllInstitutionRows(
  programId: string,
  query: Parameters<typeof listUjatInstitutionApplicationsPage>[2]
): Promise<UjatInstitutionApplicationRow[]> {
  const rows: UjatInstitutionApplicationRow[] = []
  let page = 0
  for (;;) {
    const result = await listUjatInstitutionApplicationsPage(programId, page, query)
    rows.push(...result.rows)
    if (!result.hasMore || page > 40) break
    page += 1
  }
  return rows
}

async function listAllApprovedVolunteers(
  programId: string,
  half: 'h1' | 'h2'
): Promise<UjatVolunteerApplicantRow[]> {
  const rows: UjatVolunteerApplicantRow[] = []
  let page = 0
  for (;;) {
    const result = await listUjatVolunteerApplicationsPage(programId, half, page, {
      finalResultStatus: 'APPROVED',
    })
    rows.push(...result.rows)
    if (!result.hasMore || page > 40) break
    page += 1
  }
  return rows
}

/** `operatingStudentCount`가 하나도 없는 지역은 null(미집계)로 둔다 */
function countInstitutions(rows: readonly UjatInstitutionApplicationRow[]) {
  const schools = zeroRegionValues()
  const classes = zeroRegionValues()
  const students = nullRegionValues()
  for (const row of rows) {
    addCount(schools, row.regionKey)
    addCount(classes, row.regionKey, row.totalClassCount ?? 0)
    if (row.regionKey && typeof row.operatingStudentCount === 'number') {
      students[row.regionKey] = (students[row.regionKey] ?? 0) + row.operatingStudentCount
    }
  }
  return { schools, classes, students }
}

function countVolunteers(rows: readonly UjatVolunteerApplicantRow[]) {
  const values = zeroRegionValues()
  for (const row of rows) {
    addCount(values, asRegionKey(row.preferredRegion))
  }
  return values
}

function emptySchoolSummary(): UjatEducationProgressSchoolSummary {
  return {
    appliedSchools: buildRegionRow(nullRegionValues()),
    semesters: [],
  }
}

function emptyVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return { rows: [] }
}

export function useUjatEducationProgressSummary(programId?: string | null) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-summary',
    'UJAT 교육 진행 요약'
  )

  const summaryQuery = useQuery({
    queryKey: [...ujatQueryKeys.all, 'education-progress-summary', programId ?? ''] as const,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const id = String(programId)
      const [applied, h1Schools, h2Schools, h1Volunteers, h2Volunteers] = await Promise.all([
        listAllInstitutionRows(id, {}),
        listAllInstitutionRows(id, { status: 'APPROVED', recruitHalf: toUjatRecruitHalfApi('h1') }),
        listAllInstitutionRows(id, { status: 'APPROVED', recruitHalf: toUjatRecruitHalfApi('h2') }),
        listAllApprovedVolunteers(id, 'h1'),
        listAllApprovedVolunteers(id, 'h2'),
      ])
      return { applied, h1Schools, h2Schools, h1Volunteers, h2Volunteers }
    },
  })

  const schoolSummary = useMemo((): UjatEducationProgressSchoolSummary => {
    if (!summaryQuery.data) return emptySchoolSummary()
    const applied = countInstitutions(summaryQuery.data.applied)
    const h1 = countInstitutions(summaryQuery.data.h1Schools)
    const h2 = countInstitutions(summaryQuery.data.h2Schools)
    return {
      appliedSchools: buildRegionRow(applied.schools),
      semesters: [
        {
          tone: 'h1',
          label: '상반기',
          metrics: {
            operating_schools: buildRegionRow(h1.schools),
            operating_classes: buildRegionRow(h1.classes),
            operating_students: buildRegionRow(h1.students),
          },
        },
        {
          tone: 'h2',
          label: '하반기',
          metrics: {
            operating_schools: buildRegionRow(h2.schools),
            operating_classes: buildRegionRow(h2.classes),
            operating_students: buildRegionRow(h2.students),
          },
        },
      ],
    }
  }, [summaryQuery.data])

  const volunteerSummary = useMemo((): UjatEducationProgressVolunteerSummary => {
    if (!summaryQuery.data) return emptyVolunteerSummary()
    const h1 = countVolunteers(summaryQuery.data.h1Volunteers)
    const h2 = countVolunteers(summaryQuery.data.h2Volunteers)
    const total = (buildRegionRow(h1).total ?? 0) + (buildRegionRow(h2).total ?? 0)
    return {
      rows: [
        { key: 'gen36_final_pass', label: '상반기 최종 합격', tone: 'h1', row: buildRegionRow(h1) },
        { key: 'gen37_final_pass', label: '하반기 최종 합격', tone: 'h2', row: buildRegionRow(h2) },
        {
          key: 'final_2026',
          label: '합계',
          tone: 'grand',
          mergedTotalOnly: true,
          row: buildRegionRow(zeroRegionValues(), total),
        },
      ],
    }
  }, [summaryQuery.data])

  return {
    schoolSummary,
    volunteerSummary,
    loading: remoteEnabled && summaryQuery.isLoading,
  }
}
