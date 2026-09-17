import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  sortUjatVolunteerDocPassedApplicants,
  type UjatVolunteerApplicantRow,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatVolunteerDocPassedListQuery } from '@/features/program/ujat/api/applications-list-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { giveUpUjatVolunteerApplicationRemote } from '@/features/program/ujat/api/volunteer-mutations'
import { assignGeneralVolunteerInterview } from '@/features/program/general/api/admin-applications-service'
import { buildInterviewSlotTimesFromAssignPayload } from '@/features/program/general/lib/interview-slot-from-assign-payload'
import type {
  UjatManagerEvaluation,
  UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS,
  UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL,
  type UjatVolunteerDocPassedFilters,
} from './filter-fields'
import { useUjatVolunteerDocPassedColumns } from './columns'
import { mapUjatVolunteerInterviewToCalendarEvents } from '../shared/interview-calendar-events'
import type { UjatInterviewAssignConfirmPayload } from '../interview-assign/modal'
import {
  guardUjatVolunteerAssignInterview,
  guardUjatVolunteerWithdrawActivity,
} from '../applicant/guard-actions'
import type { ActivityWithdrawScheduleModalPayload } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'

export type UjatInterviewAssignPickFlow = {
  type: 'pick'
  target: UjatVolunteerApplicantRow
}

export type UjatInterviewAssignCompleteFlow = {
  type: 'complete'
  applicantName: string
  mode: 'assign' | 'reassign'
  payload: UjatInterviewAssignConfirmPayload
}

export type UjatInterviewAssignFlow = UjatInterviewAssignPickFlow | UjatInterviewAssignCompleteFlow

function filterDocPassedApplicants(
  rows: UjatVolunteerApplicantRow[],
  filters: UjatVolunteerDocPassedFilters
): UjatVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (row.documentScreeningStatus !== 'pass') return false
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      filters.preferredRegion !== UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL &&
      row.preferredRegion !== filters.preferredRegion
    ) {
      return false
    }
    if (filters.educationExperience === 'yes' && !row.hasEducationExperience) return false
    if (filters.educationExperience === 'no' && row.hasEducationExperience) return false
    if (
      filters.interviewAssignmentStatus !== UJAT_VOLUNTEER_DOC_PASSED_FILTER_ALL &&
      row.interviewAssignmentStatus !== filters.interviewAssignmentStatus
    ) {
      return false
    }
    return true
  })
}

export type UjatVolunteerDocPassedViewMode = 'list' | 'calendar'

export function useUjatVolunteerDocPassed({
  programId,
  half,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
}) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-application-volunteer-doc-passed',
    'UJAT 봉사자 신청 · 1차 합격자'
  )

  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() => [])
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<UjatVolunteerDocPassedViewMode>('list')
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [assignFlow, setAssignFlow] = useState<UjatInterviewAssignFlow | null>(null)
  const assignFlowRef = useRef(assignFlow)
  assignFlowRef.current = assignFlow

  const listQuery = useMemo(
    () => buildUjatVolunteerDocPassedListQuery(appliedFilters),
    [appliedFilters]
  )

  const applicationsQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.volunteerApplications(programId, half, 'docPassed', listQuery),
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
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS })
    setViewMode('list')
  }, [programId, half])

  useEffect(() => {
    setList(previous =>
      queriedRows.map(row => previous.find(current => current.id === row.id) ?? row)
    )
  }, [queriedRows])

  const invalidateVolunteerLists = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...ujatQueryKeys.applications(), 'volunteers', programId],
    })
  }, [programId, queryClient])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    const clientOnly: UjatVolunteerDocPassedFilters = {
      ...DEFAULT_UJAT_VOLUNTEER_DOC_PASSED_FILTERS,
      preferredRegion: appliedFilters.preferredRegion,
      educationExperience: appliedFilters.educationExperience,
    }
    const filtered = filterDocPassedApplicants(list, clientOnly)
    return sortUjatVolunteerDocPassedApplicants(filtered)
  }, [appliedFilters, list])
  const infiniteScrollResetKey = useMemo(
    () => `${programId}:${half}:${JSON.stringify(appliedFilters)}`,
    [appliedFilters, half, programId]
  )

  const calendarEvents = useMemo(
    () => mapUjatVolunteerInterviewToCalendarEvents(filteredSorted),
    [filteredSorted]
  )

  const updateRow = useCallback((id: string, patch: Partial<UjatVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const onManagerAEvaluationChange = useCallback(
    (id: string, evaluation: UjatManagerEvaluation) => {
      updateRow(id, { managerAEvaluation: evaluation })
    },
    [updateRow]
  )

  const onManagerBEvaluationChange = useCallback(
    (id: string, evaluation: UjatManagerEvaluation) => {
      updateRow(id, { managerBEvaluation: evaluation })
    },
    [updateRow]
  )

  const handleAssignInterview = useCallback((row: UjatVolunteerApplicantRow) => {
    if (!guardUjatVolunteerAssignInterview(row)) return
    if (!shouldUseUjatApplicationsRemoteApi()) {
      showAlert({
        title: '면접 배정',
        content: 'UJAT 신청 API가 활성화되지 않았습니다. applications 모듈·원격 JWT를 확인해 주세요.',
      })
      return
    }
    setAssignFlow({ type: 'pick', target: row })
  }, [showAlert])

  const closeAssignModal = useCallback(() => {
    setAssignFlow(current => (current?.type === 'pick' ? null : current))
  }, [])

  const confirmAssignInterview = useCallback(
    async (payload: UjatInterviewAssignConfirmPayload) => {
      const flow = assignFlowRef.current
      if (!flow || flow.type !== 'pick') return

      const { target } = flow
      const wasAssigned = target.interviewAssignmentStatus === 'assigned'

      const slotTimes = buildInterviewSlotTimesFromAssignPayload(payload)
      if (!slotTimes) {
        showAlert({
          title: '면접 배정 실패',
          content: '면접 일시 형식을 확인할 수 없습니다. 다시 선택해 주세요.',
        })
        return
      }

      try {
        await assignGeneralVolunteerInterview({
          programId,
          applicationId: target.id,
          ...slotTimes,
        })
        await invalidateVolunteerLists()
      } catch (error) {
        console.debug('ujat interview assign remote failed', error)
        showAlert({
          title: '면접 배정 실패',
          content: '면접 일정 배정 중 오류가 발생했습니다. 다시 시도해 주세요.',
        })
        return
      }

      updateRow(target.id, {
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: payload.dateLabel,
        assignedInterviewTime: payload.timeRange,
      })
      setAssignFlow({
        type: 'complete',
        applicantName: target.name,
        mode: wasAssigned ? 'reassign' : 'assign',
        payload,
      })
    },
    [invalidateVolunteerLists, programId, showAlert, updateRow]
  )

  const closeAssignCompleteModal = useCallback(() => {
    setAssignFlow(null)
  }, [])

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

  const columns = useUjatVolunteerDocPassedColumns({ onAssignInterview: handleAssignInterview })

  const handleViewCalendar = useCallback(() => {
    setViewMode('calendar')
  }, [])

  const handleViewList = useCallback(() => {
    setViewMode('list')
  }, [])

  return {
    list,
    updateRow,
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
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
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    fetchNextPage: applicationsQuery.fetchNextPage,
    hasNextPage: applicationsQuery.hasNextPage,
    isFetchingNextPage: applicationsQuery.isFetchingNextPage,
    infiniteScrollResetKey,
  }
}
