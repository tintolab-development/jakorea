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
import { ProgramDetailFullPageModal } from '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import type { Program } from '@/types/domain'
import { CmsButton } from '@/shared/ui'
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

  const { filteredPrograms, headerTitle, programListConfig } = useGeneralProgramListFilters()

  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)
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
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  useEffect(() => {
    const programIdFromUrl = searchParams.get('programId')
    if (!programIdFromUrl) return
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(p => p.id === programIdFromUrl)
    if (program) {
      setSelectedProgramForFullPageModal(program)
    }
  }, [searchParams, filteredPrograms])

  const isAdmin = user?.role === 'ADMIN'
  const showCalendarView = isAdmin

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
    <div className="program-list-page program-list-page--economy-education general-program-list-page">
      <div className="program-progress-widget-container">
        <ProgramStatusWidget title={null} />
      </div>
      <ProgramList
        data={filteredPrograms}
        loading={loading}
        headerTitle={headerTitle}
        onView={handleView}
        showCalendarView={showCalendarView}
        viewMode={viewMode}
        tableVariant="economy"
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
      >
        {programListToolbarActions}
      </ProgramList>

      <ProgramDetailFullPageModal
        open={!!selectedProgramForFullPageModal}
        program={selectedProgramForFullPageModal}
        onClose={handleCloseFullPageModal}
      />
    </div>
  )
}

export default GeneralProgramListPage
