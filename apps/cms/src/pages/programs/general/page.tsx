/**
 * 프로그램 관리 > 일반 프로그램 목록
 * 레이아웃·공통 컴포넌트: program-list-page.tsx / ProgramList (economy 모드) 패턴
 */

import { useState, useEffect, useCallback } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import { GeneralProgramDetailFullPageModal } from '@/features/program/general/ui/detail-modal/general-program-detail-fullpage-modal'
import { isGeneralProgramId } from '@/features/program/general/lib/general-program-detail-meta'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import type { Program } from '@/types/domain'
import { CmsButton, ConfirmModal } from '@/shared/ui'
import { useProgramListActions } from '@/pages/programs/use-program-list-actions'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { useGeneralProgramListFilters } from './use-general-program-list-filters'

import './general-program-list-page.css'

export function GeneralProgramListPage() {
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { loading, fetchPrograms } = useProgramStore()

  const { filteredPrograms, headerTitle, programListConfig, statusFilter } =
    useGeneralProgramListFilters()

  const { handleBulkDelete } = useProgramListActions()

  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [programsPendingBulkDelete, setProgramsPendingBulkDelete] = useState<Program[]>([])

  const isScheduledFilter = statusFilter === 'economy_scheduled'
  const [, setHasListFilters] = useState(false)
  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  useEffect(() => {
    if (!isScheduledFilter) setSelectedRowKeys([])
  }, [isScheduledFilter])

  useEffect(() => {
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  useEffect(() => {
    const programIdFromUrl = searchParams.get('programId')
    if (!programIdFromUrl) return
    if (!isGeneralProgramId(programIdFromUrl)) return
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(p => p.id === programIdFromUrl)
    if (program) {
      setSelectedProgramForFullPageModal(program)
    }
  }, [searchParams, filteredPrograms])

  const programIdFromUrl = searchParams.get('programId')
  const generalDetailModalOpen = Boolean(programIdFromUrl)

  const isAdmin = user?.role === 'ADMIN'
  const showCalendarView = isAdmin

  const handleBulkDeleteClick = () => {
    const programsToDelete = filteredPrograms.filter(p => selectedRowKeys.includes(p.id))
    if (programsToDelete.length === 0) return
    setProgramsPendingBulkDelete(programsToDelete)
    setBulkDeleteModalOpen(true)
  }

  const handleProgramCreateClick = () => {
    showAlert({
      title: '안내',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }

  const handleView = (program: Program) => {
    if (!user || !isAuthenticated) {
      const redirectPath = getProgramAdminDetailUrlFromPathname(program.id, '/programs/general')
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    setSelectedProgramForFullPageModal(program)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('programId', program.id)
    if (!nextParams.get('lnb')) nextParams.set('lnb', 'info')
    if (!nextParams.get('tab')) nextParams.set('tab', 'info')
    setSearchParams(nextParams, { replace: false })
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
      <CmsButton width={180} onClick={handleProgramCreateClick}>
        프로그램 신규 등록
      </CmsButton>
    </div>
  )

  return (
    <div
      className={[
        'program-list-page',
        'program-list-page--overview',
        'general-program-list-page',
        isScheduledFilter && 'program-list-page--scheduled-filters',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
        tableVariant="overview"
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
      >
        {programListToolbarActions}
      </ProgramList>

      <GeneralProgramDetailFullPageModal
        open={generalDetailModalOpen}
        program={selectedProgramForFullPageModal}
        programIdHint={programIdFromUrl}
        onClose={handleCloseFullPageModal}
      />

      <ConfirmModal
        open={bulkDeleteModalOpen}
        title="선택 삭제"
        content={`선택한 ${programsPendingBulkDelete.length}건을 삭제하시겠습니까?`}
        confirmText="삭제"
        cancelText="취소"
        danger
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

export default GeneralProgramListPage
