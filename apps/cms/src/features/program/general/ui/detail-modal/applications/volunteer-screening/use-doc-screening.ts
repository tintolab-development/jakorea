import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'
import {
  getGeneralVolunteerDoc1Applicants,
  patchGeneralVolunteerDocumentScreeningCancel,
  patchGeneralVolunteerDocumentScreeningStatus,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
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
import { useGeneralVolunteerDocScreeningColumns } from './doc-screening-columns'
import {
  requestGeneralVolunteerDocumentBulkApprove,
  requestGeneralVolunteerDocumentBulkReject,
} from './general-volunteer-document-screening-actions'

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
  { title: '1차 서류 심사 현황', dataIndex: 'documentScreeningStatusLabel', key: 'documentScreeningStatusLabel' },
]

function toExportRow(row: GeneralVolunteerApplicantRow): Record<string, string | number> {
  return {
    no: row.no,
    name: row.name,
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
    documentScreeningStatusLabel:
      GENERAL_DOCUMENT_SCREENING_STATUS_LABELS[row.documentScreeningStatus],
  }
}

export function useGeneralVolunteerDocScreening({ programId }: { programId: string }) {
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkApproveCompleteCount, setBulkApproveCompleteCount] = useState<number | null>(null)
  const [bulkRejectCompleteCount, setBulkRejectCompleteCount] = useState<number | null>(null)
  const [approveModalVolunteer, setApproveModalVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const [rejectModalVolunteer, setRejectModalVolunteer] =
    useState<GeneralVolunteerApplicantRow | null>(null)
  const [approveCompleteVolunteerName, setApproveCompleteVolunteerName] = useState<string | null>(
    null
  )
  const [rejectCompleteVolunteer, setRejectCompleteVolunteer] = useState<{
    name: string
    reason: string
  } | null>(null)
  const [cancelApprovalTargetId, setCancelApprovalTargetId] = useState<string | null>(null)
  const [cancelRejectTargetId, setCancelRejectTargetId] = useState<string | null>(null)
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    getGeneralVolunteerDoc1Applicants(programId)
  )
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerDoc1Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerDoc1Filters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)

  useEffect(() => {
    setList(getGeneralVolunteerDoc1Applicants(programId))
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS })
    setSelectedRowKeys([])
  }, [programId])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(
    () => filterGeneralDoc1Applicants(list, appliedFilters),
    [appliedFilters, list]
  )

  const exportRows = useMemo(() => tableData.map(toExportRow), [tableData])

  const excelExport = useMemo<FilterTableExcelExportConfig>(
    () => ({
      columns: EXPORT_COLUMNS,
      data: exportRows,
    }),
    [exportRows]
  )

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const cancelApprovalVolunteer = useMemo(
    () =>
      cancelApprovalTargetId
        ? (list.find(row => row.id === cancelApprovalTargetId) ?? null)
        : null,
    [cancelApprovalTargetId, list]
  )

  const cancelRejectVolunteer = useMemo(
    () =>
      cancelRejectTargetId ? (list.find(row => row.id === cancelRejectTargetId) ?? null) : null,
    [cancelRejectTargetId, list]
  )

  const applyDocumentScreeningStatus = useCallback(
    (ids: string[], status: 'pass' | 'fail', notifyTiming?: PermissionModalPayload['notifyTiming']) => {
      setList(prev => patchGeneralVolunteerDocumentScreeningStatus(prev, ids, status, notifyTiming))
    },
    []
  )

  const applyDocumentScreeningCancel = useCallback((id: string) => {
    setList(prev => patchGeneralVolunteerDocumentScreeningCancel(prev, id))
  }, [])

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

  const closeBulkApproveCompleteModal = useCallback(() => {
    setBulkApproveCompleteCount(null)
  }, [])

  const closeBulkRejectCompleteModal = useCallback(() => {
    setBulkRejectCompleteCount(null)
  }, [])

  const closeApproveCompleteModal = useCallback(() => {
    setApproveCompleteVolunteerName(null)
  }, [])

  const closeRejectCompleteModal = useCallback(() => {
    setRejectCompleteVolunteer(null)
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
    (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const approvedCount = ids.length
      applyDocumentScreeningStatus(ids, 'pass', payload.notifyTiming)
      setSelectedRowKeys([])
      setBulkApproveOpen(false)
      setBulkApproveCompleteCount(approvedCount)
    },
    [applyDocumentScreeningStatus, selectedRowKeys]
  )

  const handleBulkRejectConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const rejectedCount = ids.length
      applyDocumentScreeningStatus(ids, 'fail', payload.notifyTiming)
      setSelectedRowKeys([])
      setBulkRejectOpen(false)
      setBulkRejectCompleteCount(rejectedCount)
    },
    [applyDocumentScreeningStatus, selectedRowKeys]
  )

  const handleApproveModalConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (!approveModalVolunteer) return
      const volunteerName = approveModalVolunteer.name
      applyDocumentScreeningStatus([approveModalVolunteer.id], 'pass', payload.notifyTiming)
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== approveModalVolunteer.id))
      setApproveModalVolunteer(null)
      setApproveCompleteVolunteerName(volunteerName)
    },
    [applyDocumentScreeningStatus, approveModalVolunteer]
  )

  const handleRejectModalConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (!rejectModalVolunteer) return
      const { name, id } = rejectModalVolunteer
      applyDocumentScreeningStatus([id], 'fail', payload.notifyTiming)
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      setRejectModalVolunteer(null)
      setRejectCompleteVolunteer({ name, reason: payload.reason })
    },
    [applyDocumentScreeningStatus, rejectModalVolunteer]
  )

  const handleCancelApprovalConfirm = useCallback(
    (_payload: PermissionModalPayload) => {
      if (!cancelApprovalVolunteer) return
      applyDocumentScreeningCancel(cancelApprovalVolunteer.id)
      setCancelApprovalTargetId(null)
    },
    [applyDocumentScreeningCancel, cancelApprovalVolunteer]
  )

  const handleCancelRejectConfirm = useCallback(
    (_payload: VolunteerDocumentCancelRejectionConfirmPayload) => {
      if (!cancelRejectVolunteer) return
      applyDocumentScreeningCancel(cancelRejectVolunteer.id)
      setCancelRejectTargetId(null)
    },
    [applyDocumentScreeningCancel, cancelRejectVolunteer]
  )

  const handleBulkReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    requestGeneralVolunteerDocumentBulkReject({
      selectedIds: ids,
      onOpenSingleReject: () => {
        const applicant = list.find(row => row.id === ids[0])
        if (applicant) openRejectModal(applicant)
      },
      onOpenBulkReject: () => setBulkRejectOpen(true),
    })
  }, [list, openRejectModal, selectedRowKeys])

  const handleBulkApprove = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    requestGeneralVolunteerDocumentBulkApprove({
      selectedIds: ids,
      onOpenSingleApprove: () => {
        const applicant = list.find(row => row.id === ids[0])
        if (applicant) openApproveModal(applicant)
      },
      onOpenBulkApprove: () => setBulkApproveOpen(true),
    })
  }, [list, openApproveModal, selectedRowKeys])

  const onManagerAEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      updateRow(id, { managerAEvaluation: evaluation })
    },
    [updateRow]
  )

  const onManagerBEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      updateRow(id, { managerBEvaluation: evaluation })
    },
    [updateRow]
  )

  const columns = useGeneralVolunteerDocScreeningColumns({
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
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
    count: tableData.length,
    bulkApproveOpen,
    bulkRejectOpen,
    closeBulkApproveModal,
    closeBulkRejectModal,
    handleBulkApproveConfirm,
    handleBulkRejectConfirm,
    bulkApproveCompleteCount,
    bulkRejectCompleteCount,
    closeBulkApproveCompleteModal,
    closeBulkRejectCompleteModal,
    approveCompleteVolunteerName,
    closeApproveCompleteModal,
    rejectCompleteVolunteer,
    closeRejectCompleteModal,
    approveModalVolunteer,
    rejectModalVolunteer,
    closeApproveModal,
    closeRejectModal,
    openApproveModal,
    openRejectModal,
    handleApproveModalConfirm,
    handleRejectModalConfirm,
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
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  }
}
