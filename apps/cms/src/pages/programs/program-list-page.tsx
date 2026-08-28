/**
 * 프로그램 목록 페이지
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { resolveProgramAdminDetailInfoTabUrl } from '@/features/program/general/lib/resolve-program-admin-detail-url'
import { isUjatProgramId } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import {
  buildUjatProgramDetailUrl,
  resolveUjatDetailLnbFromSearchParams,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'

// Local Hooks & Components
import { useProgramListFilters } from './use-program-list-filters'
import { useProgramListActions } from './use-program-list-actions'
import { useSearchSync } from './use-search-sync'
import { ProgramListModals } from './program-list-modals'
import { ProgramDetailFullPageModal } from '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal'
import { GeneralProgramRegistrationFullpageModal } from '@/features/program/general/ui/registration/registration-fullpage-modal'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  clearRegistrationDraftForFreshStart,
  peekRegistrationDraftNotice,
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'

import './program-list-page.css'
import { DELETE_GUIDE_TYPED_CONFIRM_VALUE } from '@/shared/constants'
import { CmsButton, DeleteGuideModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  useCompanySchoolProgramDetail,
  useCompanySchoolPrograms,
  useDeleteCompanySchoolPrograms,
  usePrefetchCompanySchoolProgramDetail,
  useUpdateCompanySchoolProgram,
} from '@/features/program/1c-1s/api/hooks'
import { companySchoolListParamsFromOverviewStatus } from '@/features/program/1c-1s/api/list-params'
import type { OverviewStatusFilter } from './use-program-list-filters'

const PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY = 'new'

function ProgramListPageContent() {
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
  const location = useLocation()
  const pNorm = location.pathname.replace(/\/$/, '') || '/'
  const isCompanySchoolPath =
    pNorm === '/programs/company-school' ||
    pNorm.startsWith('/programs/company-school/') ||
    pNorm === '/programs/economy-education' ||
    pNorm.startsWith('/programs/economy-education/')
  const { user, isAuthenticated } = useAuthStore()
  const programStore = useProgramStore()
  const { programs, loading, fetchPrograms, selectedProgram, setSelectedProgram } = programStore
  const companySchoolOverviewStatus = useMemo((): OverviewStatusFilter | null => {
    const value = new URLSearchParams(location.search).get('status')
    if (value === 'scheduled' || value === 'in_progress' || value === 'completed') return value
    if (value === 'economy_scheduled') return 'scheduled'
    if (value === 'economy_in_progress') return 'in_progress'
    if (value === 'economy_completed') return 'completed'
    return null
  }, [location.search])
  const companySchoolTableFilters = useMemo(() => {
    const sp = new URLSearchParams(location.search)
    const title = sp.get('title') ?? undefined
    const yearRaw = sp.get('businessYear')
    const businessYear =
      yearRaw && /^\d{4}$/.test(yearRaw) ? Number.parseInt(yearRaw, 10) : undefined
    return { title, businessYear }
  }, [location.search])
  const companySchoolListFilters = useMemo(
    () =>
      companySchoolListParamsFromOverviewStatus(
        companySchoolOverviewStatus,
        companySchoolTableFilters
      ),
    [companySchoolOverviewStatus, companySchoolTableFilters]
  )
  const companySchoolListQuery = useCompanySchoolPrograms(
    companySchoolListFilters,
    isCompanySchoolPath
  )
  const prefetchCompanySchoolProgramDetail = usePrefetchCompanySchoolProgramDetail()
  const companySchoolProgramSource = isCompanySchoolPath
    ? (companySchoolListQuery.data ?? [])
    : programs

  // 1. Logic Hooks
  const { programType, statusFilter, filteredPrograms, params, setParam } = useProgramListFilters(
    companySchoolProgramSource,
    user
  )

  const {
    formLoading,
    handleFormSubmit,
    handleConfirmDelete,
    handleBulkDelete,
    getDeleteConfirmMessage,
    programToDelete,
    setProgramToDelete,
    deleteModalOpen,
    setDeleteModalOpen,
  } = useProgramListActions()

  const { searchParams, setSearchParams } = useSearchSync()
  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()

  // 2. Local State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [programsPendingBulkDelete, setProgramsPendingBulkDelete] = useState<Program[]>([])
  const [, setHasListFilters] = useState(false)
  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')
  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  // 헤더 타이틀 계산: statusFilter (위젯 클릭) → 모집단계 라벨 → "전체 프로그램"
  const headerTitle = useMemo(() => {
    if (programType === 'company_school' && statusFilter) {
      if (statusFilter === 'scheduled') return '예정 프로그램'
      if (statusFilter === 'in_progress') return '진행 중인 프로그램'
      if (statusFilter === 'completed') return '완료 프로그램'
    }

    // 7단계/교육 모집단계 매핑
    if (statusFilter) {
      const stageKey = Object.entries(PROGRAM_PROGRESS_STAGE_LABELS).find(([key, _label]) => {
        // config에서 lifecycleStatus 매핑 찾기
        const mapping = {
          studentRecruitment: 'recruiting_students',
          instructorRecruitment: 'recruiting_instructors',
          matchingCompleted: 'matching_completed',
          educationAfterTextbook: 'education_after_textbook',
          educationCompleted: 'education_completed',
          documentProcessingCompleted: 'document_processing_completed',
        }
        return mapping[key as ProgramProgressStageKey] === statusFilter
      })?.[0] as ProgramProgressStageKey | undefined

      if (stageKey) return PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
    }

    return '전체 프로그램'
  }, [statusFilter, programType])

  // 뷰 모드 관리
  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  const isCompanySchoolRegistrationOpen =
    programType === 'company_school' &&
    (pNorm === '/programs/company-school' || pNorm === '/programs/economy-education') &&
    searchParams.has(PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY)
  const isRecruitmentRoute =
    pNorm === '/programs/education/student-recruitment' ||
    pNorm === '/programs/education/instructor-recruitment' ||
    pNorm === '/programs/general/student-recruitment' ||
    pNorm === '/programs/general/instructor-recruitment' ||
    pNorm === '/programs/company-school/student-recruitment' ||
    pNorm === '/programs/company-school/instructor-recruitment' ||
    pNorm === '/programs/economy-education/student-recruitment' ||
    pNorm === '/programs/economy-education/instructor-recruitment'

  // 3. Modal States
  const {
    open: drawerOpen,
    closeModal: closeDrawer,
    selectedItem: drawerProgram,
    setSelectedItem: setDrawerProgram,
  } = useModalState<Program>()

  const {
    open: formModalOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
    selectedItem: editingProgram,
    isEditing: isEditingMode,
  } = useModalState<Program>()

  const [selectedProgramForModal, setSelectedProgramForModal] = useState<Program | null>(null)
  const [selectedProgramForInstructorModal, setSelectedProgramForInstructorModal] =
    useState<Program | null>(null)
  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)

  const companySchoolProgramIdFromUrl = useMemo(() => {
    if (!isCompanySchoolPath) return undefined
    const pid = searchParams.get('programId')?.trim()
    if (!pid || isUjatProgramId(pid)) return undefined
    return pid
  }, [isCompanySchoolPath, searchParams])

  const companySchoolDetailQuery = useCompanySchoolProgramDetail(
    companySchoolProgramIdFromUrl ?? selectedProgramForFullPageModal?.id,
    isCompanySchoolPath &&
      Boolean(companySchoolProgramIdFromUrl ?? selectedProgramForFullPageModal?.id)
  )
  const updateCompanySchoolMutation = useUpdateCompanySchoolProgram()
  const deleteCompanySchoolProgramsMutation = useDeleteCompanySchoolPrograms()
  const companySchoolDetailData = companySchoolDetailQuery.data ?? null
  const companySchoolDetailProgram =
    companySchoolDetailData ??
    (companySchoolProgramIdFromUrl
      ? ({ id: companySchoolProgramIdFromUrl } as Program)
      : selectedProgramForFullPageModal)

  // 4. Effects
  useEffect(() => {
    if (isCompanySchoolPath) return
    fetchPrograms()
  }, [fetchPrograms, isCompanySchoolPath])

  useEffect(() => {
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  // 수강자/강사 모집 경로에서는 항상 리스트(테이블) 뷰 적용
  useEffect(() => {
    if (isRecruitmentRoute && viewMode !== 'list') {
      setViewMode('list')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('viewMode', 'list')
      setSearchParams(nextParams, { replace: true })
    }
  }, [isRecruitmentRoute, viewMode, searchParams, setSearchParams])

  // 풀페이지 모달 ↔ 쿼리 파라미터(programId) 연동
  const isFullPageModalPath =
    pNorm === '/programs' ||
    pNorm === '/programs/education' ||
    pNorm === '/programs/economy-education' ||
    pNorm === '/programs/company-school'

  useEffect(() => {
    if (!isFullPageModalPath) return
    const pid = searchParams.get('programId')
    if (!pid || !isUjatProgramId(pid)) return
    const ujatLnb = resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info'
    const tab = searchParams.get('tab') ?? 'info'
    navigate(buildUjatProgramDetailUrl(pid, ujatLnb, tab), { replace: true })
  }, [isFullPageModalPath, navigate, searchParams])

  // 루트 `/programs?programId=…` — 목록에 없으면 모달이 안 열림 → 유형별 목록 URL로 정규화
  useEffect(() => {
    if (pNorm !== '/programs') return
    const pid = searchParams.get('programId')?.trim()
    if (!pid) return
    let cancelled = false
    void (async () => {
      const url = await resolveProgramAdminDetailInfoTabUrl(pid)
      if (cancelled) return
      const nextPath = url.split('?')[0] ?? ''
      if (nextPath === '/programs' || nextPath === '') return
      navigate(url, { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [pNorm, navigate, searchParams])

  const userPreviewSyncParams = useMemo(
    () => ({ userPreview: searchParams.get('userPreview') ?? undefined }),
    [searchParams]
  )

  const setUserPreviewSyncParams = useCallback(
    (updates: { userPreview?: string }, options?: SetQueryParamsOptions) => {
      const next = new URLSearchParams(searchParams)
      if (updates.userPreview === undefined || updates.userPreview === '') {
        next.delete('userPreview')
      } else {
        next.set('userPreview', updates.userPreview)
      }
      setSearchParams(next, { replace: options?.replace ?? true })
    },
    [searchParams, setSearchParams]
  )

  useWritingUserPreviewUrlAuxiliarySync(
    userPreviewSyncParams,
    setUserPreviewSyncParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview
  )

  useEffect(() => {
    if (!isFullPageModalPath) return
    const programIdFromUrl = searchParams.get('programId')
    if (!programIdFromUrl) {
      setSelectedProgramForFullPageModal(null)
      return
    }
    if (isUjatProgramId(programIdFromUrl)) return

    // 1사1교: 목록·detail 캐시에 있으면 동기화. 없어도 URL id로 모달 오픈(아래 open 조건).
    if (isCompanySchoolPath) {
      const fromList = filteredPrograms.find(p => p.id === programIdFromUrl)
      const fromDetail =
        companySchoolDetailQuery.data?.id === programIdFromUrl
          ? companySchoolDetailQuery.data
          : null
      const resolved = fromDetail ?? fromList ?? null
      if (resolved) {
        setSelectedProgramForFullPageModal(resolved)
      }
      return
    }

    // 목록은 filteredPrograms(교육/경제 시 mock) 기준이므로 여기서 찾아야 새로고침 복원이 안정적임
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(p => p.id === programIdFromUrl)
    if (program) {
      setSelectedProgramForFullPageModal(program)
    }
  }, [
    isFullPageModalPath,
    isCompanySchoolPath,
    searchParams,
    filteredPrograms,
    companySchoolDetailQuery.data,
  ])

  // Phase 0.2.1: 로그인 후 redirect 파라미터 대응 (교육/경제 목록에서는 상세 페이지로 가지 않고 풀페이지 모달만 사용)
  useEffect(() => {
    if (isFullPageModalPath) return
    const programId = params.programId
    if (programId && user && isAuthenticated) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setParam('programId', null)
        navigate(getProgramAdminDetailUrlFromPathname(programId, location.pathname), {
          replace: true,
        })
      }
    }
  }, [
    isFullPageModalPath,
    params.programId,
    user,
    isAuthenticated,
    programs,
    setParam,
    navigate,
    location.pathname,
  ])

  /** 예정 프로그램 필터 활성 시에만 행 선택·선택 삭제 표시 (1사1교 페이지) */
  const isScheduledFilter = programType === 'company_school' && statusFilter === 'scheduled'

  const isAdmin = user?.role === 'ADMIN'

  const showCalendarView = isAdmin && (programType === 'education' || programType === 'company_school')

  const programListConfig = useMemo(() => {
    const listView: ProgramListView =
      statusFilter === 'scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: programType === 'company_school' ? ('overview' as const) : ('general' as const),
      view: listView,
      tableType:
        statusFilter === 'recruiting_students'
          ? ('student' as const)
          : statusFilter === 'recruiting_instructors'
            ? ('instructor' as const)
            : undefined,
      lifecycleStatus:
        programType === 'company_school'
          ? undefined
          : statusFilter === 'matching_completed'
            ? ('education_before_textbook' as const)
            : (statusFilter as ProgramLifecycleStatus | null),
    }
  }, [programType, statusFilter])

  const handleBulkDeleteClick = () => {
    const programsToDelete = filteredPrograms.filter(p => selectedRowKeys.includes(p.id))
    if (programsToDelete.length === 0) return
    setProgramsPendingBulkDelete(programsToDelete)
    setBulkDeleteModalOpen(true)
  }

  const handleCloseCompanySchoolRegistrationFullpage = useCallback(() => {
    closeWritingUserPreview()
    const next = new URLSearchParams(searchParams)
    next.delete(PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY)
    next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
  }, [closeWritingUserPreview, searchParams, setSearchParams])

  const openCompanySchoolRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      const next = new URLSearchParams(searchParams)
      next.set(PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY, '1')
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
      next.delete('programId')
      next.delete('lnb')
      next.delete('tab')
      if (mode === 'fresh') {
        next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_FRESH)
      } else {
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
      }
      setSearchParams(next, { replace: false })
    },
    [searchParams, setSearchParams]
  )

  const handleCompanySchoolRegistrationSaved = useCallback((program?: Program) => {
    void companySchoolListQuery.refetch()
    closeWritingUserPreview()
    if (!program) {
      handleCloseCompanySchoolRegistrationFullpage()
      return
    }
    setSelectedProgramForFullPageModal(program)
    navigate(getProgramAdminDetailUrlFromPathname(program.id, location.pathname), {
      replace: true,
    })
  }, [
    closeWritingUserPreview,
    companySchoolListQuery,
    handleCloseCompanySchoolRegistrationFullpage,
    location.pathname,
    navigate,
  ])

  const handleProgramCreateClick = () => {
    if (programType === 'company_school') {
      const draft = peekRegistrationDraftNotice(PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE)
      if (draft != null) {
        setDraftNoticeTitle(draft.title)
        setDraftNoticeOpen(true)
        return
      }
      openCompanySchoolRegistration()
      return
    }

    showAlert({
      title: '안내',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }

  const handleDraftNoticeConfirm = useCallback(
    (choice: RegistrationDraftNoticeChoice) => {
      setDraftNoticeOpen(false)
      if (choice === 'fresh') {
        clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE)
        openCompanySchoolRegistration('fresh')
        return
      }
      openCompanySchoolRegistration('continue')
    },
    [openCompanySchoolRegistration]
  )

  // 예정 프로그램 필터 해제 시 선택 초기화
  useEffect(() => {
    if (!isScheduledFilter) setSelectedRowKeys([])
  }, [isScheduledFilter])

  const handleView = (program: Program) => {
    if (!user || !isAuthenticated) {
      const redirectPath = getProgramAdminDetailUrlFromPathname(program.id, location.pathname)
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    if (pNorm === '/programs/education/student-recruitment' || pNorm === '/programs/general/student-recruitment') {
      setSelectedProgramForModal(program)
      return
    }

    if (
      pNorm === '/programs/education/instructor-recruitment' ||
      pNorm === '/programs/general/instructor-recruitment'
    ) {
      setSelectedProgramForInstructorModal(program)
      return
    }

    if (
      pNorm === '/programs' ||
      pNorm === '/programs/education' ||
      pNorm === '/programs/economy-education' ||
      pNorm.startsWith('/programs/general/') ||
      pNorm === '/programs/company-school'
    ) {
      setSelectedProgramForFullPageModal(program)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('programId', program.id)
      if (
        programType === 'company_school' &&
        (statusFilter === 'in_progress' || statusFilter === 'completed')
      ) {
        nextParams.set('lnb', 'applicants')
        nextParams.set('tab', 'institutions')
      }
      setSearchParams(nextParams, { replace: false })
      return
    }

    navigate(getProgramAdminDetailUrlFromPathname(program.id, location.pathname))
  }

  const handleEdit = (program: Program) => {
    openFormModal(program)
    closeDrawer()
  }

  const handleViewModeToggle = () => {
    const newViewMode = viewMode === 'list' ? 'calendar' : 'list'
    setViewMode(newViewMode)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('viewMode', newViewMode)
    setSearchParams(nextParams, { replace: true })
  }

  const handleCloseFullPageModal = () => {
    setSelectedProgramForFullPageModal(null)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('programId')
    nextParams.delete('lnb')
    nextParams.delete('tab')
    nextParams.delete('edit')
    nextParams.delete('schoolId')
    nextParams.delete('schoolTab')
    nextParams.delete('instructorId')
    nextParams.delete('instructorTab')
    nextParams.delete('subTab')
    nextParams.delete('applicantId')
    nextParams.delete('detailTab')
    setSearchParams(nextParams, { replace: true })
  }

  /** ProgramList `FilterTableLayout`의 `actions` 슬롯 — 제목·건수는 `headerTitle`·목록 내부 건수로 표시 */
  const programListToolbarActions = (
    <div className="program-list-page__widget-header-actions">
      {isScheduledFilter && (
        <CmsButton
          variant="delete"
          width={140}
          onClick={handleBulkDeleteClick}
          disabled={selectedRowKeys.length === 0}
          className="program-list-page__bulk-delete-button"
        >
          선택 삭제
        </CmsButton>
      )}
      <CmsButton
        variant="secondary"
        size="large"
        icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
        onClick={handleViewModeToggle}
      >
        {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
      </CmsButton>
    </div>
  )

  const programListToolbarActionsAfterExcel = (
    <CmsButton variant="primary" size="large" width={180} onClick={handleProgramCreateClick}>
      프로그램 신규 등록
    </CmsButton>
  )

  return (
    <div
      className={[
        'program-list-page',
        programType === 'company_school' ? 'program-list-page--overview' : '',
        isScheduledFilter ? 'program-list-page--scheduled-filters' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 위젯 영역 */}
      <div className="program-progress-widget-container">
        <ProgramStatusWidget title={null} />
      </div>
      <ProgramList
        data={filteredPrograms}
        loading={isCompanySchoolPath ? companySchoolListQuery.isFetching : loading}
        headerTitle={headerTitle}
        onView={handleView}
        onPrefetch={
          isCompanySchoolPath
            ? program => prefetchCompanySchoolProgramDetail(program.id)
            : undefined
        }
        onSelectionChange={isScheduledFilter ? setSelectedRowKeys : undefined}
        selectedRowKeys={isScheduledFilter ? selectedRowKeys : undefined}
        showRowSelection={isScheduledFilter}
        showCalendarView={showCalendarView}
        viewMode={viewMode}
        tableVariant={programType === 'company_school' ? 'overview' : 'general'}
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
        toolbarActionsAfterExcel={programListToolbarActionsAfterExcel}
        disableUrlSync={
          isCompanySchoolPath &&
          (Boolean(companySchoolProgramIdFromUrl) || !!selectedProgramForFullPageModal)
        }
      >
        {programListToolbarActions}
      </ProgramList>

      <ProgramDetailFullPageModal
        open={
          isCompanySchoolPath
            ? Boolean(companySchoolProgramIdFromUrl) || !!selectedProgramForFullPageModal
            : !!selectedProgramForFullPageModal
        }
        program={companySchoolDetailProgram}
        programVariant={isCompanySchoolPath ? 'company-school' : undefined}
        externalLoading={
          isCompanySchoolPath
            ? Boolean(companySchoolProgramIdFromUrl) &&
              !companySchoolDetailData &&
              (companySchoolDetailQuery.isFetching || companySchoolDetailQuery.isLoading)
            : undefined
        }
        externalError={
          isCompanySchoolPath
            ? companySchoolDetailQuery.isError && !companySchoolDetailData
            : undefined
        }
        onClose={handleCloseFullPageModal}
        onUpdateProgram={
          isCompanySchoolPath
            ? async (programId, program, patch) => {
                await updateCompanySchoolMutation.mutateAsync({
                  programId,
                  program,
                  patch,
                })
                void companySchoolListQuery.refetch()
              }
            : undefined
        }
      />

      <GeneralProgramRegistrationFullpageModal
        open={isCompanySchoolRegistrationOpen}
        onClose={handleCloseCompanySchoolRegistrationFullpage}
        onProgramRegistrationSaved={handleCompanySchoolRegistrationSaved}
        registrationFormVariant="economy"
      />

      <RegistrationDraftNoticeModal
        open={draftNoticeOpen}
        draftTitle={draftNoticeTitle}
        onConfirm={handleDraftNoticeConfirm}
        onCancel={() => setDraftNoticeOpen(false)}
      />

      <ProgramListModals
        drawerOpen={drawerOpen}
        drawerProgram={drawerProgram || selectedProgram || null}
        onCloseDrawer={() => {
          closeDrawer()
          setDrawerProgram(null)
          setSelectedProgram(null)
        }}
        onEditFromDrawer={() => {
          if (selectedProgram) {
            closeDrawer()
            handleEdit(selectedProgram)
          }
        }}
        onDeleteFromDrawer={() => {
          if (selectedProgram) {
            setProgramToDelete(selectedProgram)
            setDeleteModalOpen(true)
          }
        }}
        loading={loading}
        formModalOpen={formModalOpen}
        isEditingMode={isEditingMode}
        editingProgram={editingProgram}
        onFormSubmit={data => handleFormSubmit(data, editingProgram, closeFormModal)}
        onFormCancel={closeFormModal}
        formLoading={formLoading}
        deleteModalOpen={deleteModalOpen}
        deleteConfirmMessage={getDeleteConfirmMessage(programToDelete)}
        onConfirmDelete={() =>
          handleConfirmDelete(programToDelete, () => {
            setDeleteModalOpen(false)
            setProgramToDelete(null)
            setSelectedRowKeys(prev => prev.filter(key => key !== programToDelete?.id))
            if (selectedProgram?.id === programToDelete?.id) {
              closeDrawer()
              setDrawerProgram(null)
              setSelectedProgram(null)
            }
          })
        }
        onCancelDelete={() => {
          setDeleteModalOpen(false)
          setProgramToDelete(null)
        }}
        selectedProgramForModal={selectedProgramForModal}
        onCancelEnrollmentModal={() => setSelectedProgramForModal(null)}
        selectedProgramForInstructorModal={selectedProgramForInstructorModal}
        onCancelInstructorModal={() => setSelectedProgramForInstructorModal(null)}
      />

      <DeleteGuideModal
        open={bulkDeleteModalOpen}
        title="선택 삭제"
        lines={[
          `선택한 ${programsPendingBulkDelete.length}건의 프로그램을 삭제하시겠습니까?`,
          '삭제된 프로그램은 복구할 수 없습니다.',
        ]}
        confirmText="삭제"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        onConfirm={() => {
          void (async () => {
            try {
              if (isCompanySchoolPath) {
                await deleteCompanySchoolProgramsMutation.mutateAsync(
                  programsPendingBulkDelete.map(program => program.id)
                )
                await companySchoolListQuery.refetch()
                setSelectedRowKeys([])
              } else {
                await handleBulkDelete(programsPendingBulkDelete, () =>
                  setSelectedRowKeys([])
                )
              }
              setBulkDeleteModalOpen(false)
              setProgramsPendingBulkDelete([])
            } catch (error) {
              console.debug('program bulk delete failed', error)
              showAlert({
                title: '삭제 실패',
                content: '선택한 프로그램을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
              })
            }
          })()
        }}
        onCancel={() => {
          setBulkDeleteModalOpen(false)
          setProgramsPendingBulkDelete([])
        }}
      />
    </div>
  )
}

export function ProgramListPage() {
  return (
    <TemplateWritingPreviewProvider>
      <ProgramListPageContent />
    </TemplateWritingPreviewProvider>
  )
}

export default ProgramListPage
