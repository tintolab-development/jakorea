import { useCallback, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { EducationProgressHalfKey } from '../tabs'
import { UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL } from './filter-fields'
import { useUjatEducationProgressVolunteerColumns } from './columns'
import { fetchUjatEducationProgressVolunteerMemberCandidates } from './members'
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
import {
  getUjatEducationRegionLabel,
  findUjatEducationRegionKeyByLabel,
  findUjatEducationRegionKeyByCode,
} from '@/features/program/ujat/lib/ujat-education-regions'
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

function mapGrade(grade: string): UjatEducationProgressVolunteerGrade | '' {
  return (UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS as readonly string[]).includes(grade)
    ? (grade as UjatEducationProgressVolunteerGrade)
    : ''
}

function mapRegionKey(row: UjatVolunteerApplicantRow): UjatInstitutionApplicationRegionKey {
  const code = row.preferredRegionCode?.trim()
  if (code) return findUjatEducationRegionKeyByCode(code) ?? code
  return findUjatEducationRegionKeyByLabel(row.preferredRegion) ?? ''
}

function mapApplicantToProgressVolunteer(
  row: UjatVolunteerApplicantRow,
  index: number
): UjatEducationProgressVolunteerRow {
  const regionKey = mapRegionKey(row)
  const withdrawn = row.interviewAssignmentStatus === 'withdrawn'
  const totalAssignedDays =
    typeof row.totalAssignedDays === 'number' ? row.totalAssignedDays : null
  // 교육 배정 현황 = 실제 배정일 수 (면접 합격≠배정 완료). CMS 추가등록 PASS도 배정 0이면 대기.
  const hasAssignment = (totalAssignedDays ?? 0) > 0

  return {
    id: row.id,
    no: index + 1,
    volunteerName: row.name,
    grade: mapGrade(row.grade),
    regionKey,
    regionLabel: regionKey ? getUjatEducationRegionLabel(regionKey, regionKey) : '-',
    mobile: row.contact,
    email: row.email,
    memberId: row.memberId,
    birthDate: row.birthDate,
    id1365: row.id1365,
    totalAssignedDays,
    assignmentStatus: withdrawn
      ? 'activity_abandoned'
      : hasAssignment
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
  const queryClient = useQueryClient()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [memberOptions, setMemberOptions] = useState<UjatEducationProgressVolunteerMemberCandidate[]>(
    []
  )

  const listQuery = useMemo(() => {
    const keyword = appliedFilters.volunteerName.trim() || undefined
    const preferredRegion =
      appliedFilters.regionKey !== UJAT_EDU_PROGRESS_VOLUNTEER_FILTER_ALL
        ? appliedFilters.regionKey.trim()
        : ''
    // BE VolunteerFinalResult = PASS|FAIL|RESERVE (APPROVED 별칭은 이 목록에서 빈 결과)
    return {
      finalResultStatus: 'PASS' as const,
      ...(keyword ? { keyword } : {}),
      ...(preferredRegion ? { preferredRegion } : {}),
    }
  }, [appliedFilters.regionKey, appliedFilters.volunteerName])

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      ...ujatQueryKeys.volunteerApplications(programId, recruitHalf, 'interview2', listQuery),
      'edu-progress',
    ] as const,
    queryFn: ({ pageParam }) =>
      listUjatVolunteerApplicationsPage(programId, recruitHalf, pageParam, listQuery),
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

  const allRows = useMemo(() => (remoteEnabled ? remoteRows : []), [remoteEnabled, remoteRows])

  const loadMemberOptions = useCallback(async () => {
    const excludedIds = allRows
      .map(r => r.memberId?.trim())
      .filter((id): id is string => Boolean(id))
    const options = await fetchUjatEducationProgressVolunteerMemberCandidates(
      programId,
      excludedIds
    )
    setMemberOptions(options)
    return options
  }, [allRows, programId])

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
  }, [])

  const addVolunteerFromMember = useCallback(
    async (_memberId: string) => {
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.volunteerApplicationsRoot(programId),
      })
    },
    [programId, queryClient]
  )

  const refreshVolunteerList = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.volunteerApplicationsRoot(programId),
    })
  }, [programId, queryClient])

  return {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    resetHalfState,
    memberOptions,
    loadMemberOptions,
    addVolunteerFromMember,
    refreshVolunteerList,
  }
}
