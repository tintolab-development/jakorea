import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useTablePage,
  EMPTY_TABLE_PAGE_CONTEXT,
} from '@/shared/components/table-system/model/use-table-page'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { CMS_MULTI_SELECT_TAG_COLORS } from '@/shared/ui/cms-select'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import {
  institutionFilterFields,
  instructorFilterFields,
  volunteerFilterFields,
} from '@/features/program/general/ui/table/applicant-filter-fields'
import {
  generalInstructorApplicationFilterFields,
  generalInstructorCalendarFilterFields,
} from '@/features/program/general/lib/application-filter-fields'
import {
  filterGeneralOrganizationApplications,
  filterGeneralIndividualApplications,
  filterGeneralInstructorApplications,
  filterGeneralInstructorCalendarApplications,
} from '@/features/program/general/lib/application-table-filter'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
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
  type ApplicantSchoolApprovalNotifyOptions,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  MOCK_APPLICANT_INSTRUCTORS,
  getApplicantInstructorsByProgramId,
  patchApplicantInstructorForApprovalStatus,
  updateApplicantInstructorApprovalStatus,
  type ApplicantInstructorApprovalNotifyOptions,
  type ApplicantInstructorApprovalStatusKey,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  getGeneralIndividualApplicationsForProgram,
  getGeneralParticipantDoc1Applicants,
  updateGeneralIndividualApplicantApprovalStatus,
  patchGeneralIndividualApplicantForApprovalStatus,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import { filterGeneralParticipantDoc1Applications } from '@/features/program/general/lib/participant-doc-screening-filter-fields'
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
import { useGeneralInstructorApplicantColumns } from './use-general-instructor-applicant-columns'
import { createApplicantsFilterTablePageConfig } from './applicants-filter-table.config'
import type {
  ApplicantListMenu,
  InstitutionColumnPreset,
  InstructorColumnPreset,
  SessionLinePreset,
} from './applicant-list-menu'
import type { InstructorLectureAssignItem } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import type { Program } from '@/types/domain'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { useGeneralProgramApplicationsRemoteSync } from '@/features/program/general/hooks/use-general-program-applications-remote-sync'

export type InstructorApprovalTarget =
  | { id: string; name: string; step: 'assign' }
  | {
      id: string
      name: string
      step: 'fee'
      assignments: InstructorLectureAssignItem[]
    }

export type ApplicantListRow =
  | ApplicantSchoolRow
  | ApplicantInstructorRow
  | GeneralIndividualApplicantRow

export type ApplicantDetailMeta = {
  title: string
  breadcrumbLabel: string
  kind: 'institution' | 'individual' | 'instructor'
} | null

export function useApplicantsDetail({
  menu,
  onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange: _onApplicantDetailMetaChange,
  listTitle,
  filterFields: filterFieldsOverride,
  institutionColumnPreset = 'legacy',
  instructorColumnPreset = 'legacy',
  sessionLinePreset,
  programId,
  detailVariant = 'legacy',
  program = null,
  individualScreeningStage,
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
  instructorColumnPreset?: InstructorColumnPreset
  sessionLinePreset?: SessionLinePreset
  programId?: string
  detailVariant?: 'legacy' | 'general'
  program?: Program | null
  /** 개인 참여자 면접 1차 서류 심사 탭 */
  individualScreeningStage?: 'doc1'
}) {
  const resolvedSessionPreset: SessionLinePreset =
    sessionLinePreset ??
    (institutionColumnPreset === 'general-detail' || institutionColumnPreset === 'company-school'
      ? 'general-detail'
      : 'legacy')
  const usesProgramInstitutionApplications =
    institutionColumnPreset === 'general-detail' || institutionColumnPreset === 'company-school'

  const institutionApplicationBridge = useMemo(
    () => (program ? resolveInstitutionApplicationProgramBridge(program) : null),
    [program]
  )

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
    if (programId && usesProgramInstitutionApplications) {
      return getGeneralInstitutionApplicationsForProgram(programId)
    }
    return [...MOCK_APPLICANT_INSTITUTIONS]
  })
  const [instructorList, setInstructorList] = useState<ApplicantInstructorRow[]>(() => {
    if (programId && instructorColumnPreset === 'general-detail') {
      return getApplicantInstructorsByProgramId(programId)
    }
    return [...MOCK_APPLICANT_INSTRUCTORS]
  })
  const [individualList, setIndividualList] = useState<GeneralIndividualApplicantRow[]>(() => {
    if (programId) {
      if (individualScreeningStage === 'doc1') {
        return getGeneralParticipantDoc1Applicants(programId)
      }
      return getGeneralIndividualApplicationsForProgram(programId)
    }
    return []
  })

  const applicationsRemote = useGeneralProgramApplicationsRemoteSync({
    programId,
    menu,
    usesProgramInstitutionApplications,
    instructorColumnPreset,
    individualScreeningStage,
    setInstitutionList,
    setInstructorList,
    setIndividualList,
  })

  const applyRemoteInstitutionDecision = useCallback(
    async (ids: string[], decision: 'approve' | 'reject', reason?: string) => {
      if (!applicationsRemote.remoteEnabled) return false
      for (const id of ids) {
        if (decision === 'approve') {
          await applicationsRemote.approveOrganization(id)
        } else {
          await applicationsRemote.rejectOrganization(id, {
            reason: reason?.trim() || '반려',
          })
        }
      }
      await applicationsRemote.invalidateApplications()
      return true
    },
    [applicationsRemote]
  )

  const applyRemoteInstructorDecision = useCallback(
    async (ids: string[], decision: 'approve' | 'reject', reason?: string) => {
      if (!applicationsRemote.remoteEnabled) return false
      for (const id of ids) {
        if (decision === 'approve') {
          await applicationsRemote.approveInstructor(id)
        } else {
          await applicationsRemote.rejectInstructor(id, {
            reason: reason?.trim() || '반려',
          })
        }
      }
      await applicationsRemote.invalidateApplications()
      return true
    },
    [applicationsRemote]
  )

  const applyRemoteIndividualDecision = useCallback(
    async (ids: string[], decision: 'approve' | 'reject', reason?: string) => {
      if (!applicationsRemote.remoteEnabled) return false
      for (const id of ids) {
        if (decision === 'approve') {
          await applicationsRemote.approveIndividual(id)
        } else {
          await applicationsRemote.rejectIndividual(id, {
            reason: reason?.trim() || '반려',
          })
        }
      }
      await applicationsRemote.invalidateApplications()
      return true
    },
    [applicationsRemote]
  )

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

  const selectedItemRef = useRef<ApplicantListRow | null>(null)

  const applicantIdFromUrl = searchParams.get(APPLICANT_ID_PARAM)

  const selectedItem = useMemo((): ApplicantListRow | null => {
    if (!applicantIdFromUrl || !menu || menu === 'volunteers') return null
    if (menu === 'institutions') {
      return institutionList.find(row => row.id === applicantIdFromUrl) ?? null
    }
    if (menu === 'individual-applications') {
      return individualList.find(row => row.id === applicantIdFromUrl) ?? null
    }
    if (menu === 'instructors') {
      return instructorList.find(row => row.id === applicantIdFromUrl) ?? null
    }
    return null
  }, [applicantIdFromUrl, menu, institutionList, individualList, instructorList])

  selectedItemRef.current = selectedItem

  const resolveApplicantFromUrlParams = useCallback(
    (params: URLSearchParams): ApplicantListRow | null => {
      const applicantId = params.get(APPLICANT_ID_PARAM)
      if (!applicantId || !menu || menu === 'volunteers') return null
      if (menu === 'institutions') {
        return institutionList.find(row => row.id === applicantId) ?? null
      }
      if (menu === 'individual-applications') {
        return individualList.find(row => row.id === applicantId) ?? null
      }
      if (menu === 'instructors') {
        return instructorList.find(row => row.id === applicantId) ?? null
      }
      return null
    },
    [menu, institutionList, individualList, instructorList]
  )

  const setSelectedItem = useCallback(
    (
      value: ApplicantListRow | null | ((prev: ApplicantListRow | null) => ApplicantListRow | null)
    ) => {
      setSearchParams(
        prevParams => {
          const next = new URLSearchParams(prevParams)
          const current = resolveApplicantFromUrlParams(prevParams)
          const resolved = typeof value === 'function' ? value(current) : value

          if (resolved) {
            if (next.get(APPLICANT_ID_PARAM) === resolved.id) {
              return prevParams
            }
            next.set(APPLICANT_ID_PARAM, resolved.id)
          } else {
            if (!next.has(APPLICANT_ID_PARAM)) {
              return prevParams
            }
            next.delete(APPLICANT_ID_PARAM)
            next.delete(DETAIL_TAB_PARAM)
          }
          return next
        },
        { replace: true }
      )
    },
    [resolveApplicantFromUrlParams, setSearchParams]
  )

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

  const [instructorApprovalTarget, setInstructorApprovalTarget] =
    useState<InstructorApprovalTarget | null>(null)

  useEffect(() => {
    if (!selectedItem) {
      setInstructorApprovalTarget(null)
    }
  }, [selectedItem])

  useEffect(() => {
    if (!applicantIdFromUrl || selectedItem || !menu || menu === 'volunteers') return
    setSearchParams(
      prevParams => {
        const next = new URLSearchParams(prevParams)
        if (!next.has(APPLICANT_ID_PARAM)) return prevParams
        next.delete(APPLICANT_ID_PARAM)
        next.delete(DETAIL_TAB_PARAM)
        return next
      },
      { replace: true }
    )
  }, [applicantIdFromUrl, selectedItem, menu, setSearchParams])

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
    }
  }, [menu, setPendingFilters, setSelectedItem])

  useEffect(() => {
    if (individualScreeningStage === 'doc1') {
      setViewMode('table')
    }
  }, [individualScreeningStage])

  const prevViewModeRef = useRef(viewMode)
  useEffect(() => {
    if (
      menu === 'instructors' &&
      instructorColumnPreset === 'general-detail' &&
      prevViewModeRef.current !== viewMode
    ) {
      prevViewModeRef.current = viewMode
      setPendingFilters({})
      setAppliedFilters({})
      setSelectedRowKeys([])
    }
  }, [viewMode, menu, instructorColumnPreset, setPendingFilters])

  useEffect(() => {
    if (programId && usesProgramInstitutionApplications && menu === 'institutions') {
      setInstitutionList(getGeneralInstitutionApplicationsForProgram(programId))
    }
  }, [programId, usesProgramInstitutionApplications, menu])

  useEffect(() => {
    if (programId && menu === 'individual-applications') {
      setIndividualList(
        individualScreeningStage === 'doc1'
          ? getGeneralParticipantDoc1Applicants(programId)
          : getGeneralIndividualApplicationsForProgram(programId)
      )
    }
  }, [programId, menu, individualScreeningStage])

  useEffect(() => {
    if (programId && instructorColumnPreset === 'general-detail' && menu === 'instructors') {
      setInstructorList(getApplicantInstructorsByProgramId(programId))
    }
  }, [programId, instructorColumnPreset, menu])

  const fields = useMemo((): FilterFieldConfig[] => {
    if (
      menu === 'instructors' &&
      instructorColumnPreset === 'general-detail' &&
      !filterFieldsOverride?.length
    ) {
      return viewMode === 'calendar'
        ? generalInstructorCalendarFilterFields
        : generalInstructorApplicationFilterFields
    }
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
  }, [menu, instructorList, filterFieldsOverride, instructorColumnPreset, viewMode])

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
      updateApplicantInstructorApprovalStatus(recordId, next)
    },
    []
  )

  const getSessionLineParts = useCallback(
    (s: ApplicantSessionLineInput) =>
      getSessionLinePartsPure(s, resolvedSessionPreset, institutionApplicationBridge),
    [resolvedSessionPreset, institutionApplicationBridge]
  )

  const institutionColumns = useInstitutionApplicantColumns({
    setSelectedItem: record => setSelectedItem(record),
    approvalStatusKeys,
    getSessionLineParts,
    handleInstitutionApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
    preset: institutionColumnPreset,
    programBridge: institutionApplicationBridge,
  })

  const instructorColumnsLegacy = useInstructorApplicantColumns({
    setSelectedItem: record => setSelectedItem(record),
    approvalStatusKeys,
    handleInstructorApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  })

  const instructorColumnsGeneral = useGeneralInstructorApplicantColumns({
    setSelectedItem: record => setSelectedItem(record as ApplicantInstructorRow),
  })

  const instructorColumns =
    menu === 'instructors' && instructorColumnPreset === 'general-detail'
      ? instructorColumnsGeneral
      : instructorColumnsLegacy

  const individualColumns = useGeneralIndividualApplicantColumns(institutionApplicationBridge)

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

  const toInstructorNotifyOptions = (
    payload: PermissionModalPayload,
    rejectionReason?: string
  ): ApplicantInstructorApprovalNotifyOptions => ({
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason,
  })

  const toInstitutionNotifyOptions = (
    payload: PermissionModalPayload,
    rejectionReason?: string
  ): ApplicantSchoolApprovalNotifyOptions => ({
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason,
  })

  const confirmBulkInstructorReject = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteInstructorDecision(keys, 'reject', payload.reason)) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toInstructorNotifyOptions(payload, payload.reason)
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchApplicantInstructorForApprovalStatus(row, 'rejected', notifyOptions)
            : row
        )
      )
      keys.forEach(id =>
        updateApplicantInstructorApprovalStatus(id, 'rejected', notifyOptions)
      )
      setSelectedRowKeys([])
    },
    [applyRemoteInstructorDecision, selectedRowKeys]
  )

  const confirmBulkInstructorApprove = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteInstructorDecision(keys, 'approve')) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toInstructorNotifyOptions(payload)
      setInstructorList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchApplicantInstructorForApprovalStatus(row, 'approved', notifyOptions)
            : row
        )
      )
      keys.forEach(id =>
        updateApplicantInstructorApprovalStatus(id, 'approved', notifyOptions)
      )
      setSelectedRowKeys([])
    },
    [applyRemoteInstructorDecision, selectedRowKeys]
  )

  const confirmBulkInstitutionReject = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteInstitutionDecision(keys, 'reject', payload.reason)) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toInstitutionNotifyOptions(payload, payload.reason)
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchApplicantSchoolForApprovalStatus(row, 'rejected', notifyOptions)
            : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'rejected', notifyOptions))
      setSelectedRowKeys([])
    },
    [applyRemoteInstitutionDecision, selectedRowKeys]
  )

  const confirmBulkInstitutionApprove = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteInstitutionDecision(keys, 'approve')) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toInstitutionNotifyOptions(payload)
      setInstitutionList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchApplicantSchoolForApprovalStatus(row, 'approved', notifyOptions)
            : row
        )
      )
      keys.forEach(id => updateApplicantSchoolApprovalStatus(id, 'approved', notifyOptions))
      setSelectedRowKeys([])
    },
    [applyRemoteInstitutionDecision, selectedRowKeys]
  )

  const toParticipantNotifyOptions = (
    payload: PermissionModalPayload,
    rejectionReason?: string
  ): ApplicantSchoolApprovalNotifyOptions => ({
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason,
  })

  const confirmBulkParticipantReject = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteIndividualDecision(keys, 'reject', payload.reason)) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toParticipantNotifyOptions(payload, payload.reason)
      setIndividualList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchGeneralIndividualApplicantForApprovalStatus(row, 'rejected', notifyOptions)
            : row
        )
      )
      keys.forEach(id =>
        updateGeneralIndividualApplicantApprovalStatus(id, 'rejected', notifyOptions)
      )
      setSelectedRowKeys([])
    },
    [applyRemoteIndividualDecision, selectedRowKeys]
  )

  const confirmBulkParticipantApprove = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedRowKeys.length === 0) {
        return
      }
      const keys = selectedRowKeys as string[]
      if (await applyRemoteIndividualDecision(keys, 'approve')) {
        setSelectedRowKeys([])
        return
      }
      const notifyOptions = toParticipantNotifyOptions(payload)
      setIndividualList(prev =>
        prev.map(row =>
          keys.includes(row.id)
            ? patchGeneralIndividualApplicantForApprovalStatus(row, 'approved', notifyOptions)
            : row
        )
      )
      keys.forEach(id =>
        updateGeneralIndividualApplicantApprovalStatus(id, 'approved', notifyOptions)
      )
      setSelectedRowKeys([])
    },
    [applyRemoteIndividualDecision, selectedRowKeys]
  )

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
    updateApplicantSchoolApprovalStatus(id, 'pending')
  }

  const handleCancelApprovalInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
  }

  const handleCancelRejectInstructor = (id: string) => {
    setInstructorList(prev =>
      prev.map(row =>
        row.id === id ? patchApplicantInstructorForApprovalStatus(row, 'pending') : row
      )
    )
    updateApplicantInstructorApprovalStatus(id, 'pending')
  }

  const handleCancelRejectInstitution = (id: string) => {
    setInstitutionList(prev =>
      prev.map(row => (row.id === id ? patchApplicantSchoolForApprovalStatus(row, 'pending') : row))
    )
    updateApplicantSchoolApprovalStatus(id, 'pending')
  }

  const handleCancelApprovalIndividual = (id: string) => {
    setIndividualList(prev =>
      prev.map(row =>
        row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'pending') : row
      )
    )
    updateGeneralIndividualApplicantApprovalStatus(id, 'pending')
  }

  const handleCancelRejectIndividual = (id: string) => {
    setIndividualList(prev =>
      prev.map(row =>
        row.id === id ? patchGeneralIndividualApplicantForApprovalStatus(row, 'pending') : row
      )
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
      if (individualScreeningStage === 'doc1') {
        return filterGeneralParticipantDoc1Applications(individualList, appliedFilters)
      }
      return filterGeneralIndividualApplications(individualList, appliedFilters)
    }
    if (menu === 'institutions' && institutionColumnPreset === 'general-detail') {
      return filterGeneralOrganizationApplications(institutionList, appliedFilters)
    }
    if (menu === 'instructors' && instructorColumnPreset === 'general-detail') {
      return viewMode === 'calendar'
        ? filterGeneralInstructorCalendarApplications(instructorList, appliedFilters)
        : filterGeneralInstructorApplications(instructorList, appliedFilters)
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
    instructorColumnPreset,
    viewMode,
    individualScreeningStage,
  ])

  const columns = useMemo(() => {
    if (menu === 'institutions') return institutionColumns
    if (menu === 'instructors') return instructorColumns
    if (menu === 'individual-applications') return individualColumns
    return []
  }, [menu, institutionColumns, instructorColumns, individualColumns])

  const tableScrollX =
    menu === 'instructors' && instructorColumnPreset === 'general-detail'
      ? 1280
      : menu === 'instructors'
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
    instructorList,
    individualList,
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
    confirmBulkInstructorReject,
    confirmBulkInstructorApprove,
    confirmBulkInstitutionReject,
    confirmBulkInstitutionApprove,
    confirmBulkParticipantReject,
    confirmBulkParticipantApprove,
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
