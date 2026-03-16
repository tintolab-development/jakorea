/**
 * 프로그램 목록 페이지 (Refactored)
 */

import { useState, useEffect } from 'react'
import { Tabs } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { ProgramList } from '@/features/program/ui/program-list'
import { AppButton } from '@/shared/ui/app-button'
import { useProgramStore } from '@/features/program/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProgramProgressWidget } from '@/features/dashboard/ui/program-progress-widget'
import { ProgressStagesWidget } from '@/features/dashboard/ui/progress-stages-widget'
import { ProgramProgressTabsTable } from '@/features/dashboard/ui/program-progress-tabs-table'
import type { Program, ProgramCategory, ProgramLifecycleStatus } from '@/types/domain'

// Local Hooks & Components
import { useProgramListFilters } from './use-program-list-filters'
import { useProgramListActions } from './use-program-list-actions'
import { useSearchSync } from './use-search-sync'
import { ProgramListModals } from './program-list-modals'

import './program-list-page.css'

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
    economyStages,
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
  const [, setDisplayCount] = useState<number | null>(null)
  const [, setHasListFilters] = useState(false)

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

  // Phase 0.2.1: 로그인 후 redirect 파라미터 대응
  useEffect(() => {
    const programId = params.programId
    if (programId && user && isAuthenticated) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setParam('programId', null)
        navigate(`/programs/${programId}`)
      }
    }
  }, [params.programId, user, isAuthenticated, programs, setParam, navigate])

  // 5. Handlers (role/action 플래그 — statusFilter, filteredPrograms는 useProgramListFilters에서 제공)
  const isAdmin = user?.role === 'ADMIN'
  const canWrite = canPerformWriteAction(user)
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
  const showEducationActions = Boolean(
    isAdmin && canWrite && (programType === 'education' || programType === 'economy')
  )
  const handleView = (program: Program) => {
    if (!user || !isAuthenticated) {
      const redirectPath = `/programs/${program.id}`
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

    navigate(`/programs/${program.id}`)
  }

  const handleEdit = (program: Program) => {
    openFormModal(program)
    closeDrawer()
  }

  const handleEconomyStageClick = (key: string) => {
    const nextParams = new URLSearchParams(searchParams)
    if (key === 'total') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', key)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleViewModeToggle = () => {
    const newViewMode = viewMode === 'list' ? 'calendar' : 'list'
    setViewMode(newViewMode)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('viewMode', newViewMode)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div>
      {/* 위젯 영역 */}
      {isAdmin && programType === 'economy' && (
        <div className="program-progress-widget-container">
          <ProgressStagesWidget
            stages={economyStages}
            firstCardVariant="teal"
            showDividerAfterFirstCard={false}
            showBottomDivider
            onStageClick={handleEconomyStageClick}
          />
        </div>
      )}

      {isAdmin &&
        programType === 'education' &&
        !location.pathname.startsWith('/programs/education') && (
          <div className="program-progress-widget-container">
            <ProgramProgressWidget title={null} />
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
        onSelectionChange={showEducationActions ? setSelectedRowKeys : undefined}
        selectedRowKeys={showEducationActions ? selectedRowKeys : undefined}
        showActions={showEducationActions}
        showRowSelection={showEducationActions}
        showFavorite={false}
        onChangeStatus={showEducationActions ? handleStatusChange : undefined}
        showCalendarView={isAdmin && (programType === 'education' || programType === 'economy')}
        onCreateNew={showEducationActions ? () => openFormModal() : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        tableVariant={programType === 'economy' ? 'education' : programType}
        readOnlyLifecycleStatus={programType === 'economy'}
        studentRecruitmentTable={statusFilter === 'recruiting_students'}
        instructorRecruitmentTable={statusFilter === 'recruiting_instructors'}
        onDisplayCountChange={(count, hasActiveFilters) => {
          setDisplayCount(count)
          setHasListFilters(hasActiveFilters)
        }}
        effectiveLifecycleStatus={
          programType === 'economy' ? undefined : (statusFilter as ProgramLifecycleStatus | null)
        }
      >
        {isAdmin &&
          (programType === 'education' || programType === 'economy') &&
          statusFilter === null && (
            <div className="program-list-page__widget-header-actions" style={{ marginBottom: 16 }}>
              <AppButton
                variant="cancel"
                size="filter"
                icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
                onClick={handleViewModeToggle}
                className="program-view-mode-button"
              >
                {viewMode === 'list' ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
              </AppButton>
              {showEducationActions && (
                <AppButton variant="primary" size="filter" onClick={() => openFormModal()}>
                  프로그램 신규 등록
                </AppButton>
              )}
            </div>
          )}
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
      />
    </div>
  )
}

export default ProgramListPage
