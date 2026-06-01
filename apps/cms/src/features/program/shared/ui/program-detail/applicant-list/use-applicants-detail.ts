import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import type { FilterFieldConfig } from '@/shared/ui/unified-filter-card'
import { CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui/cms-select'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import {
  institutionFilterFields,
  instructorFilterFields,
  volunteerFilterFields,
} from '@/features/program/general/ui/table/applicant-filter-fields'
import {
  filterGeneralOrganizationApplications,
  filterGeneralIndividualApplications,
} from '@/features/program/general/lib/general-application-table-filter'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/general-institution-applications-mock'
import {
  APPLICANTS_CALENDAR_RANGE_PARAM,
  parseCalendarRangeParam,
  applyCalendarRangeParam,
} from '@/features/program/general/hooks/progress-calendar-range'
import {
  MOCK_APPLICANT_INSTITUTIONS,
  updateApplicantSchoolApprovalStatus,
  patchApplicantSchoolForApprovalStatus,
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
import {
  getGeneralIndividualApplicationsForProgram,
  updateGeneralIndividualApplicantApprovalStatus,
  patchGeneralIndividualApplicantForApprovalStatus,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import { APPLICANT_ID_PARAM, DETAIL_TAB_PARAM } from './applicants-detail-constants'
import {
  getSessionLineParts as getSessionLinePartsPure,
  type ApplicantSessionLineInput,
} from './applicants-detail-session-format'
import { filterApplicantsTableData } from './applicants-detail-table-filter'
import {
  useInstitutionApplicantColumns,
  useInstructorApplicantColumns,
} from './use-applicants-detail-columns'
import { useGeneralIndividualApplicantColumns } from './use-general-individual-applicant-columns'
import { createApplicantsFilterTablePageConfig } from './applicants-filter-table.config'
import type {
  ApplicantListMenu,
  InstitutionColumnPreset,
  SessionLinePreset,
} from './applicant-list-menu'

export type ApplicantListRow =
  | ApplicantSchoolRow
  | ApplicantInstructorRow
  | GeneralIndividualApplicantRow

export type ApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
  kind: 'institution' | 'individual'
} | null

export function useApplicantsDetail({
  menu,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
  listTitle,
  filterFields: filterFieldsOverride,
  institutionColumnPreset = 'legacy',
  sessionLinePreset,
  programId,
  detailVariant = 'legacy',
}: {
  menu: ApplicantListMenu | ''
  /** 풀페이지 모달 X: 상세가 열려 있으면 목록으로만 돌아가도록 등록 (true면 모달은 닫지 않음) */
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  /** 상세 진입 시 모달 제목·breadcrumb 갱신 */
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
  /** FilterTableLayout 타이틀 (일반 상세 LNB 라벨) */
  listTitle?: string
  filterFields?: FilterFieldConfig[]
  institutionColumnPreset?: InstitutionColumnPreset
  sessionLinePreset?: SessionLinePreset
  programId?: string
  detailVariant?: 'legacy' | 'general'
}) {
  const resolvedSessionPreset: SessionLinePreset =
    sessionLinePreset ?? (institutionColumnPreset === 'general-detail' ? 'general-detail' : 'legacy')

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

  const [institutionList, setInstitutionList] = useState<ApplicantSchoolRow[]>(() => {
    if (programId && institutionColumnPreset === 'general-detail') {
      return getGeneralInstitutionApplicationsForProgram(programId)
    }
    return [...MOCK_APPLICANT_INSTITUTIONS]
  })
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>(() => [
    ...MOCK_APPLICANT_INSTRUCTORS,
  ])
  const [individualList, setIndividualList] = useState<GeneralIndividualApplicantRow[]>(() => {
    if (programId) {
      return getGeneralIndividualApplicationsForProgram(programId)
    }
    return []
  })

  const rawTableData = useMemo((): ApplicantListRow[] => {
    if (menu === 'institutions') return institutionList
    if (menu === 'instructors') return instructorList
    if (menu === 'individual-applications') return individualList
    return []
  }, [menu, institutionList, instructorList, individualList])

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
    applicantFilterTablePageConfig as Parameters<typeof useTablePage>[0],
    {
      data: rawTableData,
      searchParams,
      setSearchParams,
      context: EMPTY_TABLE_PAGE_CONTEXT,
    }
  )

  const [selectedItem, setSelectedItem] = useState<ApplicantListRow | null>(null)
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

  const prevMenuRef = useRef<ApplicantListMenu | ''>(menu)
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
        setSearchParams(next, { replace: false })
      }
    } else if (next.has(APPLICANT_ID_PARAM)) {
      next.delete(APPLICANT_ID_PARAM)
      next.delete(DETAIL_TAB_PARAM)
      setSearchParams(next, { replace: true })
    }
  }, [menu, selectedItem, searchParams, setSearchParams])

  useEffect(() => {
    if (!menu || menu === 'volunteers') return
    const applicantId = searchParams.get(APPLICANT_ID_PARAM)
    if (!applicantId) {
      setSelectedItem(prev => (prev ? null : prev))
      return
    }
    const list =
      menu === 'institutions'
        ? institutionList
        : menu === 'individual-applications'
          ? individualList
          : instructorList
    const found = list.find(item => item.id === applicantId)
    if (found) {
      setSelectedItem(found)
    } else {
      setSelectedItem(null)
    }
  }, [menu, searchParams, institutionList, instructorList, individualList])

  useEffect(() => {
    if (!onApplicantDetailMetaChange || detailVariant !== 'general') return
    if (!selectedItem) {
      onApplicantDetailMetaChange(null)
      return
    }
    if (menu === 'institutions' && 'schoolName' in selectedItem) {
      onApplicantDetailMetaChange({
        title: `참여 기관 신청 상세 (${selectedItem.schoolName})`,
        breadcrumbLabel: selectedItem.schoolName,
        kind: 'institution',
      })
      return
    }
    if (menu === 'individual-applications' && 'applicantName' in selectedItem) {
      onApplicantDetailMetaChange({
        title: `참여자 신청 상세 (${selectedItem.applicantName})`,
        breadcrumbLabel: selectedItem.applicantName,
        kind: 'individual',
      })
    }
  }, [onApplicantDetailMetaChange, detailVariant, menu, selectedItem])

  useEffect(() => {
    if (programId && institutionColumnPreset === 'general-detail' && menu === 'institutions') {
      setInstitutionList(getGeneralInstitutionApplicationsForProgram(programId))
    }
  }, [programId, institutionColumnPreset, menu])

  useEffect(() => {
    if (programId && menu === 'individual-applications') {
      setIndividualList(getGeneralIndividualApplicationsForProgram(programId))
    }
  }, [programId, menu])

  const fields = useMemo((): FilterFieldConfig[] => {
    if (filterFieldsOverride?.length) return filterFieldsOverride
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
              tagColor: CMS_MULTI_SELECT_TAG_COLORS[i % CMS_MULTI_SELECT_TAG_COLORS.length],
            })),
          }
        })
      }
      case 'volunteers':
        return volunteerFilterFields
      default:
        return []
    }
  }, [menu, instructorList, filterFieldsOverride])

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

  const handleIndividualApprovalStatusChange = useCallback(
    (recordId: string, status: ApprovalStatusKey) => {
      const next = status as ApplicantApprovalStatusKey
      setIndividualList(prev =>
        prev.map(row => (row.id === recordId ? { ...row, approvalStatus: next } : row))
      )
      updateGeneralIndividualApplicantApprovalStatus(recordId, next)
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
    (s: ApplicantSessionLineInput) => getSessionLinePartsPure(s, resolvedSessionPreset),
    [resolvedSessionPreset]
  )

  const institutionColumns = useInstitutionApplicantColumns({
    setSelectedItem: record => setSelectedItem(record),
    approvalStatusKeys,
    getSessionLineParts,
    handleInstitutionApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
    preset: institutionColumnPreset,
  })

  const instructorColumns = useInstructorApplicantColumns({
    setSelectedItem: record => setSelectedItem(record),
    approvalStatusKeys,
    handleInstructorApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  })

  const individualColumns = useGeneralIndividualApplicantColumns({
    approvalStatusKeys,
    handleApprovalStatusChange: handleIndividualApprovalStatusChange,
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
    } else if (menu === 'individual-applications') {
      setIndividualList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'rejected' as const } : row
        )
      )
      keys.forEach(id => updateGeneralIndividualApplicantApprovalStatus(id, 'rejected'))
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
    } else if (menu === 'individual-applications') {
      setIndividualList(prev =>
        prev.map(row =>
          keys.includes(row.id) ? { ...row, approvalStatus: 'approved' as const } : row
        )
      )
      keys.forEach(id => updateGeneralIndividualApplicantApprovalStatus(id, 'approved'))
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
      prev.map(row => (row.id === id ? patchApplicantSchoolForApprovalStatus(row, 'pending') : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? patchApplicantSchoolForApprovalStatus(prev as ApplicantSchoolRow, 'pending')
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
      prev.map(row => (row.id === id ? patchApplicantSchoolForApprovalStatus(row, 'pending') : row))
    )
    setSelectedItem(prev =>
      prev && 'schoolName' in prev && prev.id === id
        ? patchApplicantSchoolForApprovalStatus(prev as ApplicantSchoolRow, 'pending')
        : prev
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
  }

  const handleCancelApprovalIndividual = (id: string) => {
    setIndividualList(prev =>
      prev.map(row =>
        row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'applicantName' in prev && prev.id === id
        ? patchGeneralIndividualApplicantForApprovalStatus(prev, 'pending')
        : prev
    )
    updateGeneralIndividualApplicantApprovalStatus(id, 'pending')
  }

  const handleCancelRejectIndividual = (id: string) => {
    setIndividualList(prev =>
      prev.map(row =>
        row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'pending') : row
      )
    )
    setSelectedItem(prev =>
      prev && 'applicantName' in prev && prev.id === id
        ? patchGeneralIndividualApplicantForApprovalStatus(prev, 'pending')
        : prev
    )
    updateGeneralIndividualApplicantApprovalStatus(id, 'pending')
  }

  const handleViewCalendar = () => {
    setViewMode('calendar')
  }

  const title = useMemo(() => {
    if (listTitle) return listTitle
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
  }, [menu, listTitle])

  const tableData = useMemo((): ApplicantListRow[] => {
    if (menu === 'individual-applications') {
      return filterGeneralIndividualApplications(individualList, appliedFilters)
    }
    if (menu === 'institutions' && institutionColumnPreset === 'general-detail') {
      return filterGeneralOrganizationApplications(institutionList, appliedFilters)
    }
    if (menu === 'institutions' || menu === 'instructors') {
      return filterApplicantsTableData(
        menu,
        institutionList,
        instructorList,
        appliedFilters as Record<string, unknown>
      ) as ApplicantListRow[]
    }
    return []
  }, [
    menu,
    institutionList,
    instructorList,
    individualList,
    appliedFilters,
    institutionColumnPreset,
  ])

  const columns = useMemo(() => {
    if (menu === 'institutions') return institutionColumns
    if (menu === 'instructors') return instructorColumns
    if (menu === 'individual-applications') return individualColumns
    return []
  }, [menu, institutionColumns, instructorColumns, individualColumns])

  const tableScrollX =
    menu === 'instructors'
      ? 48 + 72 + 110 + 150 + 120 + 110 + 130 + 160 + 136
      : menu === 'individual-applications'
        ? 1280
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
    setIndividualList,
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
    handleCancelApprovalIndividual,
    handleCancelRejectIndividual,
    handleViewCalendar,
    detailVariant,
    title,
    tableData,
    columns,
    tableScrollX,
  }
}
