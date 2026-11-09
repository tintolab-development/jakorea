/**
 * 프로그램 목록 페이지
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useLocation, useNavigate } from 'react-router-dom'
import { isHistoryTraversalPending } from '@/shared/lib/history-ancestor-navigation'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramListView } from '@/features/program/general/ui/table/program-table-column-resolver'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { clearGeneralProgramDetailQueryParams } from '@/features/program/general/lib/general-program-detail-route'
import { buildProgramListSearchParamsAfterRegistrationComplete } from '@/features/program/shared/lib/post-registration-search-params'
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
import {
  LazyGeneralProgramRegistrationFullpageModal,
  LazyProgramDetailFullPageModal,
  preloadGeneralProgramRegistrationModal,
  ProgramModalWhenOpen,
} from '@/pages/programs/lazy-program-modals'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  fetchRegistrationDraftNotice,
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import { assertRegistrationWizardRemoteReady } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
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
import { DeleteGuideModal, showDeleteCompletedAlert, FilterTableToolbarButton } from '@/shared/ui'
import {
  isProgramHardDeleteBlockedError,
  resolveProgramDeleteGuideModalCopy,
  resolveProgramHardDeleteBlockedModalCopy,
} from '@/features/program/shared/lib/program-delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { resolveProgramListDetailEntry } from '@/features/program/general/lib/resolve-program-list-detail-entry'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import {
  useCompanySchoolProgramDetail,
  useCompanySchoolPrograms,
  useDeleteCompanySchoolPrograms,
  useUpdateCompanySchoolProgram,
} from '@/features/program/1c-1s/api/hooks'
import {
  companySchoolListParamsFromOverviewStatus,
  readCompanySchoolTableFilters,
} from '@/features/program/1c-1s/api/list-params'
import type { OverviewStatusFilter } from './use-program-list-filters'

import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import { ensureProgramWriteAllowed } from '@/features/program/shared/lib/program-role-action-check'

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
  const companySchoolTableFilters = useMemo(
    () => readCompanySchoolTableFilters(new URLSearchParams(location.search)),
    [location.search]
  )
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
  const companySchoolProgramSource = isCompanySchoolPath
    ? (companySchoolListQuery.data?.pages.flatMap(page => page.programs) ?? [])
    : programs

  const companySchoolInfiniteResetKey = useMemo(
    () => JSON.stringify(companySchoolListFilters),
    [companySchoolListFilters]
  )
  const { sentinelRef: companySchoolLoadMoreRef } = useGatedInfiniteScroll({
    hasNextPage: Boolean(
      isCompanySchoolPath &&
      !companySchoolListQuery.isPlaceholderData &&
      companySchoolListQuery.hasNextPage
    ),
    isFetchingNextPage: Boolean(isCompanySchoolPath && companySchoolListQuery.isFetchingNextPage),
    fetchNextPage: companySchoolListQuery.fetchNextPage,
    resetKey: companySchoolInfiniteResetKey,
  })

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
  const programBulkDeleteGuide = useMemo(
    () => resolveProgramDeleteGuideModalCopy(programsPendingBulkDelete.length),
    [programsPendingBulkDelete.length]
  )
  const [programDeleteBlockedOpen, setProgramDeleteBlockedOpen] = useState(false)
  const [programDeleteBlockedCopy, setProgramDeleteBlockedCopy] = useState({
    title: '',
    description: '',
  })
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
    pNorm === '/programs/general/student-recruitment' ||
    pNorm === '/programs/company-school/student-recruitment' ||
    pNorm === '/programs/economy-education/student-recruitment'

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
  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)

  const companySchoolProgramIdFromUrl = useMemo(() => {
    if (!isCompanySchoolPath) return undefined
    const pid = searchParams.get('programId')?.trim()
    // 1사1교 목록의 programId는 이 경로의 프로그램이다. 숫자 id(18xxxx)를
    // UJAT 휴리스틱으로 버리면 상세 모달이 안 열리고 아래 effect가 UJAT로 보낸다.
    if (!pid) return undefined
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
  // 상세가 없으면 id만 있는 빈 Program을 넘기지 않는다.
  // 매핑이 실패해도 본문이 전부 '-'로 보이고, 오류 문구는 가려진다.
  const companySchoolDetailProgram = isCompanySchoolPath
    ? companySchoolDetailData
    : (companySchoolDetailData ?? selectedProgramForFullPageModal)

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
    // 1사1교 목록에서 연 상세는 이 경로에 둔다. BE 숫자 id가 18xxxx여도 UJAT가 아니다.
    if (isCompanySchoolPath) return
    const pid = searchParams.get('programId')
    if (!pid || !isUjatProgramId(pid)) return
    const ujatLnb = resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info'
    const tab = searchParams.get('tab') ?? 'info'
    navigate(buildUjatProgramDetailUrl(pid, ujatLnb, tab), { replace: true })
  }, [isCompanySchoolPath, isFullPageModalPath, navigate, searchParams])

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
    if (!isCompanySchoolPath && isUjatProgramId(programIdFromUrl)) return

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
  const showBulkSelection =
    programType === 'company_school' && (statusFilter == null || statusFilter === 'scheduled')

  const isAdmin = user?.role === 'ADMIN'

  const showCalendarView =
    isAdmin && (programType === 'education' || programType === 'company_school')

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
      calendarProgramType: programType === 'company_school' ? 'COMPANY_SCHOOL' : 'GENERAL',
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
    if (programsToDelete.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    void (async () => {
      // 권한 설정 V1.2: 프로그램 삭제는 담당 프로그램의 Program Owner·Program Assistant만. 확인 모달 전에 막는다.
      if (!(await ensureProgramWriteAllowed(programsToDelete.map(p => p.id)))) return
      setProgramsPendingBulkDelete(programsToDelete)
      setBulkDeleteModalOpen(true)
    })()
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
      preloadGeneralProgramRegistrationModal()
      const next = new URLSearchParams(searchParams)
      next.set(PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY, '1')
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
      next.delete('programId')
      next.delete('lnb')
      next.delete('tab')
      if (mode === 'fresh') {
        next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_FRESH)
      } else if (mode === 'continue') {
        next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_CONTINUE)
      } else {
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
      }
      setSearchParams(next, { replace: false })
    },
    [searchParams, setSearchParams]
  )

  const handleCompanySchoolRegistrationSaved = useCallback(
    (program?: Program) => {
      void companySchoolListQuery.refetch()
      closeWritingUserPreview()
      const createdId = program?.id?.trim()
      if (createdId) {
        setSelectedProgramForFullPageModal(program ?? ({ id: createdId } as Program))
      }
      setSearchParams(
        prev => buildProgramListSearchParamsAfterRegistrationComplete(prev, createdId),
        { replace: true }
      )
    },
    [closeWritingUserPreview, companySchoolListQuery, setSearchParams]
  )

  const handleProgramCreateClick = () => {
    if (programType === 'company_school') {
      preloadGeneralProgramRegistrationModal()
      void (async () => {
        try {
          assertRegistrationWizardRemoteReady()
        } catch {
          showAlert({
            title: '프로그램 등록 불가',
            content:
              '프로그램 등록은 forms-surveys·programs remote API가 활성화된 환경에서만 이용할 수 있습니다.',
          })
          return
        }
        const draft = await fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE)
        if (draft != null) {
          setDraftNoticeTitle(draft.title)
          setDraftNoticeOpen(true)
          return
        }
        openCompanySchoolRegistration('fresh')
      })()
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
        // 기존 임시저장본은 유지 — 닫았다가 다시 진입해도 안내 팝업을 다시 노출
        openCompanySchoolRegistration('fresh')
        return
      }
      openCompanySchoolRegistration('continue')
    },
    [openCompanySchoolRegistration]
  )

  // 예정 프로그램 필터 해제 시 선택 초기화
  useEffect(() => {
    setSelectedRowKeys([])
  }, [statusFilter])

  const handleView = (program: Program) => {
    if (!user || !isAuthenticated) {
      const redirectPath = getProgramAdminDetailUrlFromPathname(program.id, location.pathname)
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    if (
      pNorm === '/programs/education/student-recruitment' ||
      pNorm === '/programs/general/student-recruitment'
    ) {
      setSelectedProgramForModal(program)
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
      const entry = resolveProgramListDetailEntry(program, { programType, statusFilter })
      nextParams.set('lnb', entry.lnb)
      nextParams.set('tab', entry.tab)
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

  const handleCloseFullPageModal = useCallback(() => {
    setSelectedProgramForFullPageModal(null)
    // 모달이 지나온 엔트리로 뒤로 이동 중이면 URL을 쓰지 않는다 — traversal 완료 전이라
    // 지금 쓰면(replace) 출발 엔트리(상세)가 목록 URL로 덮어써져 앞으로가기로 상세가 돌아오지 않는다.
    if (isHistoryTraversalPending()) return
    // 이미 다른 페이지로 이동했는데(지연 로딩 동안 이전 화면이 남아 있는 상태) 이 콜백이 불리면
    // 그 페이지 주소를 덮어쓰지 않는다 — 예: 후원사 링크 직후 남아 있던 프로그램 상세의 X
    if (window.location.pathname !== location.pathname) return
    // functional clear — 모달 LNB sync 클로저가 stale programId를 다시 싣는 레이스 방지
    setSearchParams(prev => clearGeneralProgramDetailQueryParams(new URLSearchParams(prev)), {
      replace: true,
    })
  }, [location.pathname, setSearchParams])

  /** ProgramList `FilterTableLayout`의 `actions` 슬롯 — 제목·건수는 `headerTitle`·목록 내부 건수로 표시 */
  const programListToolbarActions = (
    <div className="program-list-page__widget-header-actions">
      {showBulkSelection && (
        <FilterTableToolbarButton variant="delete" onClick={handleBulkDeleteClick}>
          선택 삭제
        </FilterTableToolbarButton>
      )}
      <FilterTableToolbarButton
        variant="secondary"
        icon={viewMode === 'list' ? <ButtonCalendarIcon /> : <ButtonListIcon />}
        onClick={handleViewModeToggle} >
        {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
      </FilterTableToolbarButton>
    </div>
  )

  const programListToolbarActionsAfterExcel = (
    <FilterTableToolbarButton variant="primary" onClick={handleProgramCreateClick}>
      신규 등록
    </FilterTableToolbarButton>
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
        loading={
          isCompanySchoolPath
            ? companySchoolListQuery.isFetching &&
              !companySchoolListQuery.isFetchingNextPage &&
              (filteredPrograms.length === 0 || companySchoolListQuery.isPlaceholderData)
            : loading
        }
        headerTitle={headerTitle}
        // 1사1교 「총 N건」은 지금까지 불러온 행 수가 아니라 서버 totalElements (일반·교사연수와 동일)
        headerCount={
          isCompanySchoolPath ? companySchoolListQuery.data?.pages[0]?.totalElements : undefined
        }
        onView={handleView}
        onSelectionChange={showBulkSelection ? setSelectedRowKeys : undefined}
        selectedRowKeys={showBulkSelection ? selectedRowKeys : undefined}
        showRowSelection={showBulkSelection}
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
      {isCompanySchoolPath ? (
        <div
          ref={companySchoolLoadMoreRef}
          className="program-list-page__load-more-sentinel"
          aria-hidden
          style={{ height: 1 }}
        />
      ) : null}

      <ProgramModalWhenOpen
        open={
          isCompanySchoolPath
            ? Boolean(companySchoolProgramIdFromUrl)
            : !!selectedProgramForFullPageModal
        }
      >
        <LazyProgramDetailFullPageModal
          open={
            isCompanySchoolPath
              ? Boolean(companySchoolProgramIdFromUrl)
              : !!selectedProgramForFullPageModal
          }
          program={companySchoolDetailProgram}
          programVariant={isCompanySchoolPath ? 'company-school' : undefined}
          externalLoading={
            isCompanySchoolPath
              ? Boolean(companySchoolProgramIdFromUrl) &&
                !companySchoolDetailData &&
                !companySchoolDetailQuery.isError &&
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
          onRequestDelete={program => {
            setProgramsPendingBulkDelete([program])
            setBulkDeleteModalOpen(true)
          }}
        />
      </ProgramModalWhenOpen>

      <ProgramModalWhenOpen open={isCompanySchoolRegistrationOpen} registrationEntry>
        <LazyGeneralProgramRegistrationFullpageModal
          open={isCompanySchoolRegistrationOpen}
          onClose={handleCloseCompanySchoolRegistrationFullpage}
          onProgramRegistrationSaved={handleCompanySchoolRegistrationSaved}
          registrationFormVariant="economy"
        />
      </ProgramModalWhenOpen>

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
      />

      <DeleteGuideModal
        open={bulkDeleteModalOpen}
        title={programBulkDeleteGuide.title}
        lines={programBulkDeleteGuide.lines}
        confirmText="삭제"
        onConfirm={() => {
          void (async () => {
            try {
              const idsToDelete = programsPendingBulkDelete.map(program => program.id)
              const openDetailProgramId =
                companySchoolProgramIdFromUrl ?? selectedProgramForFullPageModal?.id
              if (openDetailProgramId && idsToDelete.includes(openDetailProgramId)) {
                handleCloseFullPageModal()
              }
              if (isCompanySchoolPath) {
                await deleteCompanySchoolProgramsMutation.mutateAsync(idsToDelete)
                await companySchoolListQuery.refetch()
                setSelectedRowKeys([])
                setBulkDeleteModalOpen(false)
                setProgramsPendingBulkDelete([])
                showDeleteCompletedAlert()
              } else {
                await handleBulkDelete(programsPendingBulkDelete, () => setSelectedRowKeys([]))
                setBulkDeleteModalOpen(false)
                setProgramsPendingBulkDelete([])
              }
            } catch (error) {
              console.debug('program bulk delete failed', error)
              if (isProgramHardDeleteBlockedError(error)) {
                const count = programsPendingBulkDelete.length
                setProgramDeleteBlockedCopy(resolveProgramHardDeleteBlockedModalCopy(count))
                setBulkDeleteModalOpen(false)
                setProgramsPendingBulkDelete([])
                setProgramDeleteBlockedOpen(true)
                return
              }
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
      <DeleteBlockedGuideModal
        open={programDeleteBlockedOpen}
        onClose={() => setProgramDeleteBlockedOpen(false)}
        title={programDeleteBlockedCopy.title}
        description={programDeleteBlockedCopy.description}
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
