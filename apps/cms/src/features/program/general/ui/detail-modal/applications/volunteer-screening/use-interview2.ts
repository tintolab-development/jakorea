import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  getGeneralVolunteerActivityWithdrawScheduleOptions,
  resolveGeneralVolunteerActivityWithdrawStopScheduleId,
} from '@/features/program/general/lib/general-volunteer-activity-withdraw'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  sortGeneralParticipantDocPassedVolunteerRows,
  type GeneralVolunteerApplicantRow,
  type GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  filterGeneralInterview2Applicants,
  filterGeneralInterview2ApplicantsRemoteClientOnly,
  filterGeneralInterview2CalendarApplicants,
  type GeneralVolunteerInterview2Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { buildGeneralVolunteerInterview2ListQuery } from '@/features/program/general/api/volunteer-list-query'
import { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'
import { mapGeneralVolunteerAssignedInterviewToCalendarEvents } from '@/features/program/general/lib/general-volunteer-interview-calendar-events'
import { useGeneralInterview2EffectiveStatusTick } from '@/features/program/general/hooks/use-general-interview2-effective-status-tick'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import type {
  GeneralInterview2BulkPassType,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralVolunteerInterview2Columns } from './interview2-columns'
import { useGeneralVolunteerEducationAssignApproval } from './use-education-assign-approval'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import type {
  PermissionModalNotifyTiming,
  PermissionModalPayload,
} from '@/shared/components/permission-modal'
import {
  toNestedDecisionNotification,
  toScreeningNotifyFields,
} from '@/features/program/general/lib/application-decision-notify-timing'
import type { VolunteerInterview2CancelFailConfirmPayload } from '@/features/program/general/lib/volunteer-interview2-cancel-fail'
import {
  APPLICATION_ACTION_CANCEL_FINAL_FAIL,
  APPLICATION_ACTION_CANCEL_FINAL_PASS,
  hasExplicitApplicationAction,
} from '@/features/program/shared/lib/application-available-actions'
import { MESSAGES } from '@/shared/constants/messages'
import {
  requestGeneralVolunteerInterview2BulkFail,
  requestGeneralVolunteerInterview2BulkPass,
  isGeneralVolunteerInterview2SelectableForResult,
} from './general-volunteer-interview2-actions'
import {
  guardGeneralVolunteerInterview2Evaluation,
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'
import type { GeneralVolunteerScreeningActivityWithdrawModalPayload } from './general-volunteer-screening-activity-withdraw-modal'

/** 합격 확정 payload — `passType` 미지정이면 기존 동작(합격) */
export type Interview2PassConfirmPayload = PermissionModalPayload & {
  passType?: GeneralInterview2BulkPassType
}

export type GeneralVolunteerInterview2ViewMode = 'list' | 'calendar'

export function useGeneralVolunteerInterview2({
  programId,
  program,
  subjectKind = 'volunteer',
}: {
  programId: string
  program: Program
  subjectKind?: ScreeningSubjectKind
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

  const remoteEnabled = shouldUseGeneralApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-volunteer-interview2',
    '프로그램 신청 · 봉사자 2차 면접'
  )
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() => [])
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const listQuery = useMemo(
    () =>
      subjectKind === 'volunteer'
        ? buildGeneralVolunteerInterview2ListQuery(appliedFilters)
        : undefined,
    [appliedFilters, subjectKind]
  )
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'interview2',
    subjectKind,
    enabled: true,
    listQuery,
    setList,
  })
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [viewMode, setViewMode] = useState<GeneralVolunteerInterview2ViewMode>('list')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawCompleteVolunteerName, setWithdrawCompleteVolunteerName] = useState<string | null>(
    null
  )
  const activityWithdrawScheduleOptions = useMemo(
    () => getGeneralVolunteerActivityWithdrawScheduleOptions(program),
    [program]
  )
  const programSchedulesQuery = useQuery({
    // 다른 화면과 같은 일정 캐시 키 — 키가 다르면 같은 GET /schedules를 따로 받고, 일정 무효화도 안 걸린다.
    queryKey: generalProgramQueryKeys.schedules(programId),
    queryFn: () => fetchAdminProgramSchedulesRemote(programId),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 60_000,
  })
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
  const [cancelPassVolunteer, setCancelPassVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const [cancelFailVolunteer, setCancelFailVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  /** 세션 내 합격/불합격 알림 시점 — 취소 모달 alreadySent/pending 분기 */
  const [finalResultNotifyById, setFinalResultNotifyById] = useState<
    Record<string, PermissionModalNotifyTiming>
  >({})

  const withFinalResultNotifyTiming = useCallback(
    (row: GeneralVolunteerApplicantRow): GeneralVolunteerApplicantRow => {
      const timing = finalResultNotifyById[row.id] ?? row.finalResultNotifyTiming
      return timing ? { ...row, finalResultNotifyTiming: timing } : row
    },
    [finalResultNotifyById]
  )

  const effectiveStatusServerFilterActive =
    subjectKind === 'volunteer' &&
    volunteerRemote.remoteEnabled &&
    (appliedFilters.secondInterviewScreeningStatus === 'waiting' ||
      appliedFilters.secondInterviewScreeningStatus === 'completed')

  useGeneralInterview2EffectiveStatusTick(list, {
    onServerRefetch: effectiveStatusServerFilterActive
      ? volunteerRemote.refetchVolunteerList
      : undefined,
  })

  useEffect(() => {
    if (volunteerRemote.remoteEnabled) return
    setList([])
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setViewMode('list')
    setSelectedRowKeys([])
    setWithdrawTargetId(null)
    setBulkPassModalOpen(false)
    setBulkFailModalOpen(false)
    setBulkFailCompleteCount(null)
    setPassModalVolunteer(null)
    setFailModalVolunteer(null)
    setPassCompleteVolunteerName(null)
    setFailCompleteVolunteer(null)
    setCancelPassVolunteer(null)
    setCancelFailVolunteer(null)
    setFinalResultNotifyById({})
  }, [programId, subjectKind, volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(() => {
    const filtered =
      volunteerRemote.remoteEnabled && subjectKind === 'volunteer'
        ? filterGeneralInterview2ApplicantsRemoteClientOnly(list)
        : filterGeneralInterview2Applicants(list, appliedFilters)
    return sortInterview2Rows(filtered)
  }, [appliedFilters, list, sortInterview2Rows, subjectKind, volunteerRemote.remoteEnabled])

  const calendarFilteredData = useMemo(() => {
    const filtered =
      volunteerRemote.remoteEnabled && subjectKind === 'volunteer'
        ? filterGeneralInterview2ApplicantsRemoteClientOnly(list)
        : filterGeneralInterview2CalendarApplicants(list, appliedFilters)
    return sortInterview2Rows(filtered)
  }, [appliedFilters, list, sortInterview2Rows, subjectKind, volunteerRemote.remoteEnabled])

  const calendarEvents = useMemo(
    () => mapGeneralVolunteerAssignedInterviewToCalendarEvents(calendarFilteredData),
    [calendarFilteredData]
  )

  const count =
    volunteerRemote.remoteEnabled &&
    subjectKind === 'volunteer' &&
    volunteerRemote.listTotalElements != null &&
    viewMode === 'list'
      ? volunteerRemote.listTotalElements
      : viewMode === 'calendar'
        ? calendarFilteredData.length
        : tableData.length

  const handleViewCalendar = useCallback(() => {
    setSelectedRowKeys([])
    setViewMode('calendar')
  }, [])

  const handleViewList = useCallback(() => {
    setViewMode('list')
  }, [])

  const applySecondInterviewStatus = useCallback(
    async (
      ids: string[],
      status: GeneralSecondInterviewScreeningStatus,
      reason?: string,
      notify?: { notifyTiming?: string; scheduledAt?: string }
    ): Promise<boolean> => {
      if (
        status !== 'pass' &&
        status !== 'fail' &&
        status !== 'reserve1' &&
        status !== 'reserve2' &&
        status !== 'reserve3' &&
        status !== 'reserve4'
      ) {
        return false
      }
      if (volunteerRemote.remoteEnabled) {
        return volunteerRemote.applyRemoteFinalResult(ids, status, reason, notify)
      }
      notifyProgramApiUnavailable('general-volunteer-interview2-action', '봉사자 2차 면접 심사')
      return false
    },
    [volunteerRemote]
  )

  const openPassModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerInterview2Pass(applicant)) return
    if (!isGeneralVolunteerInterview2SelectableForResult(applicant)) return
    setPassModalVolunteer(applicant)
  }, [])

  const closePassModal = useCallback(() => {
    setPassModalVolunteer(null)
  }, [])

  const openFailModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerInterview2Fail(applicant)) return
    if (!isGeneralVolunteerInterview2SelectableForResult(applicant)) return
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

  /**
   * 개인 프로그램 봉사자 — 합격 유형 「합격」이면 교육 배정 안내 후 approve-with-education-scope.
   * (BE: 면접 ON이면 면접 평가 완료 후 허용, final-result PASS와 같은 결정 경로라 둘을 함께 부르지 않는다)
   * 예비합격·참여자·기관형은 기존 final-result.
   */
  const educationAssignOnPass = subjectKind === 'volunteer' && isGeneralIndividualProgram(program)
  const educationAssign = useGeneralVolunteerEducationAssignApproval({
    programId,
    invalidateApplications: volunteerRemote.invalidateApplications,
    onApproved: target => {
      setFinalResultNotifyById(prev => ({ ...prev, [target.applicationId]: target.notifyTiming }))
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== target.applicationId))
      setPassCompleteVolunteerName(target.volunteerName)
    },
  })
  const openEducationAssign = educationAssign.open

  const handlePassModalConfirm = useCallback(
    async (payload: Interview2PassConfirmPayload) => {
      if (!passModalVolunteer) return
      const { id, name: volunteerName } = passModalVolunteer
      if (educationAssignOnPass && (payload.passType ?? 'pass') === 'pass') {
        closePassModal()
        openEducationAssign({
          applicationId: id,
          volunteerName,
          notifyTiming: payload.notifyTiming,
          manualNotifyAt: payload.manualNotifyAt,
        })
        return
      }
      const ok = await applySecondInterviewStatus(
        [id],
        payload.passType ?? 'pass',
        undefined,
        toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt)
      )
      closePassModal()
      if (!ok) return
      setFinalResultNotifyById(prev => ({ ...prev, [id]: payload.notifyTiming }))
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      setPassCompleteVolunteerName(volunteerName)
    },
    [
      applySecondInterviewStatus,
      closePassModal,
      educationAssignOnPass,
      openEducationAssign,
      passModalVolunteer,
    ]
  )

  const handleFailModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!failModalVolunteer) return
      const { name, id } = failModalVolunteer
      const ok = await applySecondInterviewStatus(
        [id],
        'fail',
        payload.reason,
        toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt)
      )
      setFailModalVolunteer(null)
      if (!ok) return
      setFinalResultNotifyById(prev => ({ ...prev, [id]: payload.notifyTiming }))
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
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
      subjectKind,
      onOpenSingleFail: () => {
        const applicant = selectedRows[0]
        if (applicant) openFailModal(applicant)
      },
      onOpenBulkFail: () => setBulkFailModalOpen(true),
    })
  }, [list, openFailModal, selectedRowKeys, subjectKind])

  const closeBulkFailModal = useCallback(() => {
    setBulkFailModalOpen(false)
  }, [])

  const closeBulkFailCompleteModal = useCallback(() => {
    setBulkFailCompleteCount(null)
  }, [])

  const confirmBulkFail = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const ok = await applySecondInterviewStatus(
        ids,
        'fail',
        payload.reason,
        toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt)
      )
      setBulkFailModalOpen(false)
      if (!ok) return
      setSelectedRowKeys([])
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
      subjectKind,
      onOpenSinglePass: () => {
        const applicant = selectedRows[0]
        if (applicant) openPassModal(applicant)
      },
      onOpenBulkPass: () => setBulkPassModalOpen(true),
    })
  }, [list, openPassModal, selectedRowKeys, subjectKind])

  const closeBulkPassModal = useCallback(() => {
    setBulkPassModalOpen(false)
  }, [])

  const confirmBulkPass = useCallback(
    async (payload: Interview2PassConfirmPayload) => {
      const ids = selectedRowKeys.map(String)
      const ok = await applySecondInterviewStatus(
        ids,
        payload.passType ?? 'pass',
        undefined,
        toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt)
      )
      setBulkPassModalOpen(false)
      if (!ok) return
      // 시안 12-2(9781:52820) — 봉사자·개인 참여자 공통(Note 9896:142852)
      showAlert({ title: '합격 처리 완료', content: '면접 결과가 합격 처리되었습니다.' })
      setSelectedRowKeys([])
    },
    [applySecondInterviewStatus, selectedRowKeys, showAlert]
  )

  const requestWithdrawActivity = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (!guardGeneralVolunteerWithdrawActivity(row)) return
      if (activityWithdrawScheduleOptions.length === 0) {
        showAlert({
          title: '안내',
          content: '활동 포기 처리할 수 있는 교육 일정이 없습니다.',
        })
        return
      }
      setWithdrawTargetId(row.id)
    },
    [activityWithdrawScheduleOptions.length, showAlert]
  )

  const cancelWithdrawActivity = useCallback(() => {
    setWithdrawTargetId(null)
  }, [])

  const confirmWithdrawActivity = useCallback(
    async (payload: GeneralVolunteerScreeningActivityWithdrawModalPayload) => {
      if (!withdrawTargetId || withdrawSubmitting) return
      const row = list.find(item => item.id === withdrawTargetId)
      if (!row) {
        setWithdrawTargetId(null)
        return
      }
      if (!volunteerRemote.remoteEnabled) {
        notifyProgramApiUnavailable('general-volunteer-give-up', '봉사자 활동 포기')
        setWithdrawTargetId(null)
        return
      }
      const stopScheduleId = resolveGeneralVolunteerActivityWithdrawStopScheduleId(
        program,
        programSchedulesQuery.data ?? [],
        payload.stopSessionKey
      )
      const reason = `활동 포기 (${payload.stopScheduleLabel})`
      setWithdrawSubmitting(true)
      try {
        const handled = await volunteerRemote.applyRemoteGiveUp?.(withdrawTargetId, {
          reason,
          ...(stopScheduleId != null ? { stopScheduleId } : {}),
          faultParty: payload.faultParty,
        })
        if (!handled) return
        setWithdrawTargetId(null)
        setWithdrawCompleteVolunteerName(row.name)
      } finally {
        setWithdrawSubmitting(false)
      }
    },
    [
      list,
      program,
      programSchedulesQuery.data,
      volunteerRemote,
      withdrawSubmitting,
      withdrawTargetId,
    ]
  )

  const closeWithdrawCompleteModal = useCallback(() => {
    setWithdrawCompleteVolunteerName(null)
  }, [])

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

  const openCancelPassModal = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (
        !hasExplicitApplicationAction(row.availableActions, APPLICATION_ACTION_CANCEL_FINAL_PASS)
      ) {
        return
      }
      setCancelPassVolunteer(withFinalResultNotifyTiming(row))
    },
    [withFinalResultNotifyTiming]
  )

  const closeCancelPassModal = useCallback(() => {
    setCancelPassVolunteer(null)
  }, [])

  const openCancelFailModal = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (
        !hasExplicitApplicationAction(row.availableActions, APPLICATION_ACTION_CANCEL_FINAL_FAIL)
      ) {
        return
      }
      setCancelFailVolunteer(withFinalResultNotifyTiming(row))
    },
    [withFinalResultNotifyTiming]
  )

  const closeCancelFailModal = useCallback(() => {
    setCancelFailVolunteer(null)
  }, [])

  /**
   * 합격 취소 → 자동 반려(FAIL).
   * Notion/시안 공통 승인 취소 팝업과 동일 UX. API는 final-result FAIL
   * (서류 승인 취소를 건드리지 않도록 문서 cancel-approval 미사용).
   */
  const handleCancelPassConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!cancelPassVolunteer) return
      const { id } = cancelPassVolunteer
      const notify = toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt)
      const ok = await applySecondInterviewStatus(
        [id],
        'fail',
        payload.reason.trim() || '합격 취소',
        {
          notifyTiming: notify.notifyTiming,
          scheduledAt: notify.scheduledAt,
        }
      )
      if (!ok) return
      setFinalResultNotifyById(prev => ({ ...prev, [id]: payload.notifyTiming }))
      setCancelPassVolunteer(null)
      showAlert({
        title: '취소 완료',
        content: MESSAGES.success.cancelled,
      })
    },
    [applySecondInterviewStatus, cancelPassVolunteer, showAlert]
  )

  /**
   * 불합격 취소 → 심사 대기.
   * Notion 공통 반려 취소 팝업과 동일 UX.
   * BE cancel-rejection이 final FAIL(서류 PASS 유지)을 waiting으로 되돌리는 계약을 사용.
   */
  const handleCancelFailConfirm = useCallback(
    async (payload: VolunteerInterview2CancelFailConfirmPayload) => {
      if (!cancelFailVolunteer) return
      if (!volunteerRemote.remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-volunteer-interview2-cancel-fail',
          '봉사자 면접 불합격 취소'
        )
        setCancelFailVolunteer(null)
        return
      }
      const reason =
        payload.variant === 'alreadySent' ? payload.reason : payload.reason.trim() || '불합격 취소'
      const notification =
        payload.variant === 'alreadySent'
          ? toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)?.notification
          : undefined
      const ok = await volunteerRemote.applyRemoteDocumentCancelRejection(
        cancelFailVolunteer.id,
        reason,
        notification
      )
      if (!ok) return
      setFinalResultNotifyById(prev => {
        const next = { ...prev }
        delete next[cancelFailVolunteer.id]
        return next
      })
      setCancelFailVolunteer(null)
      showAlert({
        title: '취소 완료',
        content: MESSAGES.success.cancelled,
      })
    },
    [cancelFailVolunteer, showAlert, volunteerRemote]
  )

  const saveInterviewEvaluation = useCallback(
    async (
      row: GeneralVolunteerApplicantRow,
      payload: GeneralVolunteerInterviewEvaluationPayload
    ): Promise<boolean> => {
      if (!guardGeneralVolunteerInterview2Evaluation(row)) return false

      if (!volunteerRemote.remoteEnabled) {
        notifyProgramApiUnavailable('general-volunteer-interview-evaluation', '봉사자 면접 평가')
        return false
      }
      const result = await volunteerRemote.applyRemoteInterviewEvaluation?.(
        row.interviewAssignmentId,
        {
          ...(payload.managerAScore != null ? { managerAScore: payload.managerAScore } : {}),
          ...(payload.managerBScore != null ? { managerBScore: payload.managerBScore } : {}),
          comment: payload.interviewEvaluationRemark?.trim() || undefined,
        }
      )
      if (result === 'missing_assignment' || result === 'error' || result === 'skipped') {
        return false
      }
      if (result === 'ok') {
        showAlert({
          title: '면접 평가',
          content: '면접 평가가 저장되었습니다.',
        })
        return true
      }
      return false
    },
    [showAlert, volunteerRemote]
  )

  const columns = useGeneralVolunteerInterview2Columns({ subjectKind })

  return {
    educationAssign,
    educationAssignOnPass,
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
    bulkPassSubjectName:
      list.find(row => selectedRowKeys.map(String).includes(row.id))?.name ?? '',
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
    withdrawSubmitting,
    activityWithdrawScheduleOptions,
    withdrawCompleteVolunteerName,
    closeWithdrawCompleteModal,
    requestInterview2Pass,
    requestInterview2Fail,
    cancelPassVolunteer,
    cancelFailVolunteer,
    openCancelPassModal,
    closeCancelPassModal,
    openCancelFailModal,
    closeCancelFailModal,
    handleCancelPassConfirm,
    handleCancelFailConfirm,
    saveInterviewEvaluation,
    filterRowsSource: list,
    applicationsLoading: volunteerRemote.applicationsLoading,
    hasNextPage: volunteerRemote.hasNextPage,
    isFetchingNextPage: volunteerRemote.isFetchingNextPage,
    fetchNextPage: volunteerRemote.fetchNextPage,
  }
}
