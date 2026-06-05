import { useCallback, useEffect, useMemo, useState, type Key, type RefObject } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { UjatDocumentScreeningConfirmRequest } from './ujat-volunteer-document-screening-actions'
import type { ColumnsType } from 'antd/es/table'
import {
  getUjatVolunteerApplicants,
  sortUjatVolunteerApplicants,
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_DOCUMENT_SCREENING_STATUS_LABELS,
  UJAT_MANAGER_EVALUATION_LABELS,
  UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatUjatVolunteerEssayCellValue,
  type UjatManagerEvaluation,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { exportTableToExcel } from '@/shared/utils/table-export'
import {
  DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL,
  type UjatVolunteerDocScreeningFilters,
} from './ujat-volunteer-doc-screening-filter-fields'
import {
  useUjatVolunteerDocScreeningColumns,
  type UjatEssayColumnKey,
  type UjatEssayColumnWidths,
} from './ujat-volunteer-doc-screening-columns'
import {
  confirmUjatVolunteerDocumentApprove,
  confirmUjatVolunteerDocumentReject,
  patchUjatVolunteerDocumentScreeningStatus,
} from './ujat-volunteer-document-screening-actions'

function filterApplicants(
  rows: UjatVolunteerApplicantRow[],
  filters: UjatVolunteerDocScreeningFilters
): UjatVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (
      filters.grade !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.grade !== filters.grade
    ) {
      return false
    }
    if (
      filters.preferredRegion !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.preferredRegion !== filters.preferredRegion
    ) {
      return false
    }
    if (filters.educationExperience === 'yes' && !row.hasEducationExperience) return false
    if (filters.educationExperience === 'no' && row.hasEducationExperience) return false
    if (
      filters.applicationType !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.applicationType !== filters.applicationType
    ) {
      return false
    }
    if (
      filters.managerAEvaluation !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.managerAEvaluation !== filters.managerAEvaluation
    ) {
      return false
    }
    if (
      filters.managerBEvaluation !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.managerBEvaluation !== filters.managerBEvaluation
    ) {
      return false
    }
    if (
      filters.documentScreeningStatus !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL &&
      row.documentScreeningStatus !== filters.documentScreeningStatus
    ) {
      return false
    }
    return true
  })
}

const EXPORT_COLUMNS_UJAT: ColumnsType<Record<string, string | number>> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '성함/봉사자명', dataIndex: 'name', key: 'name' },
  { title: '신청자 학년', dataIndex: 'grade', key: 'grade' },
  { title: '희망 교육 활동 지역', dataIndex: 'preferredRegion', key: 'preferredRegion' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '교육 진행 경험', dataIndex: 'educationExperience', key: 'educationExperience' },
  { title: '지원유형', dataIndex: 'applicationTypeLabel', key: 'applicationTypeLabel' },
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
  { title: '1차 서류 심사 현황', dataIndex: 'documentScreeningStatusLabel', key: 'documentScreeningStatusLabel' },
]

function toExportRowUjat(row: UjatVolunteerApplicantRow): Record<string, string | number> {
  return {
    no: row.no,
    name: row.name,
    grade: row.grade,
    preferredRegion: row.preferredRegion,
    contact: row.contact,
    email: row.email,
    educationExperience: row.hasEducationExperience ? 'O' : 'X',
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
    documentScreeningStatusLabel: UJAT_DOCUMENT_SCREENING_STATUS_LABELS[row.documentScreeningStatus],
  }
}

export function useUjatVolunteerDocScreening({
  programId,
  half,
  essayColumnWidths,
  onEssayColumnResizeStart,
  onEssayColumnResizeStop,
  tableWrapRef,
}: {
  programId: string
  half: UjatVolunteerRecruitHalf
  essayColumnWidths: UjatEssayColumnWidths
  onEssayColumnResizeStart: () => void
  onEssayColumnResizeStop: (key: UjatEssayColumnKey, width: number) => void
  tableWrapRef: RefObject<HTMLElement | null>
}) {
  const { showAlert } = useCmsAlert()
  const [documentScreeningConfirm, setDocumentScreeningConfirm] =
    useState<UjatDocumentScreeningConfirmRequest | null>(null)
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() =>
    sortUjatVolunteerApplicants(getUjatVolunteerApplicants(programId, half))
  )
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerDocScreeningFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerDocScreeningFilters>(() => ({
    ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
  }))
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)

  useEffect(() => {
    setList(sortUjatVolunteerApplicants(getUjatVolunteerApplicants(programId, half)))
    setPendingFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
    setAppliedFilters({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
    setSelectedRowKeys([])
  }, [programId, half])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    const filtered = filterApplicants(list, appliedFilters)
    return sortUjatVolunteerApplicants(filtered)
  }, [appliedFilters, list])

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

  const columns = useUjatVolunteerDocScreeningColumns({
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
    essayColumnWidths,
    onEssayColumnResizeStart,
    onEssayColumnResizeStop,
    tableWrapRef,
  })

  const applyDocumentScreeningStatus = useCallback(
    (ids: string[], status: 'pass' | 'fail') => {
      setList(prev => patchUjatVolunteerDocumentScreeningStatus(prev, ids, status))
    },
    []
  )

  const showDocumentScreeningConfirm = useCallback((options: UjatDocumentScreeningConfirmRequest) => {
    setDocumentScreeningConfirm(options)
  }, [])

  const closeDocumentScreeningConfirm = useCallback(() => {
    setDocumentScreeningConfirm(null)
  }, [])

  const handleBulkReject = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    confirmUjatVolunteerDocumentReject({
      showConfirm: showDocumentScreeningConfirm,
      count: ids.length,
      onConfirm: () => {
        applyDocumentScreeningStatus(ids, 'fail')
        setSelectedRowKeys([])
      },
    })
  }, [applyDocumentScreeningStatus, selectedRowKeys, showDocumentScreeningConfirm])

  const handleBulkApprove = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    confirmUjatVolunteerDocumentApprove({
      showConfirm: showDocumentScreeningConfirm,
      count: ids.length,
      onConfirm: () => {
        applyDocumentScreeningStatus(ids, 'pass')
        setSelectedRowKeys([])
      },
    })
  }, [applyDocumentScreeningStatus, selectedRowKeys, showDocumentScreeningConfirm])

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return
    if (filteredSorted.length === 0) {
      showAlert({
        title: '다운로드 안내',
        content: '다운로드할 데이터가 없습니다.',
      })
      return
    }
    setIsExporting(true)
    try {
      const exportRows = filteredSorted.map(toExportRowUjat)
      await exportTableToExcel(
        EXPORT_COLUMNS_UJAT,
        exportRows,
        `ujat-volunteer-${half}-doc-screening`
      )
    } catch (error) {
      console.error('[ujat-volunteer-doc-screening] excel export failed', error)
      showAlert({
        title: '다운로드 실패',
        content: '엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsExporting(false)
    }
  }, [filteredSorted, half, isExporting, showAlert])

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
    handleExportExcel,
    showDocumentScreeningConfirm,
    documentScreeningConfirm,
    closeDocumentScreeningConfirm,
    isExporting,
    count: filteredSorted.length,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  }
}
