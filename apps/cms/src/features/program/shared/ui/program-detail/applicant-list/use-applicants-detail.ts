import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { APP_MULTI_SELECT_TAG_COLORS } from '@/shared/ui/app-multi-select'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'
import {
  institutionFilterFields,
  instructorFilterFields,
  volunteerFilterFields,
} from '@/features/program/general/ui/table/applicant-filter-fields'
import {
  APPLICANTS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
} from '@/features/program/general/hooks/progress-calendar-range'
import {
  MOCK_APPLICANT_INSTITUTIONS,
  updateApplicantSchoolApprovalStatus,
  type ApplicantApprovalStatusKey,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  MOCK_APPLICANT_INSTRUCTORS,
  patchApplicantInstructorForApprovalStatus,
  updateApplicantInstructorApprovalStatus,
  type ApplicantInstructorApprovalStatusKey,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import { APPLICANT_ID_PARAM, DETAIL_TAB_PARAM } from './applicants-detail-constants'
import { getSessionLineParts as getSessionLinePartsPure } from './applicants-detail-session-format'
import { filterApplicantsTableData } from './applicants-detail-table-filter'
import {
  useInstitutionApplicantColumns,
  useInstructorApplicantColumns,
} from './use-applicants-detail-columns'
import { createApplicantsFilterTablePageConfig } from './applicants-filter-table.config'

export function useApplicantsDetail({
  menu,
  onRegisterApplicantCloseHandler,
}: {
  menu: TabKey | ''
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const applicantsCalendarGranularity = useMemo(
    () => parseCalendarRangeParam(searchParams, APPLICANTS_CALENDAR_RANGE_PARAM),
    [searchParams]
  )

  const setApplicantsCalendarGranularity = useCallback(
    (mode: 'month' | 'week') => {
      const next = new URLSearchParams(searchParams)
      applyCalendarRangeParam(next, APPLICANTS_CALENDAR_RANGE_PARAM, mode)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown>>({})

  const [institutionList, setInstitutionList] = useState<ApplicantSchoolRow[]>(() => [
    ...MOCK_APPLICANT_INSTITUTIONS,
  ])
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>(() => [
    ...MOCK_APPLICANT_INSTRUCTORS,
  ])

  const rawTableData = useMemo((): ApplicantSchoolRow[] | ApplicantInstructorRow[] => {
    if (menu === 'institutions') return institutionList
    if (menu === 'instructors') return instructorList
    return []
  }, [menu, institutionList, instructorList])

  const applicantFilterTablePageConfig = useMemo(
    () =>
      createApplicantsFilterTablePageConfig({
        onAfterApplySearch: next => {
          setAppliedFilters({ ...next })
        },
      }),
    []
  )

  const { pendingFilters, setPendingFilters, handleFilterChange, applySearch } = useTablePage(
    applicantFilterTablePageConfig,
    {
      data: rawTableData,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const [selectedItem, setSelectedItem] = useState<
    ApplicantSchoolRow | ApplicantInstructorRow | null
  >(null)
  const selectedItemRef = useRef(selectedItem)
  selectedItemRef.current = selectedItem

  useEffect(() => {
    if (!onRegisterApplicantCloseHandler) return
    const handler = () => {
      if (selectedItemRef.current) {
        setSelectedItem(null)
        return true
      }
      return false
    }
    onRegisterApplicantCloseHandler(handler)
    return () => onRegisterApplicantCloseHandler(null)
  }, [onRegisterApplicantCloseHandler])

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<string | null>(null)

  const [instructorApprovalTarget, setInstructorApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (!selectedItem) {
      setInstructorApprovalTarget(null)
    }
  }, [selectedItem])

  const prevMenuRef = useRef<TabKey | ''>(menu)
  useEffect(() => {
    if (prevMenuRef.current !== menu) {
      prevMenuRef.current = menu
      setPendingFilters({})
      setAppliedFilters({})
      setSelectedRowKeys([])
      setSelectedItem(null)
      setOpenApprovalDropdownId(null)
      setInstructorApprovalTarget(null)
      const next = new URLSearchParams(searchParams)
      if (next.has(APPLICANT_ID_PARAM)) {
        next.delete(APPLICANT_ID_PARAM)
        next.delete(DETAIL_TAB_PARAM)
        setSearchParams(next, { replace: true })
      }
    }
  }, [menu, searchParams, setSearchParams, setPendingFilters])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (selectedItem) {
      if (next.get(APPLICANT_ID_PARAM) !== selectedItem.id) {
        next.set(APPLICANT_ID_PARAM, selectedItem.id)
        setSearchParams(next, { replace: true })
      }
    } else if (next.has(APPLICANT_ID_PARAM)) {
      next.delete(APPLICANT_ID_PARAM)
      next.delete(DETAIL_TAB_PARAM)
      setSearchParams(next, { replace: true })
    }
  }, [selectedItem, searchParams, setSearchParams])

  useEffect(() => {
    if (!menu || menu === 'volunteers') return
    const applicantId = searchParams.get(APPLICANT_ID_PARAM)
    if (!applicantId) return
    const list = menu === 'institutions' ? institutionList : instructorList
    const found = list.find(item => item.id === applicantId)
    if (found) {
      setSelectedItem(found)
    }
  }, [menu, searchParams, institutionList, instructorList])

  const fields = useMemo((): FilterFieldConfig[] => {
    switch (menu) {
      case 'institutions':
        return institutionFilterFields
      case 'instructors': {
        const uniqueNames = Array.from(
          new Set(instructorList.map(r => r.schoolName).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'ko'))
        return instructorFilterFields.map(field => {
          if (field.type !== 'multiSelect' || field.key !== 'schoolNames') return field
          return {
            ...field,
            multiSelectOptions: uniqueNames.map((name, i) => ({
              value: name,
              label: name,
              tagColor: APP_MULTI_SELECT_TAG_COLORS[i % APP_MULTI_SELECT_TAG_COLORS.length],
            })),
          }
        })
      }
      case 'volunteers':
        return volunteerFilterFields
      default:
        return []
    }
  }, [menu, instructorList])

  const approvalStatusKeys = useMemo<ApprovalStatusKey[]>(
    () => ['pending', 'rejected', 'approved'] as ApprovalStatusKey[],
    []
  )

  const handleInstitutionApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const next = status as ApplicantApprovalStatusKey
      setInstitutionList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: next } : row))
      )
      setSelectedItem(prev =>
        prev && 'schoolName' in prev && prev.id === recordId
          ? { ...prev, approvalStatus: next }
          : prev
      )
      updateApplicantSchoolApprovalStatus(recordId, next)
      },
    []
  )

  const handleInstructorApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const next = status as ApplicantInstructorApprovalStatusKey
      setInstructorList(prev =>
        prev.map(row =>
          row.id === recordId ? patchApplicantInstructorForApprovalStatus(row, next) : row
        )
      )
      setSelectedItem(prev =>
        prev && 'instructorName' in prev && prev.id === recordId
          ? patchApplicantInstructorForApprovalStatus(prev, next)
          : prev
      )
      updateApplicantInstructorApprovalStatus(recordId, next)
      },
    []
  )

  const getSessionLineParts = useCallback(
    (s: Parameters<typeof getSessionLinePartsPure>[0]) => getSessionLinePartsPure(s),
    []
  )

  const institutionColumns = useInstitutionApplicantColumns({
    setSelectedItem,
    approvalStatusKeys,
    getSessionLineParts,
    handleInstitutionApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  })

  const instructorColumns = useInstructorApplicantColumns({
    setSelectedItem,
    approvalStatusKeys,
    handleInstructorApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  })

  const handleBulkReject = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    const keys = selectedRowKeys as string[]
    if (menu === 'institutions') {
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'rejected' as const } : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'rejected'))
      } else if (menu === 'instructors') {
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? patchApplicantInstructorForApprovalStatus(row, 'rejected') : row
        )
      )
      keys.forEach(id => updateApplicantInstructorApprovalStatus(id, 'rejected'))
      } else {
      return
    }
    setSelectedRowKeys([])
  }

  const handleBulkApprove = () => {
    if (selectedRowKeys.length === 0) {
      return
    }
    const keys = selectedRowKeys as string[]
    if (menu === 'institutions') {
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'approved' as const } : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'approved'))
      } else if (menu === 'instructors') {
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? patchApplicantInstructorForApprovalStatus(row, 'approved') : row
        )
      )
      keys.forEach(id => updateApplicantInstructorApprovalStatus(id, 'approved'))
      } else {
      return
    }
    setSelectedRowKeys([])
  }

  const handleCancelApproval = (id: string) => {
    setInstitutionList(prev =>
      prev.map(row => (row.id === id ? { ...row, approvalStatus: 'pending' as const } : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? { ...prev, approvalStatus: 'pending' as const }
        : prev
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
    }

  const handleCancelApprovalInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'instructorName' in prev && prev.id === id
        ? patchApplicantInstructorForApprovalStatus(prev, 'pending')
        : prev
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
    }

  const handleCancelRejectInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'instructorName' in prev && prev.id === id
        ? patchApplicantInstructorForApprovalStatus(prev, 'pending')
        : prev
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
    }

  const handleCancelRejectInstitution = (id: string) => {
    setInstitutionList(prev =>
      prev.map(row => (row.id === id ? { ...row, approvalStatus: 'pending' as const } : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? { ...prev, approvalStatus: 'pending' as const }
        : prev
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
    }

  const handleViewCalendar = () => {
    setViewMode('calendar')
  }

  const title = useMemo(() => {
    switch (menu) {
      case 'institutions':
        return '교육 신청 기관 목록'
      case 'instructors':
        return '교육 신청 강사 목록'
      case 'volunteers':
        return '신청 봉사자 목록'
      default:
        return ''
    }
  }, [menu])

  const tableData = useMemo(
    () =>
      filterApplicantsTableData(
        menu,
        institutionList,
        instructorList,
        appliedFilters as Record<string, any>
      ),
    [menu, institutionList, instructorList, appliedFilters]
  )

  const columns = useMemo(() => {
    if (menu === 'institutions') return institutionColumns
    if (menu === 'instructors') return instructorColumns
    return []
  }, [menu, institutionColumns, instructorColumns])

  /** 신청 강사: 픽셀 합산 스크롤. 신청 기관은 뷰에서 래퍼 너비 기반 scroll.x 사용 */
  const tableScrollX =
    menu === 'instructors'
      ? 48 + 72 + 110 + 150 + 120 + 110 + 130 + 160 + 136
      : 1280

  return {
    menu,
    applicantsCalendarGranularity,
    setApplicantsCalendarGranularity,
    pendingFilters,
    fields,
    institutionList,
    setInstitutionList,
    setInstructorList,
    selectedItem,
    setSelectedItem,
    viewMode,
    setViewMode,
    selectedRowKeys,
    setSelectedRowKeys,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
    instructorApprovalTarget,
    setInstructorApprovalTarget,
    handleInstitutionApprovalStatusChange,
    handleInstructorApprovalStatusChange,
    handleFilterChange,
    handleSearch: applySearch,
    handleBulkReject,
    handleBulkApprove,
    handleCancelApproval,
    handleCancelApprovalInstructor,
    handleCancelRejectInstructor,
    handleCancelRejectInstitution,
    handleViewCalendar,
    title,
    tableData,
    columns,
    tableScrollX,
  }
}
