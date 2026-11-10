import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import {
  showApplicationApprovalCompletedAlert,
  showApplicationRejectionCompletedAlert,
} from '@/shared/ui'
import type { ColumnsType } from 'antd/es/table'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { MESSAGES } from '@/shared/constants/messages'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  toNestedDecisionNotification,
  toScreeningNotifyFields,
} from '@/features/program/general/lib/application-decision-notify-timing'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { VolunteerDocumentCancelRejectionConfirmPayload } from '@/features/program/general/lib/volunteer-document-cancel-rejection'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  filterGeneralDoc1Applicants,
  type GeneralVolunteerDoc1Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatGeneralJaVolunteerExperienceCell,
  formatGeneralVolunteerEssayCellValue,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { volunteerProgramApprovalStatusLabel } from '@/features/program/general/lib/volunteer-application-detail-visibility'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { useGeneralVolunteerApplicationsRemote } from '@/features/program/general/hooks/use-general-volunteer-applications-remote'
import { buildGeneralVolunteerDoc1ListQuery } from '@/features/program/general/api/volunteer-list-query'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useGeneralVolunteerDocScreeningColumns } from './doc-screening-columns'
import {
  requestGeneralVolunteerDocumentBulkApprove,
  requestGeneralVolunteerDocumentBulkReject,
} from './general-volunteer-document-screening-actions'
import {
  requestGeneralVolunteerApplicationBulkApprove,
  requestGeneralVolunteerApplicationBulkReject,
} from './general-volunteer-application-decision-actions'

const EXPORT_COLUMNS: ColumnsType<Record<string, string | number>> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '신청 봉사자명', dataIndex: 'name', key: 'name' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: 'JA 봉사 진행 경험', dataIndex: 'jaVolunteerExperience', key: 'jaVolunteerExperience' },
  {
    title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES.essayIntro,
    dataIndex: 'essayIntro',
    key: 'essayIntro',
  },
  {
    title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES.essayEducationExperience,
    dataIndex: 'essayEducationExperience',
    key: 'essayEducationExperience',
  },
  {
    title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES.essayNecessity,
    dataIndex: 'essayNecessity',
    key: 'essayNecessity',
  },
  {
    title: GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES.essayJaExperience,
    dataIndex: 'essayJaExperience',
    key: 'essayJaExperience',
  },
  { title: '담당자 A 평가', dataIndex: 'managerAEvaluationLabel', key: 'managerAEvaluationLabel' },
  { title: '담당자 B 평가', dataIndex: 'managerBEvaluationLabel', key: 'managerBEvaluationLabel' },
  {
    title: '1차 서류 심사 현황',
    dataIndex: 'documentScreeningStatusLabel',
    key: 'documentScreeningStatusLabel',
  },
]

const APPLICATION_EXPORT_COLUMNS: ColumnsType<Record<string, string | number>> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '신청 봉사자명', dataIndex: 'name', key: 'name' },
  { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  {
    title: '프로그램 승인 현황',
    dataIndex: 'documentScreeningStatusLabel',
    key: 'documentScreeningStatusLabel',
  },
]

function resolveDocScreeningExportColumns(
  interviewEnabled: boolean
): ColumnsType<Record<string, string | number>> {
  return interviewEnabled ? EXPORT_COLUMNS : APPLICATION_EXPORT_COLUMNS
}

function toExportRow(
  row: GeneralVolunteerApplicantRow,
  interviewEnabled: boolean
): Record<string, string | number> {
  return {
    no: row.no,
    name: row.name,
    homeAddress: row.homeAddress?.trim() || '-',
    contact: row.contact,
    email: row.email,
    jaVolunteerExperience: formatGeneralJaVolunteerExperienceCell(row.hasJaVolunteerExperience),
    essayIntro: formatGeneralVolunteerEssayCellValue(
      row.applicationType,
      row.hasJaVolunteerExperience,
      row.essayIntro
    ),
    essayEducationExperience: formatGeneralVolunteerEssayCellValue(
      row.applicationType,
      row.hasJaVolunteerExperience,
      row.essayEducationExperience
    ),
    essayNecessity: formatGeneralVolunteerEssayCellValue(
      row.applicationType,
      row.hasJaVolunteerExperience,
      row.essayNecessity
    ),
    essayJaExperience: formatGeneralVolunteerEssayCellValue(
      row.applicationType,
      row.hasJaVolunteerExperience,
      row.essayJaExperience
    ),
    managerAEvaluationLabel: GENERAL_MANAGER_EVALUATION_LABELS[row.managerAEvaluation],
    managerBEvaluationLabel: GENERAL_MANAGER_EVALUATION_LABELS[row.managerBEvaluation],
    documentScreeningStatusLabel: interviewEnabled
      ? GENERAL_DOCUMENT_SCREENING_STATUS_LABELS[row.documentScreeningStatus]
      : volunteerProgramApprovalStatusLabel(row),
  }
}

export function useGeneralVolunteerDocScreening({
  programId,
  interviewEnabled = true,
}: {
  programId: string
  interviewEnabled?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [approveModalVolunteer, setApproveModalVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const [rejectModalVolunteer, setRejectModalVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const [cancelApprovalTargetId, setCancelApprovalTargetId] = useState<string | null>(null)
  const [cancelRejectTargetId, setCancelRejectTargetId] = useState<string | null>(null)
  const remoteEnabled = shouldUseGeneralApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-volunteer-doc-screening',
    '프로그램 신청 · 봉사자 1차 서류 심사'
  )
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() => [])
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerDoc1Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerDoc1Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  }))
  const listQuery = useMemo(
    () => buildGeneralVolunteerDoc1ListQuery(appliedFilters, { interviewEnabled }),
    [appliedFilters, interviewEnabled]
  )
  const volunteerRemote = useGeneralVolunteerApplicationsRemote({
    programId,
    stage: 'doc1',
    enabled: true,
    listQuery,
    setList,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)
  const [updatingManagerEvaluation, setUpdatingManagerEvaluation] = useState<string | null>(null)

  useEffect(() => {
    if (volunteerRemote.remoteEnabled) return
    setList([])
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS })
    setSelectedRowKeys([])
  }, [programId, volunteerRemote.remoteEnabled])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
    setSelectedRowKeys([])
  }, [pendingFilters])

  const tableData = useMemo(
    () =>
      volunteerRemote.remoteEnabled ? list : filterGeneralDoc1Applicants(list, appliedFilters),
    [appliedFilters, list, volunteerRemote.remoteEnabled]
  )

  const exportRows = useMemo(
    () => tableData.map(row => toExportRow(row, interviewEnabled)),
    [interviewEnabled, tableData]
  )

  const excelExport = useMemo<FilterTableExcelExportConfig>(
    () => ({
      accessLog: { downloadKind: 'PROGRAM_VOLUNTEER_APPLICATION_EXPORT', containedPiiTypes: ['NAME'] },
      columns: resolveDocScreeningExportColumns(interviewEnabled),
      data: exportRows,
    }),
    [exportRows, interviewEnabled]
  )

  const cancelApprovalVolunteer = useMemo(
    () =>
      cancelApprovalTargetId ? (list.find(row => row.id === cancelApprovalTargetId) ?? null) : null,
    [cancelApprovalTargetId, list]
  )

  const cancelRejectVolunteer = useMemo(
    () =>
      cancelRejectTargetId ? (list.find(row => row.id === cancelRejectTargetId) ?? null) : null,
    [cancelRejectTargetId, list]
  )

  const applyFinalResultStatus = useCallback(
    async (
      ids: string[],
      status: 'pass' | 'fail',
      notifyTiming?: PermissionModalPayload['notifyTiming'],
      reason?: string,
      scheduledAt?: string
    ): Promise<boolean> => {
      if (volunteerRemote.remoteEnabled) {
        const notify = toScreeningNotifyFields(notifyTiming)
        return volunteerRemote.applyRemoteFinalResult(ids, status, reason, {
          notifyTiming: notify.notifyTiming ?? notifyTiming,
          scheduledAt: scheduledAt ?? notify.scheduledAt,
        })
      }
      notifyProgramApiUnavailable(
        'general-volunteer-application-final-result',
        '봉사자 프로그램 신청 심사'
      )
      return false
    },
    [volunteerRemote]
  )

  const applyDocumentScreeningStatus = useCallback(
    async (
      ids: string[],
      status: 'pass' | 'fail',
      _notifyTiming?: PermissionModalPayload['notifyTiming'],
      reason?: string,
      scheduledAt?: string
    ): Promise<boolean> => {
      if (volunteerRemote.remoteEnabled) {
        const notify = toScreeningNotifyFields(_notifyTiming)
        return volunteerRemote.applyRemoteDocumentResult(
          ids,
          status === 'pass' ? 'PASS' : 'FAIL',
          reason,
          notify.notifyTiming ?? _notifyTiming,
          scheduledAt ?? notify.scheduledAt
        )
      }
      notifyProgramApiUnavailable('general-volunteer-doc-screening-action', '봉사자 1차 서류 심사')
      return false
    },
    [volunteerRemote]
  )

  const applyDocumentScreeningCancelApproval = useCallback(
    async (
      id: string,
      reason: string,
      notification?: import('@/features/program/general/api/applications-api-client').InstructorApplicationNotificationRequest
    ) => {
      if (volunteerRemote.remoteEnabled) {
        return volunteerRemote.applyRemoteDocumentCancelApproval(id, reason, notification)
      }
      notifyProgramApiUnavailable(
        'general-volunteer-document-cancel-approval',
        '봉사자 서류 승인 취소'
      )
      return false
    },
    [volunteerRemote]
  )

  const applyDocumentScreeningCancelRejection = useCallback(
    async (
      id: string,
      reason: string,
      notification?: import('@/features/program/general/api/applications-api-client').InstructorApplicationNotificationRequest
    ) => {
      if (volunteerRemote.remoteEnabled) {
        return volunteerRemote.applyRemoteDocumentCancelRejection(id, reason, notification)
      }
      notifyProgramApiUnavailable(
        'general-volunteer-document-cancel-rejection',
        '봉사자 서류 반려 취소'
      )
      return false
    },
    [volunteerRemote]
  )

  const closeBulkApproveModal = useCallback(() => {
    setBulkApproveOpen(false)
  }, [])

  const closeBulkRejectModal = useCallback(() => {
    setBulkRejectOpen(false)
  }, [])

  const closeApproveModal = useCallback(() => {
    setApproveModalVolunteer(null)
  }, [])

  const closeRejectModal = useCallback(() => {
    setRejectModalVolunteer(null)
  }, [])

  const openApproveModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setApproveModalVolunteer(applicant)
  }, [])

  const openRejectModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setRejectModalVolunteer(applicant)
  }, [])

  const openCancelApprovalModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setCancelApprovalTargetId(applicant.id)
  }, [])

  const openCancelRejectModal = useCallback((applicant: GeneralVolunteerApplicantRow) => {
    setCancelRejectTargetId(applicant.id)
  }, [])

  const closeCancelApprovalModal = useCallback(() => {
    setCancelApprovalTargetId(null)
  }, [])

  const closeCancelRejectModal = useCallback(() => {
    setCancelRejectTargetId(null)
  }, [])

  const handleBulkApproveConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const scheduledAt = toScreeningNotifyFields(
        payload.notifyTiming,
        payload.manualNotifyAt
      ).scheduledAt
      if (interviewEnabled) {
        const ok = await applyDocumentScreeningStatus(
          ids,
          'pass',
          payload.notifyTiming,
          undefined,
          scheduledAt
        )
        setBulkApproveOpen(false)
        if (!ok) return
        setSelectedRowKeys([])
        showApplicationApprovalCompletedAlert()
        return
      }
      const ok = await applyFinalResultStatus(
        ids,
        'pass',
        payload.notifyTiming,
        undefined,
        scheduledAt
      )
      setBulkApproveOpen(false)
      if (!ok) return
      setSelectedRowKeys([])
      showApplicationApprovalCompletedAlert()
    },
    [applyDocumentScreeningStatus, applyFinalResultStatus, interviewEnabled, selectedRowKeys]
  )

  const handleBulkRejectConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const scheduledAt = toScreeningNotifyFields(
        payload.notifyTiming,
        payload.manualNotifyAt
      ).scheduledAt
      const ok = interviewEnabled
        ? await applyDocumentScreeningStatus(
            ids,
            'fail',
            payload.notifyTiming,
            payload.reason,
            scheduledAt
          )
        : await applyFinalResultStatus(ids, 'fail', payload.notifyTiming, payload.reason, scheduledAt)
      setBulkRejectOpen(false)
      if (!ok) return
      setSelectedRowKeys([])
      showApplicationRejectionCompletedAlert()
    },
    [applyDocumentScreeningStatus, applyFinalResultStatus, interviewEnabled, selectedRowKeys]
  )

  const handleApproveModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!approveModalVolunteer) return
      const { id } = approveModalVolunteer
      const scheduledAt = toScreeningNotifyFields(
        payload.notifyTiming,
        payload.manualNotifyAt
      ).scheduledAt
      const ok = interviewEnabled
        ? await applyDocumentScreeningStatus(
            [id],
            'pass',
            payload.notifyTiming,
            undefined,
            scheduledAt
          )
        : await applyFinalResultStatus([id], 'pass', payload.notifyTiming, undefined, scheduledAt)
      setApproveModalVolunteer(null)
      if (!ok) return
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      showApplicationApprovalCompletedAlert()
    },
    [
      applyDocumentScreeningStatus,
      applyFinalResultStatus,
      approveModalVolunteer,
      interviewEnabled,
    ]
  )

  const handleRejectModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!rejectModalVolunteer) return
      const { id } = rejectModalVolunteer
      const scheduledAt = toScreeningNotifyFields(
        payload.notifyTiming,
        payload.manualNotifyAt
      ).scheduledAt
      const ok = interviewEnabled
        ? await applyDocumentScreeningStatus(
            [id],
            'fail',
            payload.notifyTiming,
            payload.reason,
            scheduledAt
          )
        : await applyFinalResultStatus(
            [id],
            'fail',
            payload.notifyTiming,
            payload.reason,
            scheduledAt
          )
      setRejectModalVolunteer(null)
      if (!ok) return
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      showApplicationRejectionCompletedAlert()
    },
    [
      applyDocumentScreeningStatus,
      applyFinalResultStatus,
      interviewEnabled,
      rejectModalVolunteer,
    ]
  )

  const handleCancelApprovalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!cancelApprovalVolunteer) return
      const ok = await applyDocumentScreeningCancelApproval(
        cancelApprovalVolunteer.id,
        payload.reason,
        toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)?.notification
      )
      if (!ok) return
      setCancelApprovalTargetId(null)
      // Figma 「Popup / Text / w600 / 공통 완료」 (1차 서류 승인 취소 완료)
      showAlert({ title: '취소 완료', content: MESSAGES.success.cancelled })
    },
    [applyDocumentScreeningCancelApproval, cancelApprovalVolunteer, showAlert]
  )

  const handleCancelRejectConfirm = useCallback(
    async (payload: VolunteerDocumentCancelRejectionConfirmPayload) => {
      if (!cancelRejectVolunteer) return
      const reason = payload.variant === 'alreadySent' ? payload.reason : '반려 취소'
      const notification =
        payload.variant === 'alreadySent'
          ? toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)?.notification
          : undefined
      const ok = await applyDocumentScreeningCancelRejection(
        cancelRejectVolunteer.id,
        reason,
        notification
      )
      if (!ok) return
      setCancelRejectTargetId(null)
      // 시안 04-2(9781:55044) 반려 취소 완료
      showAlert({ title: '취소 완료', content: MESSAGES.success.cancelled })
    },
    [applyDocumentScreeningCancelRejection, cancelRejectVolunteer, showAlert]
  )

  const handleBulkReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    const selectedRows = list.filter(row => ids.includes(row.id))
    if (!interviewEnabled) {
      requestGeneralVolunteerApplicationBulkReject({
        selectedIds: ids,
        selectedRows,
        onOpenSingleReject: () => {
          const applicant = selectedRows[0]
          if (applicant) openRejectModal(applicant)
        },
        onOpenBulkReject: () => setBulkRejectOpen(true),
      })
      return
    }
    requestGeneralVolunteerDocumentBulkReject({
      selectedIds: ids,
      selectedDocumentStatuses: selectedRows.map(row => row.documentScreeningStatus),
      onOpenSingleReject: () => {
        const applicant = selectedRows[0]
        if (applicant) openRejectModal(applicant)
      },
      onOpenBulkReject: () => setBulkRejectOpen(true),
    })
  }, [interviewEnabled, list, openRejectModal, selectedRowKeys])

  const handleBulkApprove = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    const selectedRows = list.filter(row => ids.includes(row.id))
    if (!interviewEnabled) {
      requestGeneralVolunteerApplicationBulkApprove({
        selectedIds: ids,
        selectedRows,
        onOpenSingleApprove: () => {
          const applicant = selectedRows[0]
          if (applicant) openApproveModal(applicant)
        },
        onOpenBulkApprove: () => setBulkApproveOpen(true),
      })
      return
    }
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: ids,
      selectedDocumentStatuses: selectedRows.map(row => row.documentScreeningStatus),
      onOpenSingleApprove: () => {
        const applicant = selectedRows[0]
        if (applicant) openApproveModal(applicant)
      },
      onOpenBulkApprove: () => setBulkApproveOpen(true),
    })
  }, [interviewEnabled, list, openApproveModal, selectedRowKeys])

  const updateManagerEvaluation = useCallback(
    async (id: string, manager: 'A' | 'B', evaluation: GeneralManagerEvaluation) => {
      const mutationKey = `${id}:${manager}`
      setUpdatingManagerEvaluation(mutationKey)
      try {
        await volunteerRemote.applyRemoteManagerEvaluation(id, manager, evaluation)
      } finally {
        setUpdatingManagerEvaluation(current => (current === mutationKey ? null : current))
      }
    },
    [volunteerRemote]
  )

  const onManagerAEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) =>
      updateManagerEvaluation(id, 'A', evaluation),
    [updateManagerEvaluation]
  )

  const onManagerBEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) =>
      updateManagerEvaluation(id, 'B', evaluation),
    [updateManagerEvaluation]
  )

  const columns = useGeneralVolunteerDocScreeningColumns({
    interviewEnabled,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
    updatingManagerEvaluation,
  })

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkReject,
    handleBulkApprove,
    excelExport,
    count:
      volunteerRemote.remoteEnabled && volunteerRemote.listTotalElements != null
        ? volunteerRemote.listTotalElements
        : tableData.length,
    bulkApproveOpen,
    bulkRejectOpen,
    closeBulkApproveModal,
    closeBulkRejectModal,
    handleBulkApproveConfirm,
    handleBulkRejectConfirm,
    approveModalVolunteer,
    rejectModalVolunteer,
    closeApproveModal,
    closeRejectModal,
    openApproveModal,
    openRejectModal,
    handleApproveModalConfirm,
    handleRejectModalConfirm,
    bulkApproveSubjectName:
      list.find(row => selectedRowKeys.map(String).includes(row.id))?.name ?? '',
    bulkRejectSubjectName:
      list.find(row => selectedRowKeys.map(String).includes(row.id))?.name ?? '',
    cancelApprovalVolunteer,
    cancelRejectVolunteer,
    closeCancelApprovalModal,
    closeCancelRejectModal,
    openCancelApprovalModal,
    openCancelRejectModal,
    handleCancelApprovalConfirm,
    handleCancelRejectConfirm,
    applyDocumentScreeningStatus,
    openManagerDropdown,
    setOpenManagerDropdown,
    updatingManagerEvaluation,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    applicationsLoading: volunteerRemote.applicationsLoading,
    isRemoteDataSource: volunteerRemote.remoteEnabled,
    listQuery,
    hasNextPage: volunteerRemote.hasNextPage,
    isFetchingNextPage: volunteerRemote.isFetchingNextPage,
    fetchNextPage: volunteerRemote.fetchNextPage,
  }
}
