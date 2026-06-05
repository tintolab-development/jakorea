import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { exportTableToExcel } from '@/shared/utils/table-export'
import {
  getGeneralVolunteerDoc1Applicants,
  patchGeneralVolunteerDocumentScreeningStatus,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  filterGeneralDoc1Applicants,
  type GeneralVolunteerDoc1Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  GENERAL_DOCUMENT_SCREENING_STATUS_LABELS,
  GENERAL_MANAGER_EVALUATION_LABELS,
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatGeneralVolunteerApplicationType,
  formatGeneralVolunteerEssayCellValue,
  type GeneralManagerEvaluation,
} from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralVolunteerDocScreeningColumns } from './doc-screening-columns'

export type GeneralVolunteerConfirmRequest = {
  title: string
  content: string
  confirmText: string
  danger?: boolean
  onConfirm: () => void
}

const EXPORT_COLUMNS: ColumnsType<Record<string, string | number>> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '신청 봉사자명', dataIndex: 'name', key: 'name' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '지원 형태', dataIndex: 'applicationTypeLabel', key: 'applicationTypeLabel' },
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
    applicationTypeLabel: formatGeneralVolunteerApplicationType(row.applicationType),
    essayIntro: formatGeneralVolunteerEssayCellValue(row.applicationType, row.essayIntro),
    essayEducationExperience: formatGeneralVolunteerEssayCellValue(
      row.applicationType,
      row.essayEducationExperience
    ),
    essayNecessity: formatGeneralVolunteerEssayCellValue(row.applicationType, row.essayNecessity),
    essayJaExperience: formatGeneralVolunteerEssayCellValue(row.applicationType, row.essayJaExperience),
    managerAEvaluationLabel: GENERAL_MANAGER_EVALUATION_LABELS[row.managerAEvaluation],
    managerBEvaluationLabel: GENERAL_MANAGER_EVALUATION_LABELS[row.managerBEvaluation],
    documentScreeningStatusLabel:
      GENERAL_DOCUMENT_SCREENING_STATUS_LABELS[row.documentScreeningStatus],
  }
}

export function useGeneralVolunteerDocScreening({ programId }: { programId: string }) {
  const { showAlert } = useCmsAlert()
  const [confirmRequest, setConfirmRequest] = useState<GeneralVolunteerConfirmRequest | null>(null)
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
  const [isExporting, setIsExporting] = useState(false)
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

  const updateRow = useCallback((id: string, patch: Partial<GeneralVolunteerApplicantRow>) => {
    setList(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }, [])

  const applyDocumentScreeningStatus = useCallback((ids: string[], status: 'pass' | 'fail') => {
    setList(prev => patchGeneralVolunteerDocumentScreeningStatus(prev, ids, status))
  }, [])

  const showConfirm = useCallback((request: GeneralVolunteerConfirmRequest) => {
    setConfirmRequest(request)
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmRequest(null)
  }, [])

  const handleBulkReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    showConfirm({
      title: '선택 반려',
      content: `${ids.length}건을 반려 처리하시겠습니까?`,
      confirmText: '반려',
      danger: true,
      onConfirm: () => {
        applyDocumentScreeningStatus(ids, 'fail')
        setSelectedRowKeys([])
      },
    })
  }, [applyDocumentScreeningStatus, selectedRowKeys, showConfirm])

  const handleBulkApprove = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    showConfirm({
      title: '선택 승인',
      content: `${ids.length}건을 승인 처리하시겠습니까?`,
      confirmText: '승인',
      onConfirm: () => {
        applyDocumentScreeningStatus(ids, 'pass')
        setSelectedRowKeys([])
      },
    })
  }, [applyDocumentScreeningStatus, selectedRowKeys, showConfirm])

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return
    if (tableData.length === 0) {
      showAlert({ title: '다운로드 안내', content: '다운로드할 데이터가 없습니다.' })
      return
    }
    setIsExporting(true)
    try {
      await exportTableToExcel(
        EXPORT_COLUMNS,
        tableData.map(toExportRow),
        `general-volunteer-${programId}-doc-screening`
      )
    } catch (error) {
      console.error('[general-volunteer-doc-screening] excel export failed', error)
      showAlert({
        title: '다운로드 실패',
        content: '엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, programId, showAlert, tableData])

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
    handleExportExcel,
    isExporting,
    count: tableData.length,
    confirmRequest,
    closeConfirm,
    showConfirm,
    applyDocumentScreeningStatus,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  }
}
