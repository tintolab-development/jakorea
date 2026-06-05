import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerInterview2Applicants,
  patchGeneralVolunteerInterviewEvaluation,
  patchGeneralVolunteerSecondInterviewScreeningStatus,
  type GeneralVolunteerApplicantRow,
  type GeneralVolunteerInterviewEvaluationPayload,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  filterGeneralInterview2Applicants,
  type GeneralVolunteerInterview2Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS,
  type GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralVolunteerInterview2Columns } from './interview2-columns'
import type { GeneralInterview2ConfirmRequest } from './general-volunteer-interview2-actions'
import {
  confirmGeneralVolunteerInterview2Fail,
  confirmGeneralVolunteerInterview2Pass,
  openGeneralVolunteerInterview2BulkPassModal,
} from './general-volunteer-interview2-actions'
import type { GeneralInterview2BulkPassConfirmPayload } from './general-volunteer-interview2-bulk-pass-modal'
import {
  guardGeneralVolunteerInterview2Evaluation,
  guardGeneralVolunteerInterview2Fail,
  guardGeneralVolunteerInterview2Pass,
  guardGeneralVolunteerWithdrawActivity,
} from './general-volunteer-applicant-guard-actions'

export function useGeneralVolunteerInterview2({ programId }: { programId: string }) {
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    getGeneralVolunteerInterview2Applicants(programId)
  )
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerInterview2Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [interview2Confirm, setInterview2Confirm] = useState<GeneralInterview2ConfirmRequest | null>(
    null
  )
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null)
  const [evaluationTargetId, setEvaluationTargetId] = useState<string | null>(null)
  const [bulkPassModalOpen, setBulkPassModalOpen] = useState(false)

  useEffect(() => {
    setList(getGeneralVolunteerInterview2Applicants(programId))
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setSelectedRowKeys([])
    setInterview2Confirm(null)
    setWithdrawTargetId(null)
    setEvaluationTargetId(null)
    setBulkPassModalOpen(false)
  }, [programId])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(
    () => sortGeneralVolunteerInterview2Applicants(
      filterGeneralInterview2Applicants(list, appliedFilters)
    ),
    [appliedFilters, list]
  )

  const applySecondInterviewStatus = useCallback(
    (ids: string[], status: GeneralSecondInterviewScreeningStatus) => {
      setList(prev => patchGeneralVolunteerSecondInterviewScreeningStatus(prev, ids, status))
      setSelectedRowKeys([])
    },
    []
  )

  const showInterview2Confirm = useCallback((options: GeneralInterview2ConfirmRequest) => {
    setInterview2Confirm(options)
  }, [])

  const closeInterview2Confirm = useCallback(() => {
    setInterview2Confirm(null)
  }, [])

  const handleBulkFail = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    confirmGeneralVolunteerInterview2Fail({
      showConfirm: showInterview2Confirm,
      count: ids.length,
      onConfirm: () => {
        applySecondInterviewStatus(ids, 'fail')
        showAlert({ title: '선택 불합격', content: `${ids.length}건이 불합격 처리되었습니다.` })
      },
    })
  }, [applySecondInterviewStatus, selectedRowKeys, showAlert, showInterview2Confirm])

  const handleBulkPass = useCallback(() => {
    openGeneralVolunteerInterview2BulkPassModal(
      () => setBulkPassModalOpen(true),
      selectedRowKeys.length
    )
  }, [selectedRowKeys.length])

  const closeBulkPassModal = useCallback(() => {
    setBulkPassModalOpen(false)
  }, [])

  const confirmBulkPass = useCallback(
    (payload: GeneralInterview2BulkPassConfirmPayload) => {
      const ids = selectedRowKeys.map(String)
      applySecondInterviewStatus(ids, payload.passType)
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
        content: `선택한 ${ids.length}건이 ${passTypeLabel} 처리되었습니다. (알림: ${notifyLabel}, 목 데이터)`,
      })
      setBulkPassModalOpen(false)
    },
    [applySecondInterviewStatus, selectedRowKeys, showAlert]
  )

  const requestWithdrawActivity = useCallback((row: GeneralVolunteerApplicantRow) => {
    if (!guardGeneralVolunteerWithdrawActivity(row)) return
    setWithdrawTargetId(row.id)
  }, [])

  const cancelWithdrawActivity = useCallback(() => {
    setWithdrawTargetId(null)
  }, [])

  const confirmWithdrawActivity = useCallback(() => {
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
      content: `${row.name} 봉사자가 활동 포기 처리되었습니다.`,
    })
    setWithdrawTargetId(null)
  }, [list, showAlert, withdrawTargetId])

  const withdrawTarget = useMemo(
    () => (withdrawTargetId ? list.find(row => row.id === withdrawTargetId) : undefined),
    [list, withdrawTargetId]
  )

  const requestInterview2Pass = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (!guardGeneralVolunteerInterview2Pass(row)) return
      confirmGeneralVolunteerInterview2Pass({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'pass'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
  )

  const requestInterview2Fail = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      if (!guardGeneralVolunteerInterview2Fail(row)) return
      confirmGeneralVolunteerInterview2Fail({
        showConfirm: showInterview2Confirm,
        count: 1,
        onConfirm: () => applySecondInterviewStatus([row.id], 'fail'),
      })
    },
    [applySecondInterviewStatus, showInterview2Confirm]
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

  const columns = useGeneralVolunteerInterview2Columns()

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count: tableData.length,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    bulkPassModalOpen,
    closeBulkPassModal,
    confirmBulkPass,
    bulkPassCount: selectedRowKeys.length,
    requestWithdrawActivity,
    cancelWithdrawActivity,
    confirmWithdrawActivity,
    withdrawTarget,
    requestInterview2Pass,
    requestInterview2Fail,
    interview2Confirm,
    closeInterview2Confirm,
    openEvaluationModal,
    closeEvaluationModal,
    evaluationTarget,
    saveInterviewEvaluation,
    filterRowsSource: list,
  }
}
