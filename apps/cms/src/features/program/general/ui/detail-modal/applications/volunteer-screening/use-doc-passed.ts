import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  filterGeneralDocPassedApplicants,
  type GeneralVolunteerDocPassedFilters,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { useGeneralVolunteerDocPassedColumns } from './doc-passed-columns'

export function useGeneralVolunteerDocPassed({ programId }: { programId: string }) {
  const { showAlert } = useCmsAlert()
  const [list, setList] = useState<GeneralVolunteerApplicantRow[]>(() =>
    getGeneralVolunteerDocPassedApplicants(programId)
  )
  const [pendingFilters, setPendingFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))
  const [appliedFilters, setAppliedFilters] = useState<GeneralVolunteerDocPassedFilters>(() => ({
    ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  }))

  useEffect(() => {
    setList(getGeneralVolunteerDocPassedApplicants(programId))
    setPendingFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
    setAppliedFilters({ ...DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS })
  }, [programId])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...pendingFilters })
  }, [pendingFilters])

  const tableData = useMemo(
    () => filterGeneralDocPassedApplicants(list, appliedFilters),
    [appliedFilters, list]
  )

  const handleAssignInterview = useCallback(
    (row: GeneralVolunteerApplicantRow) => {
      const firstDay = row.interviewAvailability[0]
      const firstSlot = firstDay?.slots[0]
      if (!firstDay || !firstSlot) {
        showAlert({ title: '면접일 배정', content: '배정 가능한 면접 일정이 없습니다.' })
        return
      }
      setList(prev =>
        prev.map(item =>
          item.id === row.id
            ? {
                ...item,
                interviewAssignmentStatus: 'assigned',
                assignedInterviewDateLabel: firstDay.dateLabel,
                assignedInterviewTime: firstSlot,
                secondInterviewScreeningStatus: 'waiting',
              }
            : item
        )
      )
      showAlert({
        title: '면접일 배정',
        content: `${row.name} 봉사자의 면접일이 배정되었습니다. (목 데이터)`,
      })
    },
    [showAlert]
  )

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

  const columns = useGeneralVolunteerDocPassedColumns({ onAssignInterview: handleAssignInterview })

  return {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count: tableData.length,
    handleAssignInterview,
    requestWithdrawActivity,
  }
}
