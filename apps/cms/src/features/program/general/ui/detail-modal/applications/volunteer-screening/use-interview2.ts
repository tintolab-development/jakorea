import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerInterview2Applicants,
  patchGeneralVolunteerSecondInterviewScreeningStatus,
  sortGeneralVolunteerInterview2Applicants,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
  filterGeneralInterview2Applicants,
  type GeneralVolunteerInterview2Filters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralVolunteerInterview2Columns } from './interview2-columns'

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

  useEffect(() => {
    setList(getGeneralVolunteerInterview2Applicants(programId))
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS })
    setSelectedRowKeys([])
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

  const handleBulkFail = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    applySecondInterviewStatus(ids, 'fail')
    showAlert({ title: '선택 불합격', content: `${ids.length}건이 불합격 처리되었습니다.` })
  }, [applySecondInterviewStatus, selectedRowKeys, showAlert])

  const handleBulkPass = useCallback(() => {
    const ids = selectedRowKeys.map(String)
    applySecondInterviewStatus(ids, 'pass')
    showAlert({ title: '선택 합격', content: `${ids.length}건이 합격 처리되었습니다.` })
  }, [applySecondInterviewStatus, selectedRowKeys, showAlert])

  const requestWithdrawActivity = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      setList(prev =>
        prev.map(item =>
          item.id === row.id ? { ...item, interviewAssignmentStatus: 'withdrawn' } : item
        )
      )
      showAlert({
        title: '활동 포기',
        content: `${row.name} 봉사자가 활동 포기 처리되었습니다.`,
      })
    },
    [showAlert]
  )

  const requestInterview2Pass = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      applySecondInterviewStatus([row.id], 'pass')
    },
    [applySecondInterviewStatus]
  )

  const requestInterview2Fail = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      applySecondInterviewStatus([row.id], 'fail')
    },
    [applySecondInterviewStatus]
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
    requestWithdrawActivity,
    requestInterview2Pass,
    requestInterview2Fail,
    filterRowsSource: list,
  }
}
