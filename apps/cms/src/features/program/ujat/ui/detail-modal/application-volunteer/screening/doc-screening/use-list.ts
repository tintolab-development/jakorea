import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { FilterTableExcelExportConfig } from '@/shared/components/filter-table-layout'
import type { UjatDocumentScreeningConfirmRequest } from './document-actions'
import type { ColumnsType } from 'antd/es/table'
import {
  sortUjatVolunteerApplicants,
  formatUjatVolunteerApplicationType,
  type UjatVolunteerApplicantRow,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { listUjatVolunteerApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { buildUjatVolunteerDoc1ListQuery } from '@/features/program/ujat/api/applications-list-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
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
  UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL,
  type UjatVolunteerDocScreeningFilters,
} from './filter-fields'
import { useUjatVolunteerDocScreeningColumns } from './columns'
import {
  confirmUjatVolunteerDocumentApprove,
  confirmUjatVolunteerDocumentReject,
  patchUjatVolunteerDocumentScreeningStatus,
} from './document-actions'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

function filterApplicants(
  rows: UjatVolunteerApplicantRow[],
  filters: UjatVolunteerDocScreeningFilters
): UjatVolunteerApplicantRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  return rows.filter(row => {
    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false
    if (filters.grade !== UJAT_VOLUNTEER_DOC_SCREENING_FILTER_ALL && row.grade !== filters.grade) {
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
  const [documentScreeningConfirm, setDocumentScreeningConfirm] =
    useState<UjatDocumentScreeningConfirmRequest | null>(null)
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
    () => buildUjatVolunteerDoc1ListQuery(appliedFilters),
    [appliedFilters]
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
    await queryClient.invalidateQueries({
      queryKey: [...ujatQueryKeys.applications(), 'volunteers', programId],
    })
  }, [programId, queryClient])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  /** 조회 — appliedFilters 갱신 → queryKey 변경 → 서버 필터 재요청 */
  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const filteredSorted = useMemo(() => {
    // API가 지원하지 않는 필드(학년·희망지역·교육경험)만 추가 클라이언트 필터
    const clientOnly: UjatVolunteerDocScreeningFilters = {
      ...DEFAULT_UJAT_VOLUNTEER_DOC_SCREENING_FILTERS,
      grade: appliedFilters.grade,
      preferredRegion: appliedFilters.preferredRegion,
      educationExperience: appliedFilters.educationExperience,
    }
    const filtered = filterApplicants(list, clientOnly)
    return sortUjatVolunteerApplicants(filtered)
  }, [appliedFilters, list])
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
      updateRow(id, { managerAEvaluation: evaluation })
      void updateUjatVolunteerDocumentEvaluationRemote(id, 'A', evaluation).catch(() => {
        showAlert({
          title: '담당자 평가 저장 실패',
          content: '담당자 A 평가를 저장하지 못했습니다. 다시 시도해 주세요.',
        })
        void invalidateVolunteerLists()
      })
    },
    [invalidateVolunteerLists, showAlert, updateRow]
  )

  const onManagerBEvaluationChange = useCallback(
    (id: string, evaluation: UjatManagerEvaluation) => {
      updateRow(id, { managerBEvaluation: evaluation })
      void updateUjatVolunteerDocumentEvaluationRemote(id, 'B', evaluation).catch(() => {
        showAlert({
          title: '담당자 평가 저장 실패',
          content: '담당자 B 평가를 저장하지 못했습니다. 다시 시도해 주세요.',
        })
        void invalidateVolunteerLists()
      })
    },
    [invalidateVolunteerLists, showAlert, updateRow]
  )

  const columns = useUjatVolunteerDocScreeningColumns({
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    openManagerDropdown,
    setOpenManagerDropdown,
  })

  const applyDocumentScreeningStatus = useCallback(
    (ids: string[], status: 'pass' | 'fail') => {
      setList(prev => patchUjatVolunteerDocumentScreeningStatus(prev, ids, status))
      void submitUjatVolunteerDocumentResultsRemote(ids, status)
        .then(() => invalidateVolunteerLists())
        .catch(() => {
          showAlert({
            title: '서류 심사 처리 실패',
            content: '서류 합격/불합격 처리에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
          })
          void invalidateVolunteerLists()
        })
    },
    [invalidateVolunteerLists, showAlert]
  )

  const showDocumentScreeningConfirm = useCallback(
    (options: UjatDocumentScreeningConfirmRequest) => {
      setDocumentScreeningConfirm(options)
    },
    []
  )

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
    showDocumentScreeningConfirm,
    documentScreeningConfirm,
    closeDocumentScreeningConfirm,
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
