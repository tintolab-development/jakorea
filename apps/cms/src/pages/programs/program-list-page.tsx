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
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'

import './program-list-page.css'
import { DELETE_GUIDE_TYPED_CONFIRM_VALUE } from '@/shared/constants'
import { CmsButton, DeleteGuideModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

const PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY = 'new'

function ProgramListPageContent() {
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const programStore = useProgramStore()
  const { programs, loading, fetchPrograms, selectedProgram, setSelectedProgram } = programStore

  // 1. Logic Hooks
  const { programType, statusFilter, filteredPrograms, params, setParam } = useProgramListFilters(
    programs,
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

  const pNorm = location.pathname.replace(/\/$/, '') || '/'
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

  // 4. Effects
  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

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
    if (!programIdFromUrl) return
    if (isUjatProgramId(programIdFromUrl)) return
    // 목록은 filteredPrograms(교육/경제 시 mock) 기준이므로 여기서 찾아야 새로고침 복원이 안정적임
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(p => p.id === programIdFromUrl)
    if (program) {
      setSelectedProgramForFullPageModal(program)
    }
  }, [isFullPageModalPath, searchParams, filteredPrograms, setSelectedProgramForFullPageModal])

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
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
  }, [closeWritingUserPreview, searchParams, setSearchParams])

  const handleCompanySchoolRegistrationSaved = useCallback(() => {
    void fetchPrograms()
    handleCloseCompanySchoolRegistrationFullpage()
  }, [fetchPrograms, handleCloseCompanySchoolRegistrationFullpage])

  const handleProgramCreateClick = () => {
    if (programType === 'company_school') {
      const next = new URLSearchParams(searchParams)
      next.set(PROGRAMS_COMPANY_SCHOOL_NEW_QUERY_KEY, '1')
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
      next.delete('programId')
      next.delete('lnb')
      next.delete('tab')
      setSearchParams(next, { replace: false })
      return
    }

    showAlert({
      title: '안내',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }

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
        width={180}
        icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
        onClick={handleViewModeToggle}
      >
        {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
      </CmsButton>
    </div>
  )

  const programListToolbarActionsAfterExcel = (
    <CmsButton width={180} onClick={handleProgramCreateClick}>
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
        loading={loading}
        headerTitle={headerTitle}
        onView={handleView}
        onSelectionChange={isScheduledFilter ? setSelectedRowKeys : undefined}
        selectedRowKeys={isScheduledFilter ? selectedRowKeys : undefined}
        showRowSelection={isScheduledFilter}
        showCalendarView={showCalendarView}
        viewMode={viewMode}
        tableVariant={programType === 'company_school' ? 'overview' : 'general'}
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
        toolbarActionsAfterExcel={programListToolbarActionsAfterExcel}
      >
        {programListToolbarActions}
      </ProgramList>

      <ProgramDetailFullPageModal
        open={!!selectedProgramForFullPageModal}
        program={selectedProgramForFullPageModal}
        onClose={handleCloseFullPageModal}
      />

      <GeneralProgramRegistrationFullpageModal
        open={isCompanySchoolRegistrationOpen}
        onClose={handleCloseCompanySchoolRegistrationFullpage}
        onProgramRegistrationSaved={handleCompanySchoolRegistrationSaved}
        registrationFormVariant="economy"
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
          handleBulkDelete(programsPendingBulkDelete, () => setSelectedRowKeys([]))
          setBulkDeleteModalOpen(false)
          setProgramsPendingBulkDelete([])
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
