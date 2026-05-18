import { useCallback, useEffect, useMemo, useState, type Key, type RefObject } from 'react'
import { App } from 'antd'
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
} from '@/features/program/model/ujat-volunteer-screening-constants'
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

const EXPORT_COLUMNS: ColumnsType<Record<string, string | number>> = [
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

function toExportRow(row: UjatVolunteerApplicantRow): Record<string, string | number> {
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
  const { message, modal } = App.useApp()
  const [list, setList] = useState<UjatVolunteerApplicantRow[]>(() =>
    sortUjatVolunteerApplicants(getUjatVolunteerApplicants(programId, half))
  )
  const [pendingFilters, setPendingFilters] = useState<UjatVolunteerDocScreeningFilters>(
    () => ({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
  )
  const [appliedFilters, setAppliedFilters] = useState<UjatVolunteerDocScreeningFilters>(
    () => ({ ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS })
  )
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
  }, [list, appliedFilters])

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

  const handleBulkReject = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('반려할 항목을 선택해 주세요.')
      return
    }
    modal.confirm({
      title: '선택 반려',
      content: `선택한 ${selectedRowKeys.length}건을 서류 불합격 처리하시겠습니까?`,
      okText: '반려',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: () => {
        const keySet = new Set(selectedRowKeys)
        setList(prev =>
          prev.map(row =>
            keySet.has(row.id) ? { ...row, documentScreeningStatus: 'fail' as const } : row
          )
        )
        setSelectedRowKeys([])
        message.success('선택한 항목이 반려되었습니다.')
      },
    })
  }, [message, modal, selectedRowKeys])

  const handleBulkApprove = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('승인할 항목을 선택해 주세요.')
      return
    }
    modal.confirm({
      title: '선택 승인',
      content: `선택한 ${selectedRowKeys.length}건을 서류 합격 처리하시겠습니까?`,
      okText: '승인',
      cancelText: '취소',
      onOk: () => {
        const keySet = new Set(selectedRowKeys)
        setList(prev =>
          prev.map(row =>
            keySet.has(row.id) ? { ...row, documentScreeningStatus: 'pass' as const } : row
          )
        )
        setSelectedRowKeys([])
        message.success('선택한 항목이 승인되었습니다.')
      },
    })
  }, [message, modal, selectedRowKeys])

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return
    if (filteredSorted.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }
    setIsExporting(true)
    const hide = message.loading('엑셀 파일 생성 중입니다…', 0)
    try {
      const exportRows = filteredSorted.map(toExportRow)
      await exportTableToExcel(EXPORT_COLUMNS, exportRows, `ujat-volunteer-${half}-doc-screening`)
      message.success(`엑셀 다운로드 완료 (${exportRows.length.toLocaleString()}건)`)
    } catch (error) {
      console.error('[ujat-volunteer-doc-screening] excel export failed', error)
      message.error('엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      hide()
      setIsExporting(false)
    }
  }, [filteredSorted, half, isExporting, message])

  return {
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
    isExporting,
    count: filteredSorted.length,
  }
}
