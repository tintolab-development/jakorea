import { useCallback, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import { patchUjatInstitutionApplicationRows } from '@/features/program/ujat/model/ujat-institution-application'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import {
  type UjatInstitutionApplicationFilters,
  EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  type UjatInstitutionApplicationRow,
  type UjatInstitutionTempAssignmentStatus,
} from './types'
import type { UjatInstitutionApplicationRegionKey } from './regions'
import { useUjatInstitutionApplicationColumns } from './columns'
import {
  collectPreferredEducationIsoDates,
  scheduleColumnsFromIsoDates,
} from '../education-schedule'
import {
  getUjatInstitutionTempRejectCompleteContent,
  UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
} from './temp-assign-complete'
import { rejectUjatOrganizationApplicationsIfRemote } from '@/features/program/ujat/api/temporary-rejections'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatInstitutionApplicationsListQuery } from '@/features/program/ujat/api/applications-list-query'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildUjatRegionCapacityMaxClassMap,
  fetchUjatRegionCapacitiesRemote,
} from '@/features/program/ujat/api/region-capacities-client'

/** 필터 조건은 모두 서버 query로 보낸다. 응답이 다른 지역 코드를 섞어 보낼 때만 탭 기준으로 거른다. */
function filterRowsByRegion(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRegionKey
): UjatInstitutionApplicationRow[] {
  return rows.filter(row => row.regionKey === regionKey)
}

export function useUjatInstitutionApplicationList(
  regionKey: UjatInstitutionApplicationRegionKey,
  programId?: string | null
) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-application-institution',
    'UJAT 학교 신청'
  )

  const { showAlert } = useCmsAlert()
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] = useState<UjatInstitutionApplicationFilters>(() => ({
    ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatInstitutionApplicationFilters>(() => ({
    ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [pendingApplicationRejectModal, setPendingApplicationRejectModal] = useState(false)

  const listQuery = useMemo(
    () =>
      buildUjatInstitutionApplicationsListQuery(appliedFilters, null, {
        educationRegionCode: toUjatEducationRegionCode(regionKey),
      }),
    [appliedFilters, regionKey]
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? '', listQuery),
    queryFn: ({ pageParam }) =>
      listUjatInstitutionApplicationsPage(String(programId), pageParam, listQuery),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const regionCapacityQuery = useQuery({
    queryKey: [...ujatQueryKeys.all, 'region-capacities', programId ?? ''] as const,
    queryFn: () => fetchUjatRegionCapacitiesRemote(String(programId)),
    enabled: remoteEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const allRows = useMemo(() => {
    if (remoteEnabled) return remoteQuery.data?.pages.flatMap(page => page.rows) ?? []
    void dataVersion
    return []
  }, [dataVersion, remoteEnabled, remoteQuery.data])

  const tableData = useMemo(() => filterRowsByRegion(allRows, regionKey), [allRows, regionKey])
  const totalElements = remoteEnabled
    ? (remoteQuery.data?.pages[0]?.totalElements ?? tableData.length)
    : tableData.length
  const infiniteScrollResetKey = useMemo(
    () => `${programId ?? ''}:${regionKey}:${JSON.stringify(appliedFilters)}`,
    [appliedFilters, programId, regionKey]
  )

  const selectedApplications = useMemo(
    () => tableData.filter(row => selectedRowKeys.includes(row.id)),
    [tableData, selectedRowKeys]
  )

  const scheduleColumns = useMemo(
    () => scheduleColumnsFromIsoDates(collectPreferredEducationIsoDates(tableData)),
    [tableData]
  )
  const columns = useUjatInstitutionApplicationColumns(scheduleColumns)

  const maxClassesPerDay = useMemo(() => {
    if (remoteEnabled && regionCapacityQuery.data) {
      const map = buildUjatRegionCapacityMaxClassMap(regionCapacityQuery.data)
      if (regionKey in map) return map[regionKey]
      const byLabel = Object.entries(map).find(([key]) =>
        key.toLowerCase().includes(regionKey.toLowerCase())
      )
      if (byLabel) return byLabel[1]
    }
    return null
  }, [remoteEnabled, regionCapacityQuery.data, regionKey])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    const raw = String(value ?? '')
    const next = key === 'totalClassCount' ? raw.replace(/\D/g, '') : raw
    setPendingFilters(prev => ({ ...prev, [key]: next }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
    setSelectedRowKeys([])
  }, [pendingFilters])

  const showNoSelectionAlert = useCallback(() => {
    showAlert({
      title: '항목 선택 안내',
      content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
    })
  }, [showAlert])

  const patchSelectedStatus = useCallback(
    (status: UjatInstitutionTempAssignmentStatus) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) {
        showNoSelectionAlert()
        return
      }
      patchUjatInstitutionApplicationRows(ids, status)
      setDataVersion(v => v + 1)
      setSelectedRowKeys([])
    },
    [selectedRowKeys, showNoSelectionAlert]
  )

  const handleBulkApplicationReject = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    setPendingApplicationRejectModal(true)
  }, [selectedRowKeys.length, showNoSelectionAlert])

  const handleBulkTempReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) {
      showNoSelectionAlert()
      return
    }
    void (async () => {
      try {
        await rejectUjatOrganizationApplicationsIfRemote({
          programId,
          applicationIds: ids,
          reason: 'CMS UJAT 신청기관 임시 반려',
        })
        patchUjatInstitutionApplicationRows(ids, 'temp_rejected')
        setDataVersion(v => v + 1)
        setSelectedRowKeys([])
        showAlert({
          title: UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
          content: getUjatInstitutionTempRejectCompleteContent(ids.length),
        })
      } catch (error) {
        showAlert({
          title: '안내',
          content: error instanceof Error ? error.message : '신청기관 임시 반려에 실패했습니다.',
        })
      }
    })()
  }, [programId, selectedRowKeys, showNoSelectionAlert, showAlert])

  const handleBulkTempAssign = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    showAlert({
      title: '임시 일정 배정',
      content:
        '선택한 기관의 임시 일정은 신청 기관 임시 배정 화면에서 지역·일정·학급을 저장해야 합니다. 이 단계에서는 최종 승인되지 않습니다.',
    })
  }, [selectedRowKeys.length, showNoSelectionAlert, showAlert])

  const closeApplicationRejectModal = useCallback(() => {
    setPendingApplicationRejectModal(false)
  }, [])

  const confirmApplicationRejectModal = useCallback(() => {
    patchSelectedStatus('application_rejected')
    setPendingApplicationRejectModal(false)
  }, [patchSelectedStatus])

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setSelectedRowKeys([])
    setViewMode('table')
  }, [])

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1)
  }, [])

  return {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    totalElements,
    columns,
    scheduleColumnCount: scheduleColumns.length,
    selectedRowKeys,
    setSelectedRowKeys,
    viewMode,
    setViewMode,
    maxClassesPerDay,
    handleBulkApplicationReject,
    handleBulkTempReject,
    handleBulkTempAssign,
    pendingApplicationRejectModal,
    closeApplicationRejectModal,
    confirmApplicationRejectModal,
    selectedApplications,
    resetRegionState,
    refreshData,
    fetchNextPage: remoteQuery.fetchNextPage,
    hasNextPage: remoteQuery.hasNextPage,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    infiniteScrollResetKey,
  }
}
