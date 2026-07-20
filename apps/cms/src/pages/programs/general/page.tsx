/**
 * 프로그램 관리 > 일반 프로그램 목록
 * 레이아웃·공통 컴포넌트: program-list-page.tsx / ProgramList (overview 모드) 패턴
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import { GeneralProgramDetailFullPageModal } from '@/features/program/general/ui/detail-modal/detail-fullpage-modal'
import { GeneralProgramRegistrationFullpageModal } from '@/features/program/general/ui/registration/registration-fullpage-modal'
import { useDeleteGeneralPrograms } from '@/features/program/general/hooks/use-delete-general-program'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  isGeneralProgramId,
  resolveGeneralProgramForDetail,
} from '@/features/program/general/lib/detail-meta'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import type { Program } from '@/types/domain'
import { CmsButton, ConfirmModal } from '@/shared/ui'
import { useProgramListActions } from '@/pages/programs/use-program-list-actions'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { useGeneralProgramListFilters } from './use-general-program-list-filters'
import { clearSponsorDetailQueryStack } from '@/features/sponsor/lib/sponsor-detail-query-stack'
import { clearGeneralProgramDetailQueryParams } from '@/features/program/general/lib/general-program-detail-route'
import {
  clearRegistrationDraftForFreshStart,
  peekRegistrationDraftNotice,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'

import './general-program-list-page.css'

/** `/programs/general?new` — 일반 프로그램 등록 폼 풀페이지 */
const PROGRAMS_GENERAL_NEW_QUERY_KEY = 'new'

function isGeneralProgramListPath(pathnameNormalized: string): boolean {
  return (
    pathnameNormalized === '/programs/general' ||
    pathnameNormalized.startsWith('/programs/general/')
  )
}

export function GeneralProgramListPageContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const pNorm = location.pathname.replace(/\/$/, '') || '/'

  const isGeneralProgramNewRegistrationQuery =
    isGeneralProgramListPath(pNorm) && searchParams.has(PROGRAMS_GENERAL_NEW_QUERY_KEY)

  const { user, isAuthenticated } = useAuthStore()

  const {
    filteredPrograms,
    headerTitle,
    programListConfig,
    statusFilter,
    refetchPrograms,
    loading: listLoading,
    isRemoteDataSource,
  } = useGeneralProgramListFilters()

  const deleteGeneralProgramsMutation = useDeleteGeneralPrograms()

  const { handleBulkDelete } = useProgramListActions()

  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()

  const [selectedProgramForDetail, setSelectedProgramForDetail] = useState<Program | null>(null)
  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')

  const openNewRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(PROGRAMS_GENERAL_NEW_QUERY_KEY, '1')
          if (mode === 'fresh') {
            next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_FRESH)
          } else {
            next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
          }
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const handleCloseGeneralProgramRegistrationFullpage = useCallback(() => {
    if (!isGeneralProgramListPath(pNorm)) return
    closeWritingUserPreview()
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(PROGRAMS_GENERAL_NEW_QUERY_KEY)
        next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
        next.delete('userPreview')
        return next
      },
      { replace: true }
    )
  }, [closeWritingUserPreview, pNorm, setSearchParams])

  const handleGeneralProgramRegistrationSaved = useCallback(
    (createdProgram?: Program) => {
      refetchPrograms()
      if (createdProgram) {
        setSelectedProgramForDetail(createdProgram)
        setSearchParams(
          prev => {
            const next = clearGeneralProgramDetailQueryParams(new URLSearchParams(prev))
            next.delete(PROGRAMS_GENERAL_NEW_QUERY_KEY)
            next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
            next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
            next.delete('userPreview')
            next.set('programId', createdProgram.id)
            next.set('lnb', 'info')
            next.set('tab', 'info')
            return next
          },
          { replace: true }
        )
        return
      }
      handleCloseGeneralProgramRegistrationFullpage()
    },
    [
      handleCloseGeneralProgramRegistrationFullpage,
      refetchPrograms,
      setSearchParams,
      setSelectedProgramForDetail,
    ]
  )

  const userPreviewSyncParams = useMemo(
    () => ({ userPreview: searchParams.get('userPreview') ?? undefined }),
    [searchParams]
  )

  const setUserPreviewSyncParams = useCallback(
    (updates: { userPreview?: string }, options?: SetQueryParamsOptions) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (updates.userPreview === undefined || updates.userPreview === '') {
            next.delete('userPreview')
          } else {
            next.set('userPreview', updates.userPreview)
          }
          return next
        },
        { replace: options?.replace ?? true }
      )
    },
    [setSearchParams]
  )

  useWritingUserPreviewUrlAuxiliarySync(
    userPreviewSyncParams,
    setUserPreviewSyncParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview
  )

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [programsPendingBulkDelete, setProgramsPendingBulkDelete] = useState<Program[]>([])

  const isScheduledFilter = statusFilter === 'scheduled'
  const [, setHasListFilters] = useState(false)
  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  useEffect(() => {
    if (!isScheduledFilter) setSelectedRowKeys([])
  }, [isScheduledFilter])

  useEffect(() => {
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  const programIdFromUrl = searchParams.get('programId')

  useEffect(() => {
    if (searchParams.has(PROGRAMS_GENERAL_NEW_QUERY_KEY)) {
      setSelectedProgramForDetail(null)
      return
    }
    const pid = searchParams.get('programId')
    if (!pid) {
      setSelectedProgramForDetail(null)
      return
    }
    if (!isGeneralProgramId(pid, filteredPrograms)) return
    const resolved =
      filteredPrograms.find(p => p.id === pid) ??
      resolveGeneralProgramForDetail(pid) ??
      null
    if (resolved) setSelectedProgramForDetail(resolved)
  }, [searchParams, filteredPrograms])

  // UJAT/Gemini와 동일 — open은 URL(programId)이 SSOT (state가 아니어야 뒤로가기와 동기화)
  const generalDetailModalOpen =
    Boolean(programIdFromUrl) && !searchParams.has(PROGRAMS_GENERAL_NEW_QUERY_KEY)

  const generalDetailProgram = useMemo(() => {
    if (!programIdFromUrl) return null
    if (selectedProgramForDetail?.id === programIdFromUrl) {
      return selectedProgramForDetail
    }
    return (
      filteredPrograms.find(p => p.id === programIdFromUrl) ??
      resolveGeneralProgramForDetail(programIdFromUrl) ??
      null
    )
  }, [programIdFromUrl, selectedProgramForDetail, filteredPrograms])

  const applyListSearchRef = useRef<(() => void) | null>(null)

  const handleCloseFullPageModal = useCallback(() => {
    applyListSearchRef.current?.()
    setSelectedProgramForDetail(null)
    setSearchParams(
      prev =>
        clearGeneralProgramDetailQueryParams(clearSponsorDetailQueryStack(new URLSearchParams(prev))),
      { replace: true }
    )
  }, [setSearchParams])

  useEffect(() => {
    if (!programIdFromUrl) return
    if (searchParams.has(PROGRAMS_GENERAL_NEW_QUERY_KEY)) return
    if (!isGeneralProgramId(programIdFromUrl, filteredPrograms)) return
    if (listLoading) return
    if (filteredPrograms.some(p => p.id === programIdFromUrl)) return
    if (resolveGeneralProgramForDetail(programIdFromUrl)) return
    handleCloseFullPageModal()
  }, [programIdFromUrl, listLoading, filteredPrograms, handleCloseFullPageModal])

  const prevStatusFilterRef = useRef<typeof statusFilter | undefined>(undefined)
  useEffect(() => {
    if (prevStatusFilterRef.current === undefined) {
      prevStatusFilterRef.current = statusFilter
      return
    }
    if (programIdFromUrl && prevStatusFilterRef.current !== statusFilter) {
      handleCloseFullPageModal()
    }
    prevStatusFilterRef.current = statusFilter
  }, [statusFilter, programIdFromUrl, handleCloseFullPageModal])

  const isAdmin = user?.role === 'ADMIN'
  const showCalendarView = isAdmin

  const handleBulkDeleteClick = () => {
    const programsToDelete = filteredPrograms.filter(p => selectedRowKeys.includes(p.id))
    if (programsToDelete.length === 0) return
    setProgramsPendingBulkDelete(programsToDelete)
    setBulkDeleteModalOpen(true)
  }

  const handleProgramCreateClick = useCallback(() => {
    const draft = peekRegistrationDraftNotice(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
    if (draft != null) {
      setDraftNoticeTitle(draft.title)
      setDraftNoticeOpen(true)
      return
    }
    openNewRegistration()
  }, [openNewRegistration])

  const handleDraftNoticeConfirm = useCallback(
    (choice: RegistrationDraftNoticeChoice) => {
      setDraftNoticeOpen(false)
      if (choice === 'fresh') {
        clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
        openNewRegistration('fresh')
        return
      }
      openNewRegistration('continue')
    },
    [openNewRegistration]
  )

  const handleView = (program: Program) => {
    if (!user || !isAuthenticated) {
      const redirectPath = getProgramAdminDetailUrlFromPathname(program.id, '/programs/general')
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    setSelectedProgramForDetail(program)
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('programId', program.id)
        if (!nextParams.get('lnb')) nextParams.set('lnb', 'info')
        if (!nextParams.get('tab')) nextParams.set('tab', 'info')
        return nextParams
      },
      { replace: false }
    )
  }

  const handleViewModeToggle = () => {
    const newViewMode = viewMode === 'list' ? 'calendar' : 'list'
    setViewMode(newViewMode)
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('viewMode', newViewMode)
        return nextParams
      },
      { replace: true }
    )
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
        'program-list-page--overview',
        'general-program-list-page',
        isScheduledFilter && 'program-list-page--scheduled-filters',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="program-progress-widget-container">
        <ProgramStatusWidget
          title={null}
          onBeforeStageChange={
            generalDetailModalOpen ? handleCloseFullPageModal : undefined
          }
        />
      </div>
      <ProgramList
        data={filteredPrograms}
        loading={listLoading}
        headerTitle={headerTitle}
        onView={handleView}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        disableUrlSync={generalDetailModalOpen}
        onRegisterApplySearch={applySearch => {
          applyListSearchRef.current = applySearch
        }}
        onSelectionChange={isScheduledFilter ? setSelectedRowKeys : undefined}
        selectedRowKeys={isScheduledFilter ? selectedRowKeys : undefined}
        showRowSelection={isScheduledFilter}
        showCalendarView={showCalendarView}
        viewMode={viewMode}
        tableVariant="overview"
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
        toolbarActionsAfterExcel={programListToolbarActionsAfterExcel}
      >
        {programListToolbarActions}
      </ProgramList>

      <GeneralProgramDetailFullPageModal
        open={generalDetailModalOpen}
        program={generalDetailProgram}
        programIdHint={programIdFromUrl}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        onClose={handleCloseFullPageModal}
      />

      <GeneralProgramRegistrationFullpageModal
        open={isGeneralProgramNewRegistrationQuery}
        onClose={handleCloseGeneralProgramRegistrationFullpage}
        onProgramRegistrationSaved={handleGeneralProgramRegistrationSaved}
      />

      <RegistrationDraftNoticeModal
        open={draftNoticeOpen}
        draftTitle={draftNoticeTitle}
        onConfirm={handleDraftNoticeConfirm}
        onCancel={() => setDraftNoticeOpen(false)}
      />

      <ConfirmModal
        open={bulkDeleteModalOpen}
        title="선택 삭제"
        content={`선택한 ${programsPendingBulkDelete.length}건을 삭제하시겠습니까?`}
        confirmText="삭제"
        cancelText="취소"
        danger
        onConfirm={async () => {
          if (isRemoteDataSource) {
            await deleteGeneralProgramsMutation.mutateAsync(
              programsPendingBulkDelete.map(program => program.id)
            )
            refetchPrograms()
          } else {
            await handleBulkDelete(programsPendingBulkDelete, () => setSelectedRowKeys([]))
          }
          setSelectedRowKeys([])
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

export function GeneralProgramListPage() {
  return (
    <TemplateWritingPreviewProvider>
      <GeneralProgramListPageContent />
    </TemplateWritingPreviewProvider>
  )
}

export default GeneralProgramListPage

