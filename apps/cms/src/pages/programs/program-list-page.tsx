/**
 * 프로그램 목록 페이지
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Modal } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { EconomyView } from '@/features/program/ui/table/program-table-column-resolver'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/lib/program-admin-detail-url'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'

// Local Hooks & Components
import { useProgramListFilters } from './use-program-list-filters'
import { useProgramListActions } from './use-program-list-actions'
import { useSearchSync } from './use-search-sync'
import { ProgramListModals } from './program-list-modals'

import './program-list-page.css'
import { CmsButton } from '@/shared/ui'

export function ProgramListPage() {
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

  // 2. Local State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [, setHasListFilters] = useState(false)
  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  // 헤더 타이틀 계산: statusFilter (위젯 클릭) → 모집단계 라벨 → "전체 프로그램"
  const headerTitle = useMemo(() => {
    if (programType === 'economy' && statusFilter) {
      if (statusFilter === 'economy_scheduled') return '진행 예정 프로그램'
      if (statusFilter === 'economy_in_progress') return '진행 중인 프로그램'
      if (statusFilter === 'economy_completed') return '진행 완료된 프로그램'
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

  const isRecruitmentRoute =
    location.pathname === '/programs/education/student-recruitment' ||
    location.pathname === '/programs/education/instructor-recruitment'

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

  // 풀페이지 모달 ↔ 쿼리 파라미터(programId) 연동 — 새로고침 시에도 모달 유지
  const isFullPageModalPath =
    location.pathname === '/programs/education' ||
    location.pathname === '/programs/economy-education'
  useEffect(() => {
    if (!isFullPageModalPath) return
    const programIdFromUrl = searchParams.get('programId')
    if (!programIdFromUrl) return
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

  /** 예정 프로그램 필터 활성 시에만 행 선택·선택 삭제 표시 (경제 교육 페이지) */
  const isScheduledFilter = programType === 'economy' && statusFilter === 'economy_scheduled'

  const isAdmin = user?.role === 'ADMIN'

  const showCalendarView = isAdmin && (programType === 'education' || programType === 'economy')

  const programListConfig = useMemo(() => {
    const economyView: EconomyView =
      statusFilter === 'economy_scheduled'
        ? 'SCHEDULED'
        : statusFilter === 'economy_in_progress'
          ? 'IN_PROGRESS'
          : statusFilter === 'economy_completed'
            ? 'COMPLETED'
            : 'ALL'

    return {
      mode: programType === 'economy' ? ('economy' as const) : ('general' as const),
      view: economyView,
      tableType:
        statusFilter === 'recruiting_students'
          ? ('student' as const)
          : statusFilter === 'recruiting_instructors'
            ? ('instructor' as const)
            : undefined,
      lifecycleStatus:
        programType === 'economy'
          ? undefined
          : statusFilter === 'matching_completed'
            ? ('education_before_textbook' as const)
            : (statusFilter as ProgramLifecycleStatus | null),
    }
  }, [programType, statusFilter])

  const handleBulkDeleteClick = () => {
    const programsToDelete = filteredPrograms.filter(p => selectedRowKeys.includes(p.id))
    if (programsToDelete.length === 0) return
    Modal.confirm({
      title: '선택 삭제',
      content: `선택한 ${programsToDelete.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      cancelText: '취소',
      onOk: () => handleBulkDelete(programsToDelete, () => setSelectedRowKeys([])),
    })
  }

  const handleProgramCreateClick = () => {
    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
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

    if (location.pathname === '/programs/education/student-recruitment') {
      setSelectedProgramForModal(program)
      return
    }

    if (location.pathname === '/programs/education/instructor-recruitment') {
      setSelectedProgramForInstructorModal(program)
      return
    }

    if (
      location.pathname === '/programs/education' ||
      location.pathname === '/programs/economy-education'
    ) {
      setSelectedProgramForFullPageModal(program)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('programId', program.id)
      setSearchParams(nextParams, { replace: true })
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

  /** ProgramList `FilterTableLayout`의 `actions` 슬롯 — 제목·건수는 `headerTitle`·목록 내부 건수로 표시 */
  const programListToolbarActions = (
    <div className="program-list-page__widget-header-actions">
      {isScheduledFilter && (
        <CmsButton
          variant="delete"
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
      <CmsButton width={180} onClick={handleProgramCreateClick}>
        프로그램 신규 등록
      </CmsButton>
    </div>
  )

  return (
    <div>
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
        tableVariant={programType === 'economy' ? 'economy' : 'general'}
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
      >
        {programListToolbarActions}
      </ProgramList>

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
        selectedProgramForFullPageModal={selectedProgramForFullPageModal}
        onCloseFullPageModal={() => {
          setSelectedProgramForFullPageModal(null)
          const nextParams = new URLSearchParams(searchParams)
          nextParams.delete('programId')
          nextParams.delete('tab')
          setSearchParams(nextParams, { replace: true })
        }}
      />
    </div>
  )
}

export default ProgramListPage
