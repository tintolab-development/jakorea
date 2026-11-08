import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useCmsAlert } from '@/shared/ui'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import {
  invalidateUjatOrganizationApplicationLists,
  patchUjatOrganizationApplicationTempAssignmentStatus,
} from '@/features/program/ujat/api/organization-application-list-cache'
import {
  type UjatInstitutionApplicationFilters,
  EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS,
  type UjatInstitutionApplicationRow,
} from './types'
import type { UjatInstitutionApplicationRegionKey } from './regions'
import { useUjatInstitutionApplicationColumns } from './columns'
import {
  collectPreferredEducationIsoDates,
  scheduleColumnsFromIsoDates,
} from '../education-schedule'
import {
  getUjatInstitutionTempRejectCompleteContent,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
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

function applyInstitutionTempAssignmentStatus(
  queryClient: QueryClient,
  programId: string | null | undefined,
  ids: readonly string[],
  status: Parameters<typeof patchUjatOrganizationApplicationTempAssignmentStatus>[3]
) {
  const resolvedProgramId = String(programId ?? '')
  if (!resolvedProgramId || ids.length === 0) return
  patchUjatOrganizationApplicationTempAssignmentStatus(
    queryClient,
    resolvedProgramId,
    ids,
    status
  )
}
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
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

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
  const [pendingTempAction, setPendingTempAction] = useState<null | 'temp_reject' | 'temp_assign'>(
    null
  )
  const [tempActionLoading, setTempActionLoading] = useState(false)
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

  const selectedApplications = useMemo(() => {
    const selectedIds = new Set(selectedRowKeys.map(String))
    return tableData.filter(row => selectedIds.has(row.id))
  }, [tableData, selectedRowKeys])

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
    showAlert(NO_SELECTION_ALERT)
  }, [showAlert])

  const eligibleApplicationRejectRows = useMemo(
    () => selectedApplications.filter(row => row.tempAssignmentStatus !== 'application_rejected'),
    [selectedApplications]
  )

  const handleBulkApplicationReject = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (eligibleApplicationRejectRows.length === 0) {
      showAlert({
        title: '프로그램 신청 반려 안내',
        content:
          '이미 신청 반려된 기관입니다.\n신청 반려가 가능한 기관을 선택한 뒤 다시 시도해 주세요.',
      })
      return
    }
    setPendingApplicationRejectModal(true)
  }, [
    eligibleApplicationRejectRows.length,
    selectedRowKeys.length,
    showAlert,
    showNoSelectionAlert,
  ])

  const eligibleTempRejectRows = useMemo(
    () => selectedApplications.filter(row => row.tempAssignmentStatus === 'evaluation_pending'),
    [selectedApplications]
  )

  const handleBulkTempReject = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (eligibleTempRejectRows.length === 0) {
      showAlert({
        title: '임시 반려 안내',
        content:
          '평가 대기 상태의 기관만 임시 반려할 수 있습니다.\n평가 대기 기관을 선택한 뒤 다시 시도해 주세요.',
      })
      return
    }
    setPendingTempAction('temp_reject')
  }, [eligibleTempRejectRows.length, selectedRowKeys.length, showAlert, showNoSelectionAlert])

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
      applyInstitutionTempAssignmentStatus(queryClient, programId, ids, 'temp_rejected')
      setSelectedRowKeys([])
      setPendingTempAction(null)
      showAlert({
        title: UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
        content: getUjatInstitutionTempRejectCompleteContent(ids.length),
      })
      await invalidateUjatOrganizationApplicationLists(queryClient, String(programId ?? ''))
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '신청기관 임시 반려에 실패했습니다.'),
      })
    } finally {
      setTempActionLoading(false)
    }
  }, [eligibleTempRejectRows, programId, queryClient, showAlert, tempActionLoading])

  const eligibleTempAssignRows = useMemo(
    () =>
      selectedApplications.filter(
        row =>
          row.tempAssignmentStatus !== 'application_rejected' &&
          row.tempAssignmentStatus !== 'temp_rejected'
      ),
    [selectedApplications]
  )

  const handleBulkTempAssign = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showNoSelectionAlert()
      return
    }
    if (eligibleTempAssignRows.length === 0) {
      showAlert({
        title: '임시 배정 안내',
        content:
          '신청 반려·임시 반려 상태의 기관은 임시 배정할 수 없습니다.\n배정 가능한 기관을 선택한 뒤 다시 시도해 주세요.',
      })
      return
    }
    setPendingTempAction('temp_assign')
  }, [
    eligibleTempAssignRows.length,
    selectedRowKeys.length,
    showAlert,
    showNoSelectionAlert,
  ])

  const confirmBulkTempAssign = useCallback(() => {
    if (tempActionLoading) return
    setPendingTempAction(null)
  }, [tempActionLoading])

  const closeTempActionModal = useCallback(() => {
    if (tempActionLoading) return
    setPendingTempAction(null)
  }, [tempActionLoading])

  const closeApplicationRejectModal = useCallback(() => {
    setPendingApplicationRejectModal(false)
  }, [])

  const confirmApplicationRejectModal = useCallback(
    async (payload: PermissionModalPayload) => {
      const targetRows = eligibleApplicationRejectRows
      const ids = targetRows.map(row => row.id)
      const reason = payload.reason.trim()
      if (!reason) {
        showAlert({
          title: '필수 항목 미입력 안내',
          content: '반려 사유를 입력해 주세요.',
        })
        return
      }
      if (ids.length === 0) {
        showAlert({
          title: '프로그램 신청 반려 안내',
          content:
            '이미 신청 반려된 기관입니다.\n신청 반려가 가능한 기관을 선택한 뒤 다시 시도해 주세요.',
        })
        return
      }
      if (remoteEnabled) {
        try {
          const result = await bulkRejectGeneralOrganizationApplications(ids, {
            reason,
            ...toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt),
          })
          const failures = result.failures ?? []
          const failureCount = result.failureCount ?? failures.length
          const successIds = (result.successIds ?? []).map(String)
          if (failureCount > 0) {
            const lines = failures.map(failure => {
              return failure.message?.trim() || '현재 상태에서는 처리할 수 없습니다.'
            })
            showAlert({
              title: successIds.length > 0 ? '일부 처리 실패' : '처리 실패',
              content:
                lines.length > 0
                  ? lines.join('\n')
                  : `선택한 신청 중 ${failureCount}건을 처리하지 못했습니다.`,
            })
            if (successIds.length === 0) return
            applyInstitutionTempAssignmentStatus(
              queryClient,
              programId,
              successIds,
              'application_rejected'
            )
            setSelectedRowKeys([])
            setPendingApplicationRejectModal(false)
            await invalidateUjatOrganizationApplicationLists(
              queryClient,
              String(programId ?? '')
            )
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
      applyInstitutionTempAssignmentStatus(queryClient, programId, ids, 'application_rejected')
      setSelectedRowKeys([])
      setPendingApplicationRejectModal(false)
      if (remoteEnabled) {
        await invalidateUjatOrganizationApplicationLists(queryClient, String(programId ?? ''))
      }
      showAlert({
        title: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
        content: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
      })
    },
    [eligibleApplicationRejectRows, programId, queryClient, remoteEnabled, showAlert]
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
    pendingTempAction,
    tempActionLoading,
    closeTempActionModal,
    confirmBulkTempAssign,
    confirmBulkTempReject,
    eligibleTempAssignRows,
    eligibleTempRejectRows,
    eligibleApplicationRejectRows,
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
