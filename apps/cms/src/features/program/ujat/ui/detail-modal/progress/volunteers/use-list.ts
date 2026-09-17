import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { EducationProgressHalfKey } from '../tabs'
import { UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL } from './filter-fields'
import { useUjatEducationProgressVolunteerColumns } from './columns'
import {
  buildUjatEducationProgressVolunteerRowFromMember,
  fetchUjatEducationProgressVolunteerMemberCandidates,
} from './members'
import {
  EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS,
  UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS,
  type UjatEducationProgressVolunteerFilters,
  type UjatEducationProgressVolunteerGrade,
  type UjatEducationProgressVolunteerMemberCandidate,
  type UjatEducationProgressVolunteerRow,
} from './types'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { getUjatEducationRegionLabel, findUjatEducationRegionKeyByLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

function filterRows(
  rows: UjatEducationProgressVolunteerRow[],
  filters: UjatEducationProgressVolunteerFilters
): UjatEducationProgressVolunteerRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()

  return rows.filter(row => {
    if (nameQ && !row.volunteerName.toLowerCase().includes(nameQ)) return false
    if (filters.grade !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL && row.grade !== filters.grade) {
      return false
    }
    if (
      filters.regionKey !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL &&
      row.regionKey !== filters.regionKey
    ) {
      return false
    }
    if (
      filters.assignmentStatus !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL &&
      row.assignmentStatus !== filters.assignmentStatus
    ) {
      return false
    }
    return true
  })
}

function recruitHalfFromProgress(half: EducationProgressHalfKey): UjatVolunteerRecruitHalf {
  return half === 'h2' ? 'h2' : 'h1'
}

function mapGrade(grade: string): UjatEducationProgressVolunteerGrade {
  return (UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS as readonly string[]).includes(grade)
    ? (grade as UjatEducationProgressVolunteerGrade)
    : '1학년'
}

function mapRegionKey(preferredRegion: string): UjatInstitutionApplicationRegionKey {
  const trimmed = preferredRegion.trim()
  const byLabel = findUjatEducationRegionKeyByLabel(trimmed)
  return (byLabel ?? (trimmed || '서울')) as UjatInstitutionApplicationRegionKey
}

function mapApplicantToProgressVolunteer(
  row: UjatVolunteerApplicantRow,
  index: number
): UjatEducationProgressVolunteerRow {
  const regionKey = mapRegionKey(row.preferredRegion)
  const withdrawn = row.interviewAssignmentStatus === 'withdrawn'
  const completed =
    row.secondInterviewScreeningStatus === 'pass' ||
    row.secondInterviewScreeningStatus === 'completed'

  return {
    id: row.id,
    no: index + 1,
    volunteerName: row.name,
    grade: mapGrade(row.grade),
    regionKey,
    regionLabel: getUjatEducationRegionLabel(regionKey, regionKey),
    mobile: row.contact,
    email: row.email,
    totalAssignmentDays: null,
    assignmentStatus: withdrawn
      ? 'activity_abandoned'
      : completed
        ? 'assignment_completed'
        : 'assignment_waiting',
  }
}

export function useUjatEducationProgressVolunteers(
  programId: string,
  half: EducationProgressHalfKey
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-volunteers',
    'UJAT 진행 현황 · 봉사자'
  )

  const recruitHalf = recruitHalfFromProgress(half)

  const [pendingFilters, setPendingFilters] = useState<UjatEducationProgressVolunteerFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatEducationProgressVolunteerFilters>(
    () => ({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [localRows, setLocalRows] = useState<UjatEducationProgressVolunteerRow[]>([])
  const [memberOptions, setMemberOptions] = useState<UjatEducationProgressVolunteerMemberCandidate[]>(
    []
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      ...ujatQueryKeys.volunteerApplications(programId, recruitHalf, 'interview2', {
        finalResultStatus: 'APPROVED',
      }),
      'edu-progress',
    ] as const,
    queryFn: ({ pageParam }) =>
      listUjatVolunteerApplicationsPage(programId, recruitHalf, pageParam, {
        finalResultStatus: 'APPROVED',
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const remoteRows = useMemo(() => {
    const source = remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
    return source.map((row, index) => mapApplicantToProgressVolunteer(row, index))
  }, [remoteQuery.data])

  const allRows = useMemo(() => {
    if (!remoteEnabled) return localRows
    const remoteIds = new Set(remoteRows.map(r => r.id))
    const extras = localRows.filter(r => !remoteIds.has(r.id))
    return [...remoteRows, ...extras]
  }, [localRows, remoteEnabled, remoteRows])

  const registeredVolunteerNames = useMemo(
    () => allRows.map(r => r.volunteerName),
    [allRows]
  )

  useEffect(() => {
    let cancelled = false
    void fetchUjatEducationProgressVolunteerMemberCandidates(registeredVolunteerNames).then(
      options => {
        if (!cancelled) setMemberOptions(options)
      }
    )
    return () => {
      cancelled = true
    }
  }, [registeredVolunteerNames])

  const tableData = useMemo(
    () => filterRows(allRows, appliedFilters),
    [allRows, appliedFilters]
  )

  const columns = useUjatEducationProgressVolunteerColumns()

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const resetHalfState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS })
    setSelectedRowKeys([])
    setLocalRows([])
  }, [])

  const addVolunteerFromMember = useCallback(
    async (memberId: string) => {
      const nextNo = allRows.length > 0 ? Math.max(...allRows.map(r => r.no)) + 1 : 1
      const row = await buildUjatEducationProgressVolunteerRowFromMember(half, memberId, nextNo)
      if (!row) return
      if (allRows.some(r => r.id === row.id || r.volunteerName === row.volunteerName)) return
      setLocalRows(prev => [row, ...prev])
    },
    [allRows, half]
  )

  const syncRowsFromMock = useCallback(() => {
    setLocalRows([])
  }, [])

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    resetHalfState,
    memberOptions,
    addVolunteerFromMember,
    syncRowsFromMock,
  }
}
