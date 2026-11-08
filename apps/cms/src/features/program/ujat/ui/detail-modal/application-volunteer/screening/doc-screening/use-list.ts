import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'
import type { ColumnsType } from 'antd/es/table'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { toScreeningNotifyFields } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  sortUjatVolunteerApplicants,
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import {
  DOCUMENT_EVALUATION_ERROR_ALERT_TITLE,
  readDocumentEvaluationErrorMessage,
  shouldShowDocumentEvaluationErrorAlert,
} from '@/features/program/shared/lib/document-evaluation-error'
import { shouldSkipLocalApiErrorAlert } from '@/features/program/shared/lib/interview-not-ended'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatVolunteerDoc1ListQuery } from '@/features/program/ujat/api/applications-list-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { invalidateUjatVolunteerApplicationLists } from '@/features/program/ujat/api/volunteer-application-list-cache'
import {
  submitUjatVolunteerDocumentResultsRemote,
  updateUjatVolunteerDocumentEvaluationRemote,
} from '@/features/program/ujat/api/volunteer-mutations'
import {
  UJAT_DOCUMENT_SCREENING_STATUS_LABELS,
  UJAT_MANAGER_EVALUATION_LABELS,
  UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatUjatVolunteerEssayCellValue,
  type UjatManagerEvaluation,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  type UjatVolunteerDocScreeningFilters,
} from './filter-fields'
import { useUjatVolunteerDocScreeningColumns } from './columns'
import {
  alertUjatVolunteerDocumentSelectionRequired,
  patchUjatVolunteerDocumentScreeningStatus,
} from './document-actions'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  showApplicationApprovalCompletedAlert,
  showApplicationRejectionCompletedAlert,
} from '@/shared/ui'

const EXPORT_COLUMNS_UJAT: ColumnsType<Record<string, string | number>> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '신청 봉사자명', dataIndex: 'name', key: 'name' },
  { title: '신청자 학년', dataIndex: 'grade', key: 'grade' },
  { title: '희망 교육 활동 지역', dataIndex: 'preferredRegion', key: 'preferredRegion' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '교육 진행 경험', dataIndex: 'educationExperience', key: 'educationExperience' },
  { title: '지원 형태', dataIndex: 'applicationTypeLabel', key: 'applicationTypeLabel' },
  {
    title: UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES.essayIntro,
    dataIndex: 'essayIntro',
    key: 'essayIntro',
  },
  {
    title: UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES.essayEducationExperience,
    dataIndex: 'essayEducationExperience',
    key: 'essayEducationExperience',
  },
  {
    title: UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES.essayNecessity,
    dataIndex: 'essayNecessity',
    key: 'essayNecessity',
  },
  {
    title: UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES.essayJaExperience,
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

function toExportRowUjat(row: UjatVolunteerApplicantRow): Record<string, string | number> {
  return {
    no: row.no,
    name: row.name,
    grade: row.grade,
    preferredRegion: row.preferredRegion,
    contact: row.contact,
    email: row.email,
    educationExperience:
      row.hasEducationExperience == null ? '-' : row.hasEducationExperience ? 'O' : 'X',
    applicationTypeLabel: formatUjatVolunteerApplicationType(row.applicationType),
    essayIntro: formatUjatVolunteerEssayCellValue(row.applicationType, row.essayIntro),
    essayEducationExperience: formatUjatVolunteerEssayCellValue(
      row.applicationType,
      row.essayEducationExperience
    ),
    essayNecessity: formatUjatVolunteerEssayCellValue(row.applicationType, row.essayNecessity),
    essayJaExperience: formatUjatVolunteerEssayCellValue(
      row.applicationType,
      row.essayJaExperience
    ),
    managerAEvaluationLabel: UJAT_MANAGER_EVALUATION_LABELS[row.managerAEvaluation],
    managerBEvaluationLabel: UJAT_MANAGER_EVALUATION_LABELS[row.managerBEvaluation],
    documentScreeningStatusLabel:
      UJAT_DOCUMENT_SCREENING_STATUS_LABELS[row.documentScreeningStatus],
  }
}

export function useUjatVolunteerDocScreening({
  programId,
  half,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
}) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-application-volunteer-doc-screening',
    'UJAT 봉사자 신청 · 1차 서류 심사'
  )

  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [approveModalVolunteer, setApproveModalVolunteer] =
    useState<UjatVolunteerApplicantRow | null>(null)
  const [rejectModalVolunteer, setRejectModalVolunteer] =
    useState<UjatVolunteerApplicantRow | null>(null)
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() => [])
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerDocScreeningFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerDocScreeningFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)

  const listQuery = useMemo(
    () => buildUjatVolunteerDoc1ListQuery(appliedFilters, half),
    [appliedFilters, half]
  )

  const applicationsQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.volunteerApplications(programId, half, 'doc1', listQuery),
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
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
    setSelectedRowKeys([])
  }, [programId, half])

  useEffect(() => {
    setList(previous =>
      queriedRows.map(row => previous.find(current => current.id === row.id) ?? row)
    )
  }, [queriedRows])

  const invalidateVolunteerLists = useCallback(async () => {
    await invalidateUjatVolunteerApplicationLists(queryClient, programId)
  }, [programId, queryClient])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  /** 조회 — appliedFilters 갱신 → queryKey 변경 → 서버 필터 재요청 */
  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(
    () => sortUjatVolunteerApplicants(list),
    [list]
  )
  const infiniteScrollResetKey = useMemo(
    () => `${programId}:${half}:${JSON.stringify(appliedFilters)}`,
    [appliedFilters, half, programId]
  )

  const exportRows = useMemo(() => filteredSorted.map(toExportRowUjat), [filteredSorted])

  const excelExport = useMemo<FilterTableExcelExportConfig>(
    () => ({
      columns: EXPORT_COLUMNS_UJAT,
      data: exportRows,
    }),
    [exportRows]
  )

  const updateRow = useCallback((id: string, patch: Partial<UjatVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const onManagerAEvaluationChange = useCallback(
    (id: string, evaluation: UjatManagerEvaluation) => {
      const previousEvaluation = list.find(row => row.id === id)?.managerAEvaluation
      updateRow(id, { managerAEvaluation: evaluation })
      void updateUjatVolunteerDocumentEvaluationRemote(id, 'A', evaluation).catch(error => {
        if (previousEvaluation != null) {
          updateRow(id, { managerAEvaluation: previousEvaluation })
        }
        if (shouldShowDocumentEvaluationErrorAlert(error)) {
          showAlert({
            title: DOCUMENT_EVALUATION_ERROR_ALERT_TITLE,
            content: readDocumentEvaluationErrorMessage(error),
          })
        }
        void invalidateVolunteerLists()
      })
    },
    [invalidateVolunteerLists, list, showAlert, updateRow]
  )

  const onManagerBEvaluationChange = useCallback(
    (id: string, evaluation: UjatManagerEvaluation) => {
      const previousEvaluation = list.find(row => row.id === id)?.managerBEvaluation
      updateRow(id, { managerBEvaluation: evaluation })
      void updateUjatVolunteerDocumentEvaluationRemote(id, 'B', evaluation).catch(error => {
        if (previousEvaluation != null) {
          updateRow(id, { managerBEvaluation: previousEvaluation })
        }
        if (shouldShowDocumentEvaluationErrorAlert(error)) {
          showAlert({
            title: DOCUMENT_EVALUATION_ERROR_ALERT_TITLE,
            content: readDocumentEvaluationErrorMessage(error),
          })
        }
        void invalidateVolunteerLists()
      })
    },
    [invalidateVolunteerLists, list, showAlert, updateRow]
  )

  const columns = useUjatVolunteerDocScreeningColumns({
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
  })

  const applyDocumentScreeningStatus = useCallback(
    async (
      ids: string[],
      status: 'pass' | 'fail',
      payload?: PermissionModalPayload
    ): Promise<boolean> => {
      const notify = toScreeningNotifyFields(payload?.notifyTiming, payload?.manualNotifyAt)
      setList(prev => patchUjatVolunteerDocumentScreeningStatus(prev, ids, status))
      try {
        const bulk = await submitUjatVolunteerDocumentResultsRemote(
          ids,
          status,
          payload?.reason?.trim() || undefined,
          notify
        )
        if (bulk && (bulk.failureCount ?? 0) > 0) {
          showAlert({
            title: '서류 결과 일부 실패',
            content: `요청 ${bulk.requestedCount ?? ids.length}건 중 성공 ${bulk.successCount ?? 0}건, 실패 ${bulk.failureCount ?? 0}건입니다.`,
          })
        }
        await invalidateVolunteerLists()
        return true
      } catch (error) {
        if (!shouldSkipLocalApiErrorAlert(error)) {
          showAlert({
            title: '서류 심사 처리 실패',
            content: readApiErrorAlertMessage(
              error,
              '서류 합격/불합격 처리에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.'
            ),
          })
        }
        await invalidateVolunteerLists()
        return false
      }
    },
    [invalidateVolunteerLists, showAlert]
  )

  const openApproveModal = useCallback((row: UjatVolunteerApplicantRow) => {
    setApproveModalVolunteer(row)
  }, [])

  const openRejectModal = useCallback((row: UjatVolunteerApplicantRow) => {
    setRejectModalVolunteer(row)
  }, [])

  const closeApproveModal = useCallback(() => {
    setApproveModalVolunteer(null)
  }, [])

  const closeRejectModal = useCallback(() => {
    setRejectModalVolunteer(null)
  }, [])

  const closeBulkApproveModal = useCallback(() => {
    setBulkApproveOpen(false)
  }, [])

  const closeBulkRejectModal = useCallback(() => {
    setBulkRejectOpen(false)
  }, [])

  const handleBulkReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) {
      alertUjatVolunteerDocumentSelectionRequired()
      return
    }
    setBulkRejectOpen(true)
  }, [selectedRowKeys])

  const handleBulkApprove = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) {
      alertUjatVolunteerDocumentSelectionRequired()
      return
    }
    setBulkApproveOpen(true)
  }, [selectedRowKeys])

  const handleApproveModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!approveModalVolunteer) return
      const { id } = approveModalVolunteer
      const ok = await applyDocumentScreeningStatus([id], 'pass', payload)
      setApproveModalVolunteer(null)
      if (!ok) return
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      showApplicationApprovalCompletedAlert()
    },
    [applyDocumentScreeningStatus, approveModalVolunteer]
  )

  const handleRejectModalConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!rejectModalVolunteer) return
      const { id } = rejectModalVolunteer
      const ok = await applyDocumentScreeningStatus([id], 'fail', payload)
      setRejectModalVolunteer(null)
      if (!ok) return
      setSelectedRowKeys(prev => prev.filter(key => String(key) !== id))
      showApplicationRejectionCompletedAlert()
    },
    [applyDocumentScreeningStatus, rejectModalVolunteer]
  )

  const handleBulkApproveConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const ok = await applyDocumentScreeningStatus(ids, 'pass', payload)
      setBulkApproveOpen(false)
      if (!ok) return
      setSelectedRowKeys([])
      showApplicationApprovalCompletedAlert()
    },
    [applyDocumentScreeningStatus, selectedRowKeys]
  )

  const handleBulkRejectConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      const ids = selectedRowKeys.map(String)
      if (ids.length === 0) return
      const ok = await applyDocumentScreeningStatus(ids, 'fail', payload)
      setBulkRejectOpen(false)
      if (!ok) return
      setSelectedRowKeys([])
      showApplicationRejectionCompletedAlert()
    },
    [applyDocumentScreeningStatus, selectedRowKeys]
  )

  return {
    list,
    setList,
    updateRow,
    applyDocumentScreeningStatus,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData: filteredSorted,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkReject,
    handleBulkApprove,
    excelExport,
    approveModalVolunteer,
    rejectModalVolunteer,
    bulkApproveOpen,
    bulkRejectOpen,
    openApproveModal,
    openRejectModal,
    closeApproveModal,
    closeRejectModal,
    closeBulkApproveModal,
    closeBulkRejectModal,
    handleApproveModalConfirm,
    handleRejectModalConfirm,
    handleBulkApproveConfirm,
    handleBulkRejectConfirm,
    count: filteredSorted.length,
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
