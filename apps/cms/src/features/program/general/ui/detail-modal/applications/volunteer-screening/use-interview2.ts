import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerInterview2Applicants,
  patchGeneralVolunteerInterviewEvaluation,
  patchGeneralVolunteerSecondInterviewScreeningStatus,
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
import { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'
import { mapGeneralVolunteerAssignedInterviewToCalendarEvents } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import { useGeneralInterview2EffectiveStatusTick } from '@/features/program/general/hooks/use-general-interview2-effective-status-tick'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
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
  guardGeneralVolunteerInterview2Evaluation,
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'
import type { ActivityWithdrawScheduleModalPayload } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'

export type GeneralVolunteerInterview2ViewMode = 'list' | 'calendar'

export function useGeneralVolunteerInterview2({
  programId,
  subjectKind = 'volunteer',
}: {
  programId: string
  subjectKind?: ScreeningSubjectKind
}) {
  const { showAlert } = useCmsAlert()
  const loadRows = useCallback(() => {
    if (subjectKind === 'participant') {
      return sortGeneralVolunteerInterview2Applicants(
        mapParticipantsToVolunteerScreeningRows(
          getGeneralParticipantInterview2Applicants(programId)
        )
      )
    }
    return sortGeneralVolunteerInterview2Applicants(
      getGeneralVolunteerInterview2Applicants(programId)
    )
  }, [programId, subjectKind])

  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() => loadRows())
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'interview2',
    enabled: subjectKind === 'volunteer',
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
    () =>
      sortGeneralVolunteerInterview2Applicants(
        filterGeneralInterview2Applicants(list, appliedFilters)
      ),
    [appliedFilters, list]
  )

  const calendarFilteredData = useMemo(
    () =>
      sortGeneralVolunteerInterview2Applicants(
        filterGeneralInterview2CalendarApplicants(list, appliedFilters)
      ),
    [appliedFilters, list]
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
    requestGeneralVolunteerInterview2BulkFail({
      selectedIds: ids,
      onOpenSingleFail: () => {
        const applicant = list.find(row => row.id === ids[0])
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
    requestGeneralVolunteerInterview2BulkPass({
      selectedIds: ids,
      onOpenSinglePass: () => {
        const applicant = list.find(row => row.id === ids[0])
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
    (_payload: ActivityWithdrawScheduleModalPayload) => {
      if (!withdrawTargetId) return
      const row = list.find(item => item.id === withdrawTargetId)
      if (!row) {
        setWithdrawTargetId(null)
        return
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
    [list, showAlert, subjectKind, withdrawTargetId]
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
    (payload: GeneralVolunteerInterviewEvaluationPayload) => {
      if (!evaluationTargetId) return
      setList(prev => patchGeneralVolunteerInterviewEvaluation(prev, evaluationTargetId, payload))
      showAlert({
        title: '면접 평가',
        content: '면접 평가가 저장되었습니다.',
      })
      setEvaluationTargetId(null)
    },
    [evaluationTargetId, showAlert]
  )

  const columns = useGeneralVolunteerInterview2Columns(subjectKind)

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
    filterRowsSource: list,
    applicationsLoading: volunteerRemote.applicationsLoading,
    isRemoteDataSource: volunteerRemote.remoteEnabled,
  }
}
