import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  cancelUjatOrganizationTemporaryRejectionsIfRemote,
  rejectUjatOrganizationApplicationsIfRemote,
} from '@/features/program/ujat/api/temporary-rejections'
import { removeUjatScheduleAssignInstitutionRows } from '../schedule-assign/store'
import { buildUjatTempReleaseResultAlert, releaseUjatTemporarySchedules } from './temp-release'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatInstitutionApplicationsListQuery } from '@/features/program/ujat/api/applications-list-query'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  buildUjatRegionCapacityMaxClassMap,
  fetchUjatRegionCapacitiesRemote,
} from '@/features/program/ujat/api/region-capacities-client'
import {
  applyUjatInstitutionApplicationViewMode,
  parseUjatInstitutionApplicationViewMode,
  parseUjatInstitutionCalendarDateParam,
  resolveUjatInstitutionCalendarFocusIso,
} from './calendar-query'
import { UJAT_INSTITUTION_CALENDAR_DATE_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { bulkRejectGeneralOrganizationApplications } from '@/features/program/general/api/admin-applications-service'
import { toTimedBulkNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [dataVersion, setDataVersion] = useState(0)
  const [pendingFilters, setPendingFilters] = useState<UjatInstitutionApplicationFilters>(() => ({
    ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatInstitutionApplicationFilters>(() => ({
    ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const viewMode = parseUjatInstitutionApplicationViewMode(searchParams)
  const [pendingApplicationRejectModal, setPendingApplicationRejectModal] = useState(false)
  const [pendingTempAction, setPendingTempAction] = useState<
    null | 'temp_reject' | 'temp_assign_cancel' | 'temp_reject_cancel'
  >(null)
  const [tempActionLoading, setTempActionLoading] = useState(false)
  const [tempReleasing, setTempReleasing] = useState(false)
  const queryClient = useQueryClient()

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

  useEffect(() => {
    if (viewMode !== 'calendar' || !remoteEnabled) return
    if (!remoteQuery.hasNextPage || remoteQuery.isFetchingNextPage) return
    void remoteQuery.fetchNextPage()
  }, [
    viewMode,
    remoteEnabled,
    remoteQuery.hasNextPage,
    remoteQuery.isFetchingNextPage,
    remoteQuery.dataUpdatedAt,
    remoteQuery.fetchNextPage,
  ])
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

  const setViewMode = useCallback(
    (mode: 'table' | 'calendar') => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          const calendarIso =
            mode === 'calendar'
              ? resolveUjatInstitutionCalendarFocusIso(
                  parseUjatInstitutionCalendarDateParam(
                    next.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
                  ),
                  collectPreferredEducationIsoDates(tableData)
                )
              : null
          applyUjatInstitutionApplicationViewMode(next, mode, calendarIso)
          return next.toString() === prev.toString() ? prev : next
        },
        { replace: true }
      )
    },
    [setSearchParams, tableData]
  )

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

  const eligibleTempRejectRows = useMemo(
    () => selectedApplications.filter(row => row.tempAssignmentStatus === 'evaluation_pending'),
    [selectedApplications]
  )
  const eligibleTempAssignCancelRows = useMemo(
    () => selectedApplications.filter(row => row.tempAssignmentStatus === 'temp_assigned'),
    [selectedApplications]
  )
  const eligibleTempRejectCancelRows = useMemo(
    () => selectedApplications.filter(row => row.tempAssignmentStatus === 'temp_rejected'),
    [selectedApplications]
  )

  const handleBulkTempReject = useCallback(() => {
    if (selectedRowKeys.length === 0 || eligibleTempRejectRows.length === 0) {
      showNoSelectionAlert()
      return
    }
    setPendingTempAction('temp_reject')
  }, [eligibleTempRejectRows.length, selectedRowKeys.length, showNoSelectionAlert])

  const confirmBulkTempReject = useCallback(async () => {
    const rows = eligibleTempRejectRows
    const ids = rows.map(row => row.id)
    if (ids.length === 0 || tempActionLoading) return
    setTempActionLoading(true)
    try {
      const persisted = await rejectUjatOrganizationApplicationsIfRemote({
        programId,
        applicationIds: ids,
      })
      if (!persisted) {
        showAlert({
          title: '안내',
          content: '원격 API가 비활성 상태라 임시 반려를 반영하지 않았습니다.',
        })
        return
      }
      patchUjatInstitutionApplicationRows(ids, 'temp_rejected')
      setDataVersion(v => v + 1)
      setSelectedRowKeys([])
      setPendingTempAction(null)
      showAlert({
        title: UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
        content: getUjatInstitutionTempRejectCompleteContent(ids.length),
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(String(programId ?? '')),
      })
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '신청기관 임시 반려에 실패했습니다.'),
      })
    } finally {
      setTempActionLoading(false)
    }
  }, [eligibleTempRejectRows, programId, queryClient, showAlert, tempActionLoading])

  const handleBulkTempAssign = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return false
    }
    const assignable = selectedApplications.filter(
      row =>
        row.tempAssignmentStatus !== 'application_rejected' &&
        row.tempAssignmentStatus !== 'temp_rejected'
    )
    if (assignable.length === 0) {
      showNoSelectionAlert()
      return false
    }
    return true
  }, [selectedApplications, selectedRowKeys.length, showNoSelectionAlert])

  const handleBulkTempRelease = useCallback(() => {
    if (selectedRowKeys.length === 0 || eligibleTempAssignCancelRows.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (!remoteEnabled || !programId) {
      showAlert({ title: '안내', content: '원격 API가 비활성 상태라 임시 배정을 해제할 수 없습니다.' })
      return
    }
    setPendingTempAction('temp_assign_cancel')
  }, [
    eligibleTempAssignCancelRows.length,
    programId,
    remoteEnabled,
    selectedRowKeys.length,
    showAlert,
    showNoSelectionAlert,
  ])

  const handleBulkTempRejectCancel = useCallback(() => {
    if (selectedRowKeys.length === 0 || eligibleTempRejectCancelRows.length === 0) {
      showNoSelectionAlert()
      return
    }
    setPendingTempAction('temp_reject_cancel')
  }, [eligibleTempRejectCancelRows.length, selectedRowKeys.length, showNoSelectionAlert])

  const closeTempActionModal = useCallback(() => {
    if (tempActionLoading || tempReleasing) return
    setPendingTempAction(null)
  }, [tempActionLoading, tempReleasing])

  const confirmBulkTempRejectCancel = useCallback(async () => {
    const rows = eligibleTempRejectCancelRows
    const ids = rows.map(row => row.id)
    if (ids.length === 0 || tempActionLoading) return
    setTempActionLoading(true)
    try {
      const persisted = await cancelUjatOrganizationTemporaryRejectionsIfRemote({
        programId,
        applicationIds: ids,
      })
      if (!persisted) {
        showAlert({
          title: '안내',
          content: '원격 API가 비활성 상태라 임시 반려를 취소하지 않았습니다.',
        })
        return
      }
      setSelectedRowKeys([])
      setPendingTempAction(null)
      showAlert({
        title: '안내',
        content:
          ids.length === 1
            ? '임시 반려가 취소되었습니다. 목록 상태를 새로고침합니다.'
            : `${ids.length}개 기관의 임시 반려가 취소되었습니다. 목록 상태를 새로고침합니다.`,
      })
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(String(programId ?? '')),
      })
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '신청기관 임시 반려 취소에 실패했습니다.'),
      })
    } finally {
      setTempActionLoading(false)
    }
  }, [eligibleTempRejectCancelRows, programId, queryClient, showAlert, tempActionLoading])

  const confirmTempRelease = useCallback(async () => {
    if (!programId) return
    const targets = eligibleTempAssignCancelRows.map(row => ({
      id: row.id,
      name: row.institutionName,
    }))
    setTempReleasing(true)
    setTempActionLoading(true)
    try {
      const results = await releaseUjatTemporarySchedules(String(programId), targets)
      const succeeded = results.filter(item => item.ok)
      removeUjatScheduleAssignInstitutionRows(succeeded.map(item => item.id))
      if (succeeded.length > 0) {
        patchUjatInstitutionApplicationRows(
          succeeded.map(item => item.id),
          'evaluation_pending'
        )
        setDataVersion(v => v + 1)
      }
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplicationsRoot(String(programId)),
      })
      setSelectedRowKeys([])
      setPendingTempAction(null)
      const failed = results.filter(item => !item.ok)
      if (failed.length === 0) {
        showAlert({
          title: '안내',
          content:
            succeeded.length === 1
              ? '임시 배정이 취소되어 평가 대기로 돌아갔습니다.'
              : `${succeeded.length}개 기관의 임시 배정이 취소되어 평가 대기로 돌아갔습니다.`,
        })
        return
      }
      showAlert(buildUjatTempReleaseResultAlert(results))
    } finally {
      setTempReleasing(false)
      setTempActionLoading(false)
    }
  }, [eligibleTempAssignCancelRows, programId, queryClient, showAlert])

  const closeApplicationRejectModal = useCallback(() => {
    setPendingApplicationRejectModal(false)
  }, [])

  const confirmApplicationRejectModal = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedApplications.map(row => row.id)
      if (remoteEnabled) {
        try {
          const result = await bulkRejectGeneralOrganizationApplications(ids, {
            reason: payload.reason.trim() || 'CMS UJAT 신청기관 신청 반려',
            ...toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt),
          })
          if ((result.failureCount ?? 0) > 0) {
            showAlert({
              title: '처리 실패',
              content: `선택한 신청 중 ${result.failureCount}건을 처리하지 못했습니다.`,
            })
            return
          }
        } catch (error) {
          showAlert({
            title: '안내',
            content:
              getNotificationTimingApiErrorMessage(error) ??
              (error instanceof Error ? error.message : '신청기관 반려에 실패했습니다.'),
          })
          return
        }
      }
      patchSelectedStatus('application_rejected')
      setPendingApplicationRejectModal(false)
    },
    [patchSelectedStatus, remoteEnabled, selectedApplications, showAlert]
  )

  const resetRegionState = useCallback(() => {
    setPendingFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setAppliedFilters({ ...EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS })
    setSelectedRowKeys([])
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
    handleBulkTempRelease,
    handleBulkTempRejectCancel,
    pendingTempAction,
    tempActionLoading,
    closeTempActionModal,
    confirmBulkTempReject,
    confirmBulkTempRejectCancel,
    eligibleTempRejectRows,
    eligibleTempAssignCancelRows,
    eligibleTempRejectCancelRows,
    tempReleasing,
    confirmTempRelease,
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
    isListPending: remoteEnabled && remoteQuery.isPending,
  }
}
