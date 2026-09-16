import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerInterview2Applicants,
  patchGeneralVolunteerInterviewEvaluation,
  patchGeneralVolunteerSecondInterviewScreeningStatus,
  sortGeneralParticipantDocPassedVolunteerRows,
  type GeneralVolunteerApplicantRow,
  type GeneralVolunteerInterviewEvaluationPayload,
} from '@/data/mock/general-volunteer-applicants-mock'
import { getGeneralParticipantInterview2Applicants } from '@/data/mock/general-individual-applications-mock'
import { mapParticipantsToVolunteerScreeningRows } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import { screeningWithdrawCompleteContent } from '@/features/program/general/lib/screening-subject-kind'
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  filterGeneralInterview2Applicants,
  filterGeneralInterview2CalendarApplicants,
  type GeneralVolunteerInterview2Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  computeGeneralInterviewTotalScore,
  sortGeneralVolunteerInterview2Applicants,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import { mapGeneralVolunteerAssignedInterviewToCalendarEvents } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import { useGeneralInterview2EffectiveStatusTick } from '@/features/program/general/hooks/use-general-interview2-effective-status-tick'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
import { assignGeneralIndividualInterview, assignGeneralVolunteerInterview } from '@/features/program/general/api/admin-applications-service'
import { buildInterviewSlotTimesFromAssignPayload } from '@/features/program/general/lib/interview-slot-from-assign-payload'
import {
  countInterviewAvailabilitySlots,
  mergeAssignedInterviewIntoAvailability,
} from '@/features/program/general/lib/interview-availability-utils'
import {
  GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS,
  type GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralVolunteerInterview2Columns } from './interview2-columns'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  requestGeneralVolunteerInterview2BulkFail,
  requestGeneralVolunteerInterview2BulkPass,
} from './general-volunteer-interview2-actions'
import type { GeneralInterview2BulkPassConfirmPayload } from './general-volunteer-interview2-bulk-pass-modal'
import {
  guardGeneralVolunteerAssignInterview,
  guardGeneralVolunteerInterview2Evaluation,
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'
import type { ActivityWithdrawScheduleModalPayload } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import type { GeneralInterviewAssignConfirmPayload } from './general-volunteer-interview-assign-modal'
import type { GeneralInterviewAssignFlow } from './use-doc-passed'

export type GeneralVolunteerInterview2ViewMode = 'list' | 'calendar'

export function useGeneralVolunteerInterview2({
  programId,
  subjectKind = 'volunteer',
  preferApplicationListMock = false,
}: {
  programId: string
  subjectKind?: ScreeningSubjectKind
  preferApplicationListMock?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const sortInterview2Rows = useCallback(
    (rows: GeneralVolunteerApplicantRow[]) =>
      subjectKind === 'participant'
        ? // 참여자: 1차 서류 합격자와 동일 — 활동 포기 하단, No. 내림차순
          sortGeneralParticipantDocPassedVolunteerRows(rows)
        : sortGeneralVolunteerInterview2Applicants(rows),
    [subjectKind]
  )

  const loadRows = useCallback(() => {
    if (subjectKind === 'participant') {
      return sortInterview2Rows(
        mapParticipantsToVolunteerScreeningRows(
          getGeneralParticipantInterview2Applicants(programId)
        )
      )
    }
    return sortInterview2Rows(getGeneralVolunteerInterview2Applicants(programId))
  }, [programId, sortInterview2Rows, subjectKind])

  // remote ON이면 mock으로 채우지 않음 (잘못된 목록 플래시 방지)
  // preferApplicationListMock(병합) + subjectKind 참여자 remote(stash) 합성
  const remoteSeed =
    !preferApplicationListMock &&
    shouldUseGeneralApplicationsRemoteApi() &&
    Boolean(programId)
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    remoteSeed ? [] : loadRows()
  )
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'interview2',
    subjectKind,
    enabled: !preferApplicationListMock,
    setList,
  })
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<GeneralVolunteerInterview2ViewMode>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [evaluationTargetId, setEvaluationTargetId] = useState<string | null>(null)
  const [assignFlow, setAssignFlow] = useState<GeneralInterviewAssignFlow | null>(null)
  const assignFlowRef = useRef(assignFlow)
  assignFlowRef.current = assignFlow
  const [bulkPassModalOpen, setBulkPassModalOpen] = useState(false)
  const [bulkFailModalOpen, setBulkFailModalOpen] = useState(false)
  const [bulkFailCompleteCount, setBulkFailCompleteCount] = useState<number | null>(null)
  const [passModalVolunteer, setPassModalVolunteer] = useState<GeneralVolunteerApplicantRow | null>(
    null
  )
  const [failModalVolunteer, setFailModalVolunteer] = useState<GeneralVolunteerApplicantRow | null>(
    null
  )
  const [passCompleteVolunteerName, setPassCompleteVolunteerName] = useState<string | null>(null)
  const [failCompleteVolunteer, setFailCompleteVolunteer] = useState<{
    name: string
    reason: string
  } | null>(null)

  useGeneralInterview2EffectiveStatusTick(list)

  useEffect(() => {
    if (volunteerRemote.remoteEnabled) return
    setList(loadRows())
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setViewMode('list')
    setSelectedRowKeys([])
    setWithdrawTargetId(null)
    setEvaluationTargetId(null)
    setBulkPassModalOpen(false)
    setBulkFailModalOpen(false)
    setBulkFailCompleteCount(null)
    setPassModalVolunteer(null)
    setFailModalVolunteer(null)
    setPassCompleteVolunteerName(null)
    setFailCompleteVolunteer(null)
  }, [loadRows, volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(
    () => sortInterview2Rows(filterGeneralInterview2Applicants(list, appliedFilters)),
    [appliedFilters, list, sortInterview2Rows]
  )

  const calendarFilteredData = useMemo(
    () => sortInterview2Rows(filterGeneralInterview2CalendarApplicants(list, appliedFilters)),
    [appliedFilters, list, sortInterview2Rows]
  )

  const calendarEvents = useMemo(
    () => mapGeneralVolunteerAssignedInterviewToCalendarEvents(calendarFilteredData),
    [calendarFilteredData]
  )

  const count = viewMode === 'calendar' ? calendarFilteredData.length : tableData.length

  const handleViewCalendar = useCallback(() => {
    setSelectedRowKeys([])
    setViewMode('calendar')
  }, [])

  const handleViewList = useCallback(() => {
    setViewMode('list')
  }, [])

  const applySecondInterviewStatus = useCallback(
    async (ids: string[], status: GeneralSecondInterviewScreeningStatus, reason?: string) => {
      if (
        status === 'pass' ||
        status === 'fail' ||
        status === 'reserve1' ||
        status === 'reserve2' ||
        status === 'reserve3' ||
        status === 'reserve4'
      ) {
        const remoteOk = await volunteerRemote.applyRemoteFinalResult(ids, status, reason)
        if (remoteOk) return
      }
      setList(prev => patchGeneralVolunteerSecondInterviewScreeningStatus(prev, ids, status))
    },
    [volunteerRemote]
  )

  const openPassModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerInterview2Pass(applicant)) return
    setPassModalVolunteer(applicant)
  }, [])

  const closePassModal = useCallback(() => {
    setPassModalVolunteer(null)
  }, [])

  const openFailModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerInterview2Fail(applicant)) return
    setFailModalVolunteer(applicant)
  }, [])

  const closeFailModal = useCallback(() => {
    setFailModalVolunteer(null)
  }, [])

  const closePassCompleteModal = useCallback(() => {
    setPassCompleteVolunteerName(null)
  }, [])

  const closeFailCompleteModal = useCallback(() => {
    setFailCompleteVolunteer(null)
  }, [])

  const handlePassModalConfirm = useCallback(
    async (_payload: PermissionModalPayload) => {
      if (!passModalVolunteer) return
      const volunteerName = passModalVolunteer.name
      await applySecondInterviewStatus([passModalVolunteer.id], 'pass')
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== passModalVolunteer.id))
      setPassModalVolunteer(null)
      setPassCompleteVolunteerName(volunteerName)
    },
    [applySecondInterviewStatus, passModalVolunteer]
  )

  const handleFailModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!failModalVolunteer) return
      const { name, id } = failModalVolunteer
      await applySecondInterviewStatus([id], 'fail', payload.reason)
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      setFailModalVolunteer(null)
      setFailCompleteVolunteer({ name, reason: payload.reason })
    },
    [applySecondInterviewStatus, failModalVolunteer]
  )

  const handleBulkFail = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    const selectedRows = list.filter(row => ids.includes(row.id))
    requestGeneralVolunteerInterview2BulkFail({
      selectedIds: ids,
      selectedRows,
      onOpenSingleFail: () => {
        const applicant = selectedRows[0]
        if (applicant) openFailModal(applicant)
      },
      onOpenBulkFail: () => setBulkFailModalOpen(true),
    })
  }, [list, openFailModal, selectedRowKeys])

  const closeBulkFailModal = useCallback(() => {
    setBulkFailModalOpen(false)
  }, [])

  const closeBulkFailCompleteModal = useCallback(() => {
    setBulkFailCompleteCount(null)
  }, [])

  const confirmBulkFail = useCallback(
    async (_payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      await applySecondInterviewStatus(ids, 'fail')
      setSelectedRowKeys([])
      setBulkFailModalOpen(false)
      setBulkFailCompleteCount(ids.length)
    },
    [applySecondInterviewStatus, selectedRowKeys]
  )

  const handleBulkPass = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    const selectedRows = list.filter(row => ids.includes(row.id))
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ids,
      selectedRows,
      onOpenSinglePass: () => {
        const applicant = selectedRows[0]
        if (applicant) openPassModal(applicant)
      },
      onOpenBulkPass: () => setBulkPassModalOpen(true),
    })
  }, [list, openPassModal, selectedRowKeys])

  const closeBulkPassModal = useCallback(() => {
    setBulkPassModalOpen(false)
  }, [])

  const confirmBulkPass = useCallback(
    async (payload: GeneralInterview2BulkPassConfirmPayload) => {
      const ids = selectedRowKeys.map(String)
      await applySecondInterviewStatus(ids, payload.passType)
      const passTypeLabel =
        GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS.find(option => option.value === payload.passType)
          ?.label ?? payload.passType
      const notifyLabel =
        payload.notifyTiming === 'immediate'
          ? '즉시'
          : payload.notifyTiming === 'on_announcement'
            ? '발표일에 맞춰서'
            : (payload.manualNotifyAt?.format('YYYY. MM. DD HH:mm') ?? '직접 설정')
      showAlert({
        title: '일괄 합격',
        content: `선택한 ${ids.length}건이 ${passTypeLabel} 처리되었습니다. (알림: ${notifyLabel}${
          volunteerRemote.remoteEnabled ? '' : ', 목 데이터'
        })`,
      })
      setSelectedRowKeys([])
      setBulkPassModalOpen(false)
    },
    [applySecondInterviewStatus, selectedRowKeys, showAlert, volunteerRemote.remoteEnabled]
  )

  const requestWithdrawActivity = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerWithdrawActivity(row)) return
    setWithdrawTargetId(row.id)
  }, [])

  const cancelWithdrawActivity = useCallback(() => {
    setWithdrawTargetId(null)
  }, [])

  const confirmWithdrawActivity = useCallback(
    async (_payload: ActivityWithdrawScheduleModalPayload) => {
      if (!withdrawTargetId) return
      const row = list.find(item => item.id === withdrawTargetId)
      if (!row) {
        setWithdrawTargetId(null)
        return
      }
      if (volunteerRemote.remoteEnabled) {
        const handled = await volunteerRemote.applyRemoteGiveUp?.(withdrawTargetId)
        if (handled) {
          setWithdrawTargetId(null)
          showAlert({
            title: '활동 포기',
            content: screeningWithdrawCompleteContent(subjectKind, row.name),
          })
          return
        }
      }
      setList(prev =>
        prev.map(item =>
          item.id === withdrawTargetId ? { ...item, interviewAssignmentStatus: 'withdrawn' } : item
        )
      )
      showAlert({
        title: '활동 포기',
        content: screeningWithdrawCompleteContent(subjectKind, row.name),
      })
      setWithdrawTargetId(null)
    },
    [list, showAlert, subjectKind, volunteerRemote, withdrawTargetId]
  )

  const withdrawTarget = useMemo(
    () => (withdrawTargetId ? list.find(row => row.id === withdrawTargetId) : undefined),
    [list, withdrawTargetId]
  )

  const requestInterview2Pass = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      openPassModal(row)
    },
    [openPassModal]
  )

  const requestInterview2Fail = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      openFailModal(row)
    },
    [openFailModal]
  )

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const handleAssignInterview = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerAssignInterview(row)) return
    setAssignFlow({ type: 'pick', target: row })
  }, [])

  const closeAssignModal = useCallback(() => {
    setAssignFlow(current => (current?.type === 'pick' ? null : current))
  }, [])

  const confirmAssignInterview = useCallback(
    async (payload: GeneralInterviewAssignConfirmPayload) => {
      const flow = assignFlowRef.current
      if (!flow || flow.type !== 'pick') return

      const { target } = flow
      const wasAssigned = target.interviewAssignmentStatus === 'assigned'

      if (!preferApplicationListMock && shouldUseGeneralApplicationsRemoteApi()) {
        const slotTimes = buildInterviewSlotTimesFromAssignPayload(payload)
        if (!slotTimes) {
          showAlert({
            title: '면접 배정 실패',
            content: '면접 일시 형식을 확인할 수 없습니다. 다시 선택해 주세요.',
          })
          return
        }
        try {
          if (subjectKind === 'participant') {
            await assignGeneralIndividualInterview({
              programId,
              applicationId: target.id,
              ...slotTimes,
            })
          } else {
            await assignGeneralVolunteerInterview({
              programId,
              applicationId: target.id,
              ...slotTimes,
            })
          }
          await volunteerRemote.invalidateVolunteerApplications?.()
        } catch (error) {
          console.debug('interview assign remote failed', error)
          showAlert({
            title: '면접 배정 실패',
            content: '면접 일정 배정 중 오류가 발생했습니다. 다시 시도해 주세요.',
          })
          return
        }
      }

      const assignedApplicant: GeneralVolunteerApplicantRow = {
        ...target,
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: payload.dateLabel,
        assignedInterviewTime: payload.timeRange,
        secondInterviewScreeningStatus: target.secondInterviewScreeningStatus ?? 'waiting',
      }
      const interviewAvailability = mergeAssignedInterviewIntoAvailability(assignedApplicant)

      updateRow(target.id, {
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: payload.dateLabel,
        assignedInterviewTime: payload.timeRange,
        secondInterviewScreeningStatus: target.secondInterviewScreeningStatus ?? 'waiting',
        interviewAvailability,
        interviewSlotCount: countInterviewAvailabilitySlots(interviewAvailability),
      })
      setAssignFlow({
        type: 'complete',
        applicantName: target.name,
        mode: wasAssigned ? 'reassign' : 'assign',
        payload,
      })
    },
    [preferApplicationListMock, programId, showAlert, subjectKind, updateRow, volunteerRemote]
  )

  const closeAssignCompleteModal = useCallback(() => {
    setAssignFlow(null)
  }, [])

  const openEvaluationModal = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerInterview2Evaluation(row)) return
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
    async (payload: GeneralVolunteerInterviewEvaluationPayload) => {
      if (!evaluationTargetId) return
      const target = list.find(row => row.id === evaluationTargetId)
      const scoreTotal = computeGeneralInterviewTotalScore({
        managerAScore: payload.managerAScore,
        managerBScore: payload.managerBScore,
      })
      if (scoreTotal == null) return

      if (volunteerRemote.remoteEnabled) {
        const result = await volunteerRemote.applyRemoteInterviewEvaluation?.(
          target?.interviewAssignmentId,
          {
            scoreTotal,
            comment: payload.interviewEvaluationRemark?.trim() || undefined,
          }
        )
        if (result === 'missing_assignment' || result === 'error') return
        if (result === 'ok') {
          setList(prev =>
            patchGeneralVolunteerInterviewEvaluation(prev, evaluationTargetId, payload)
          )
          showAlert({
            title: '면접 평가',
            content: '면접 평가가 저장되었습니다.',
          })
          setEvaluationTargetId(null)
          return
        }
      }

      setList(prev => patchGeneralVolunteerInterviewEvaluation(prev, evaluationTargetId, payload))
      showAlert({
        title: '면접 평가',
        content: '면접 평가가 저장되었습니다.',
      })
      setEvaluationTargetId(null)
    },
    [evaluationTargetId, list, showAlert, volunteerRemote]
  )

  const columns = useGeneralVolunteerInterview2Columns({
    subjectKind,
    onReassignInterview: handleAssignInterview,
  })

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
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
    bulkFailModalOpen,
    closeBulkFailModal,
    confirmBulkFail,
    bulkFailCount: selectedRowKeys.length,
    bulkFailCompleteCount,
    closeBulkFailCompleteModal,
    passModalVolunteer,
    failModalVolunteer,
    closePassModal,
    closeFailModal,
    handlePassModalConfirm,
    handleFailModalConfirm,
    passCompleteVolunteerName,
    failCompleteVolunteer,
    closePassCompleteModal,
    closeFailCompleteModal,
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
    handleAssignInterview,
    assignFlow,
    closeAssignModal,
    closeAssignCompleteModal,
    confirmAssignInterview,
    filterRowsSource: list,
    applicationsLoading: volunteerRemote.applicationsLoading,
    isRemoteDataSource: volunteerRemote.remoteEnabled,
  }
}
