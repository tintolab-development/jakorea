/**
 * 프로그램 목록 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { Tabs, Modal } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { AppButton } from '@/shared/ui/app-button'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { Program, ProgramCategory, ProgramLifecycleStatus } from '@/types/domain'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/lib/program-admin-detail-url'

// Local Hooks & Components
import { useProgramListFilters } from './use-program-list-filters'
import { useProgramListActions } from './use-program-list-actions'
import { useSearchSync } from './use-search-sync'
import { ProgramListModals } from './program-list-modals'

import './program-list-page.css'
import { Divider } from '@/shared/components/divider'

export function ProgramListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const programStore = useProgramStore()
  const { programs, loading, fetchPrograms, selectedProgram, setSelectedProgram } = programStore

  // 1. Logic Hooks
  const {
    programType,
    statusFilter,
    filteredPrograms,
    categoryTab,
    handleCategoryTabChange,
    params,
    setParam,
  } = useProgramListFilters(programs, user)

  const {
    formLoading,
    handleFormSubmit,
    handleConfirmDelete,
    handleBulkDelete,
    handleStatusChange,
    getDeleteConfirmMessage,
    programToDelete,
    setProgramToDelete,
    deleteModalOpen,
    setDeleteModalOpen,
  } = useProgramListActions()

  const { searchParams, setSearchParams } = useSearchSync()

  // 2. Local State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [displayCount, setDisplayCount] = useState<number | null>(null)
  const [, setHasListFilters] = useState(false)

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
    const isRecruitmentRoute =
      location.pathname === '/programs/education/student-recruitment' ||
      location.pathname === '/programs/education/instructor-recruitment'
    if (isRecruitmentRoute && viewMode !== 'list') {
      setViewMode('list')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('viewMode', 'list')
      setSearchParams(nextParams, { replace: true })
    }
  }, [location.pathname, viewMode, searchParams, setSearchParams])

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
        navigate(getProgramAdminDetailUrlFromPathname(programId, location.pathname), { replace: true })
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

  // 5. Handlers (role/action 플래그 — statusFilter, filteredPrograms는 useProgramListFilters에서 제공)
  const isAdmin = user?.role === 'ADMIN'
  const canWrite = canPerformWriteAction(user)
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
  const showEducationActions = Boolean(
    isAdmin && canWrite && (programType === 'education' || programType === 'economy')
  )

  /** 예정 프로그램 필터 활성 시에만 행 선택·선택 삭제 표시 (경제 교육 페이지) */
  const isScheduledFilter = programType === 'economy' && statusFilter === 'economy_scheduled'
  const showRowSelectionForScheduled = showEducationActions && isScheduledFilter

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
    window.alert('준비중입니다.')
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

  const programListHeader = (
    <>
      {viewMode === 'list' && (
        <div className="program-list-page__divider-wrapper">
          <Divider />
        </div>
      )}
      {isAdmin && (programType === 'education' || programType === 'economy') && (
        <div className="program-list-page__filter-info">
          <div className="program-list-page__filter-info-texts">
            <div className="program-list-page__filter-info-title">{headerTitle}</div>
            {displayCount !== null && (
              <div className="program-list-page__filter-info-count">
                총 {displayCount.toLocaleString()}건
              </div>
            )}
          </div>
          <div className="program-list-page__widget-header-actions">
            {isScheduledFilter && (
              <AppButton
                variant="cancel"
                size="filter"
                onClick={handleBulkDeleteClick}
                disabled={selectedRowKeys.length === 0}
                className="program-list-page__bulk-delete-button"
              >
                선택 삭제
              </AppButton>
            )}
            <AppButton
              variant="cancel"
              size="filter-wide"
              icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
              onClick={handleViewModeToggle}
            >
              {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
            </AppButton>
            {showEducationActions && (
              <AppButton variant="primary" size="filter-wide" onClick={handleProgramCreateClick}>
                프로그램 신규 등록
              </AppButton>
            )}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div
      className={[
        'program-list-page',
        programType === 'economy' ? 'program-list-page--economy-education' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 위젯 영역 */}
      {isAdmin && (
        <div className="program-progress-widget-container">
          <ProgramStatusWidget title={null} />
        </div>
      )}

      {isAdmin && programType === 'all' && (
        <div className="program-list-widget-container">
          <ProgramProgressTabsTable />
        </div>
      )}

      {/* 강사용 탭 */}
      {isUserRole && !isAdmin && (
        <Tabs
          activeKey={categoryTab}
          onChange={key => handleCategoryTabChange(key as ProgramCategory | 'all')}
          items={[
            { key: 'all', label: '전체' },
            { key: 'individual', label: '개인 학생 대상 프로그램' },
            { key: 'school', label: '단체(학교) 대상 프로그램' },
          ]}
          style={{ marginBottom: 16 }}
        />
      )}

      <ProgramList
        data={filteredPrograms}
        loading={loading}
        onView={handleView}
        onEdit={showEducationActions ? handleEdit : undefined}
        onDelete={
          showEducationActions
            ? p => {
                setProgramToDelete(p)
                setDeleteModalOpen(true)
              }
            : undefined
        }
        onBulkDelete={
          showEducationActions
            ? programs => handleBulkDelete(programs, () => setSelectedRowKeys([]))
            : undefined
        }
        onSelectionChange={showRowSelectionForScheduled ? setSelectedRowKeys : undefined}
        selectedRowKeys={showRowSelectionForScheduled ? selectedRowKeys : undefined}
        showActions={showEducationActions}
        showRowSelection={showRowSelectionForScheduled}
        showFavorite={false}
        onChangeStatus={showEducationActions ? handleStatusChange : undefined}
        showCalendarView={isAdmin && (programType === 'education' || programType === 'economy')}
        onCreateNew={showEducationActions ? handleProgramCreateClick : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tableVariant={programType === 'economy' ? 'education' : programType}
        readOnlyLifecycleStatus={programType === 'economy'}
        economyScheduledFilterLayout={
          programType === 'economy' &&
          (statusFilter === 'economy_scheduled' ||
            statusFilter === 'economy_in_progress' ||
            statusFilter === 'economy_completed')
        }
        economyInProgressActive={programType === 'economy' && statusFilter === 'economy_in_progress'}
        economyCompletedActive={programType === 'economy' && statusFilter === 'economy_completed'}
        economyAllProgramsActive={programType === 'economy' && statusFilter === null}
        studentRecruitmentTable={statusFilter === 'recruiting_students'}
        instructorRecruitmentTable={statusFilter === 'recruiting_instructors'}
        onDisplayCountChange={(count, hasActiveFilters) => {
          setDisplayCount(count)
          setHasListFilters(hasActiveFilters)
        }}
        effectiveLifecycleStatus={
          programType === 'economy'
            ? undefined
            : statusFilter === 'matching_completed'
              ? 'education_before_textbook'
              : (statusFilter as ProgramLifecycleStatus | null)
        }
      >
        {programListHeader}
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
        hideActions={!showEducationActions}
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
