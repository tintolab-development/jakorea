import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import {
  patchUjatVolunteerInterviewEvaluation,
  patchUjatVolunteerSecondInterviewScreeningStatus,
  type UjatVolunteerApplicantRow,
  type UjatVolunteerInterviewEvaluationPayload,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatVolunteerInterview2ListQuery } from '@/features/program/ujat/api/applications-list-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  giveUpUjatVolunteerApplicationRemote,
  submitUjatVolunteerFinalResultsRemote,
} from '@/features/program/ujat/api/volunteer-mutations'
import type {
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL,
  type UjatVolunteerInterview2Filters,
} from './filter-fields'
import { useUjatVolunteerInterview2Columns } from './columns'
import { mapUjatVolunteerAssignedInterviewToCalendarEvents } from '../shared/assigned-interview-calendar-events'
import type { UjatInterview2ConfirmRequest } from './actions'
import {
  confirmUjatVolunteerInterview2Fail,
  confirmUjatVolunteerInterview2Pass,
  openUjatVolunteerInterview2BulkPassModal,
} from './actions'
import type { UjatInterview2BulkPassConfirmPayload } from './bulk-pass-modal'
import {
  guardUjatVolunteerInterview2Evaluation,
  guardUjatVolunteerInterview2Fail,
  guardUjatVolunteerInterview2Pass,
  guardUjatVolunteerWithdrawActivity,
} from '../applicant/guard-actions'
import type { ActivityWithdrawScheduleModalPayload } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import {
  computeUjatInterviewTotalScore,
  matchesUjatInterview2ScoreFilter,
  resolveUjatEffectiveSecondInterviewStatus,
  sortUjatVolunteerInterview2Rows,
  UJAT_INTERVIEW2_STATUS_POLL_MS,
} from './display'

function filterInterview2Applicants(
  rows: UjatVolunteerApplicantRow[],
  filters: UjatVolunteerInterview2Filters,
  now: Dayjs
): UjatVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (row.documentScreeningStatus !== 'pass') return false
    if (
      row.interviewAssignmentStatus !== 'assigned' &&
      row.interviewAssignmentStatus !== 'withdrawn'
    ) {
      return false
    }
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      filters.preferredRegion !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.preferredRegion !== filters.preferredRegion
    ) {
      return false
    }
    if (
      filters.interviewDate !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.assignedInterviewDateLabel !== filters.interviewDate
    ) {
      return false
    }
    if (
      filters.interviewTime !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      row.assignedInterviewTime !== filters.interviewTime
    ) {
      return false
    }
    if (
      !matchesUjatInterview2ScoreFilter(
        computeUjatInterviewTotalScore(row),
        filters.totalScore,
        UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL
      )
    ) {
      return false
    }
    if (
      filters.secondInterviewScreeningStatus !== UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL &&
      resolveUjatEffectiveSecondInterviewStatus(row, now) !== filters.secondInterviewScreeningStatus
    ) {
      return false
    }
    return true
  })
}

export type UjatVolunteerInterview2ViewMode = 'list' | 'calendar'

export function useUjatVolunteerInterview2({
  programId,
  half,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
}) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-application-volunteer-interview2',
    'UJAT 봉사자 신청 · 2차 면접 심사'
  )

  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() => [])
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerInterview2Filters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerInterview2Filters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<UjatVolunteerInterview2ViewMode>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [interview2Confirm, setInterview2Confirm] = useState<UjatInterview2ConfirmRequest | null>(
    null
  )
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [evaluationTargetId, setEvaluationTargetId] = useState<string | null>(null)
  const [bulkPassModalOpen, setBulkPassModalOpen] = useState(false)
  const [now, setNow] = useState(() => dayjs())

  const listQuery = useMemo(
    () => buildUjatVolunteerInterview2ListQuery(appliedFilters),
    [appliedFilters]
  )

  const applicationsQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.volunteerApplications(programId, half, 'interview2', listQuery),
    queryFn: ({ pageParam }) =>
      listUjatVolunteerApplicationsPage(programId, half, pageParam, listQuery),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
  const queriedRows = useMemo(
    () => applicationsQuery.data?.pages.flatMap(page => page.rows) ?? [],
    [applicationsQuery.data]
  )

  useEffect(() => {
    setList([])
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS })
    setViewMode('list')
    setSelectedRowKeys([])
    setWithdrawTargetId(null)
    setEvaluationTargetId(null)
    setBulkPassModalOpen(false)
    setNow(dayjs())
  }, [programId, half])

  useEffect(() => {
    setList(previous =>
      queriedRows.map(row => previous.find(current => current.id === row.id) ?? row)
    )
  }, [queriedRows])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), UJAT_INTERVIEW2_STATUS_POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const invalidateVolunteerLists = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...ujatQueryKeys.applications(), 'volunteers', programId],
    })
  }, [programId, queryClient])

  const updateRow = useCallback((id: string, patch: Partial<UjatVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    const clientOnly: UjatVolunteerInterview2Filters = {
      ...DEFAULT_UJAT_VOLUNTEER_INTERVIEW2_FILTERS,
      preferredRegion: appliedFilters.preferredRegion,
      interviewDate: appliedFilters.interviewDate,
      interviewTime: appliedFilters.interviewTime,
      totalScore: appliedFilters.totalScore,
    }
    const filtered = filterInterview2Applicants(list, clientOnly, now)
    return sortUjatVolunteerInterview2Rows(filtered)
  }, [appliedFilters, list, now])
  const infiniteScrollResetKey = useMemo(
    () => `${programId}:${half}:${JSON.stringify(appliedFilters)}`,
    [appliedFilters, half, programId]
  )

  const calendarEvents = useMemo(
    () => mapUjatVolunteerAssignedInterviewToCalendarEvents(filteredSorted),
    [filteredSorted]
  )

  const applySecondInterviewStatus = useCallback(
    (ids: string[], status: UjatSecondInterviewScreeningStatus) => {
      setList(prev => patchUjatVolunteerSecondInterviewScreeningStatus(prev, ids, status))
      setSelectedRowKeys([])
      if (
        status === 'pass' ||
        status === 'fail' ||
        status === 'reserve1' ||
        status === 'reserve2' ||
        status === 'reserve3' ||
        status === 'reserve4'
      ) {
        void submitUjatVolunteerFinalResultsRemote(ids, status)
          .then(() => invalidateVolunteerLists())
          .catch(() => {
            showAlert({
              title: '2차 면접 결과 저장 실패',
              content: '최종 결과 처리에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
            })
            void invalidateVolunteerLists()
          })
      }
    },
    [invalidateVolunteerLists, showAlert]
  )

  const showInterview2Confirm = useCallback((options: UjatInterview2ConfirmRequest) => {
    setInterview2Confirm(options)
  }, [])

  const closeInterview2Confirm = useCallback(() => {
    setInterview2Confirm(null)
  }, [])

  const handleBulkFail = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    confirmUjatVolunteerInterview2Fail({
      showConfirm: showInterview2Confirm,
      count: ids.length,
      onConfirm: () => applySecondInterviewStatus(ids, 'fail'),
    })
  }, [applySecondInterviewStatus, selectedRowKeys, showInterview2Confirm])

  const handleBulkPass = useCallback(() => {
    openUjatVolunteerInterview2BulkPassModal(
      () => setBulkPassModalOpen(true),
      selectedRowKeys.length
    )
  }, [selectedRowKeys.length])

  const closeBulkPassModal = useCallback(() => {
    setBulkPassModalOpen(false)
  }, [])

  const confirmBulkPass = useCallback(
    (payload: UjatInterview2BulkPassConfirmPayload) => {
      const ids = selectedRowKeys.map(String)
      applySecondInterviewStatus(ids, payload.passType)
      const passTypeLabel =
        UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS.find(option => option.value === payload.passType)
          ?.label ?? payload.passType
      const notifyLabel =
        payload.notifyTiming === 'immediate'
          ? '즉시'
          : payload.notifyTiming === 'on_announcement'
            ? '발표일에 맞춰서'
            : (payload.manualNotifyAt?.format('YYYY. MM. DD HH:mm') ?? '직접 설정')
      showAlert({
        title: '일괄 합격',
        content: `선택한 ${ids.length}건이 ${passTypeLabel} 처리되었습니다. (알림: ${notifyLabel})`,
      })
      setBulkPassModalOpen(false)
    },
    [applySecondInterviewStatus, selectedRowKeys, showAlert]
  )

  const requestInterview2Pass = useCallback(
    (row: UjatVolunteerApplicantRow) => {
      if (!guardUjatVolunteerInterview2Pass(row)) return
      confirmUjatVolunteerInterview2Pass({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'pass'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
  )

  const requestInterview2Fail = useCallback(
    (row: UjatVolunteerApplicantRow) => {
      if (!guardUjatVolunteerInterview2Fail(row)) return
      confirmUjatVolunteerInterview2Fail({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'fail'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
  )

  const requestWithdrawActivity = useCallback((row: UjatVolunteerApplicantRow) => {
    if (!guardUjatVolunteerWithdrawActivity(row)) return
    setWithdrawTargetId(row.id)
  }, [])

  const cancelWithdrawActivity = useCallback(() => {
    setWithdrawTargetId(null)
  }, [])

  const confirmWithdrawActivity = useCallback(
    (_payload: ActivityWithdrawScheduleModalPayload) => {
      if (!withdrawTargetId) return
      const row = list.find(item => item.id === withdrawTargetId)
      if (!row) {
        setWithdrawTargetId(null)
        return
      }
      updateRow(withdrawTargetId, { interviewAssignmentStatus: 'withdrawn' })
      void giveUpUjatVolunteerApplicationRemote(
        withdrawTargetId,
        _payload.stopScheduleLabel
          ? `활동 포기 (${_payload.stopScheduleLabel})`
          : '활동 포기'
      )
        .then(() => invalidateVolunteerLists())
        .catch(() => {
          showAlert({
            title: '활동 포기 처리 실패',
            content: '활동 포기 처리에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
          })
          void invalidateVolunteerLists()
        })
      showAlert({
        title: '활동 포기',
        content: `${row.name} 봉사자가 활동 포기 처리되었습니다.`,
      })
      setWithdrawTargetId(null)
    },
    [invalidateVolunteerLists, list, showAlert, updateRow, withdrawTargetId]
  )

  const withdrawTarget = useMemo(
    () => (withdrawTargetId ? list.find(row => row.id === withdrawTargetId) : undefined),
    [list, withdrawTargetId]
  )

  const openEvaluationModal = useCallback((row: UjatVolunteerApplicantRow) => {
    if (!guardUjatVolunteerInterview2Evaluation(row)) return
    setEvaluationTargetId(row.id)
  }, [])

  const closeEvaluationModal = useCallback(() => {
    setEvaluationTargetId(null)
  }, [])

  const evaluationTarget = useMemo(
    () => (evaluationTargetId ? list.find(row => row.id === evaluationTargetId) : undefined),
    [evaluationTargetId, list]
  )

  const saveInterviewEvaluation = useCallback(
    (payload: UjatVolunteerInterviewEvaluationPayload) => {
      if (!evaluationTargetId) return
      setList(prev => patchUjatVolunteerInterviewEvaluation(prev, evaluationTargetId, payload))
      showAlert({
        title: '면접 평가',
        content: '면접 평가가 저장되었습니다.',
      })
      setEvaluationTargetId(null)
    },
    [evaluationTargetId, showAlert]
  )

  const columns = useUjatVolunteerInterview2Columns()

  const handleViewCalendar = useCallback(() => {
    setPendingFilters(prev => ({
      ...prev,
      interviewDate: UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL,
    }))
    setAppliedFilters(prev => ({
      ...prev,
      interviewDate: UJAT_VOLUNTEER_INTERVIEW2_FILTER_ALL,
    }))
    setViewMode('calendar')
  }, [])

  const handleViewList = useCallback(() => {
    setViewMode('list')
  }, [])

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData: filteredSorted,
    columns,
    count: filteredSorted.length,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    bulkPassModalOpen,
    closeBulkPassModal,
    confirmBulkPass,
    bulkPassCount: selectedRowKeys.length,
    interview2Confirm,
    closeInterview2Confirm,
    filterRowsSource: list,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    requestInterview2Pass,
    requestInterview2Fail,
    openEvaluationModal,
    closeEvaluationModal,
    evaluationTarget,
    saveInterviewEvaluation,
    fetchNextPage: applicationsQuery.fetchNextPage,
    hasNextPage: applicationsQuery.hasNextPage,
    isFetchingNextPage: applicationsQuery.isFetchingNextPage,
    infiniteScrollResetKey,
  }
}
