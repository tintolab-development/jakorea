/**
 * 프로그램 관리 > 교육받은 교사 프로그램
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { ProgramDetailFullPageModal } from '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal'
import { GeneralProgramRegistrationFullpageModal } from '@/features/program/general/ui/registration/registration-fullpage-modal'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  clearRegistrationDraftForFreshStart,
  peekRegistrationDraftNotice,
  PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import { CmsButton, ConfirmModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { clearSponsorDetailQueryStack } from '@/features/sponsor/lib/sponsor-detail-query-stack'
import { useProgramListActions } from '@/pages/programs/use-program-list-actions'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  useDeleteTrainedTeacherPrograms,
  usePrefetchTrainedTeacherProgramDetail,
  useTrainedTeacherProgramDetail,
  useUpdateTrainedTeacherProgram,
} from '@/features/program/trained-teachers/api/hooks'
import { useTrainedTeachersProgramListFilters } from '@/features/program/trained-teachers/hooks/use-list-filters'

import '../program-list-page.css'

const TRAINED_TEACHERS_NEW_QUERY_KEY = 'new'
const TRAINED_TEACHERS_LIST_PATH = '/programs/trained-teachers'

function isTrainedTeachersProgramListPath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/$/, '') || '/'
  return (
    normalizedPath === TRAINED_TEACHERS_LIST_PATH ||
    normalizedPath.startsWith(`${TRAINED_TEACHERS_LIST_PATH}/`)
  )
}

function TrainedTeachersProgramPageContent() {
  const { showAlert } = useCmsAlert()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const normalizedPath = location.pathname.replace(/\/$/, '') || '/'
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()

  const { user, isAuthenticated } = useAuthStore()
  const { handleBulkDelete } = useProgramListActions()
  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()
  const {
    filteredPrograms,
    headerTitle,
    programListConfig,
    statusFilter,
    refetchPrograms,
    listQuery,
  } = useTrainedTeachersProgramListFilters()
  const updateMutation = useUpdateTrainedTeacherProgram()
  const deleteProgramsMutation = useDeleteTrainedTeacherPrograms()

  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [programsPendingBulkDelete, setProgramsPendingBulkDelete] = useState<Program[]>([])
  const [, setHasListFilters] = useState(false)
  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')

  const isTrainedTeachersRegistrationOpen =
    isTrainedTeachersProgramListPath(normalizedPath) &&
    searchParams.has(TRAINED_TEACHERS_NEW_QUERY_KEY)
  const isScheduledFilter = statusFilter === 'scheduled'
  const isAdmin = user?.role === 'ADMIN'
  const showCalendarView = isAdmin

  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  const programIdFromUrl = useMemo(() => {
    const pid = searchParams.get('programId')?.trim()
    return pid || undefined
  }, [searchParams])

  const detailQuery = useTrainedTeacherProgramDetail(
    programIdFromUrl ?? selectedProgramForFullPageModal?.id,
    Boolean(programIdFromUrl ?? selectedProgramForFullPageModal?.id)
  )
  const prefetchTrainedTeacherProgramDetail = usePrefetchTrainedTeacherProgramDetail()

  const detailData = detailQuery.data ?? null
  const detailProgram =
    detailData ??
    (programIdFromUrl
      ? ({ id: programIdFromUrl } as Program)
      : selectedProgramForFullPageModal)

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
    if (!programIdFromUrl) return
    if (searchParams.has(TRAINED_TEACHERS_NEW_QUERY_KEY)) return
    if (detailQuery.data) {
      setSelectedProgramForFullPageModal(detailQuery.data)
      return
    }
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(item => item.id === programIdFromUrl)
    if (program) setSelectedProgramForFullPageModal(program)
  }, [detailQuery.data, filteredPrograms, programIdFromUrl, searchParams])

  useEffect(() => {
    if (!listQuery.isError || listQuery.isFetching) return
    showAlert({
      title: '목록 조회 실패',
      content: '교육받은 교사 프로그램 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [listQuery.isError, listQuery.isFetching, showAlert])

  useEffect(() => {
    if (!remoteEnabled || !programIdFromUrl) return
    if (!detailQuery.isError || detailQuery.isFetching) return
    showAlert({
      title: '상세 조회 실패',
      content: '프로그램 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [
    detailQuery.isError,
    detailQuery.isFetching,
    programIdFromUrl,
    remoteEnabled,
    showAlert,
  ])

  const userPreviewSyncParams = useMemo(
    () => ({ userPreview: searchParams.get('userPreview') ?? undefined }),
    [searchParams]
  )

  const setUserPreviewSyncParams = useCallback(
    (updates: { userPreview?: string }, options?: SetQueryParamsOptions) => {
      const next = new URLSearchParams(searchParams)
      if (updates.userPreview == null || updates.userPreview === '') {
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

  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  const handleCloseRegistrationFullpage = useCallback(() => {
    if (!isTrainedTeachersProgramListPath(normalizedPath)) return
    closeWritingUserPreview()
    const next = new URLSearchParams(searchParams)
    next.delete(TRAINED_TEACHERS_NEW_QUERY_KEY)
    next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
  }, [closeWritingUserPreview, normalizedPath, searchParams, setSearchParams])

  const handleRegistrationSaved = useCallback(() => {
    refetchPrograms()
    handleCloseRegistrationFullpage()
  }, [handleCloseRegistrationFullpage, refetchPrograms])

  const openNewRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      const next = new URLSearchParams(searchParams)
      next.set(TRAINED_TEACHERS_NEW_QUERY_KEY, '1')
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

  const handleProgramCreateClick = useCallback(() => {
    const draft = peekRegistrationDraftNotice(PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE)
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
        clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE)
        openNewRegistration('fresh')
        return
      }
      openNewRegistration('continue')
    },
    [openNewRegistration]
  )

  const handleView = useCallback(
    (program: Program) => {
      if (!user || !isAuthenticated) {
        const redirectPath = getProgramAdminDetailUrlFromPathname(program.id, location.pathname)
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)
        return
      }

      setSelectedProgramForFullPageModal(program)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('programId', program.id)
      if (!nextParams.get('lnb')) nextParams.set('lnb', 'info')
      if (!nextParams.get('tab')) nextParams.set('tab', 'info')
      setSearchParams(nextParams, { replace: false })
    },
    [isAuthenticated, location.pathname, navigate, searchParams, setSearchParams, user]
  )

  const handleViewModeToggle = useCallback(() => {
    const nextViewMode = viewMode === 'list' ? 'calendar' : 'list'
    setViewMode(nextViewMode)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('viewMode', nextViewMode)
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams, viewMode])

  const handleCloseFullPageModal = useCallback(() => {
    setSelectedProgramForFullPageModal(null)
    const nextParams = clearSponsorDetailQueryStack(new URLSearchParams(searchParams))
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
  }, [searchParams, setSearchParams])

  const handleBulkDeleteClick = useCallback(() => {
    const programsToDelete = filteredPrograms.filter(program => selectedRowKeys.includes(program.id))
    if (programsToDelete.length === 0) return
    setProgramsPendingBulkDelete(programsToDelete)
    setBulkDeleteModalOpen(true)
  }, [filteredPrograms, selectedRowKeys])

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (remoteEnabled) {
      try {
        await deleteProgramsMutation.mutateAsync(
          programsPendingBulkDelete.map(program => program.id)
        )
        setSelectedRowKeys([])
        refetchPrograms()
      } catch {
        showAlert({
          title: '삭제 실패',
          content: '선택한 프로그램 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
      setBulkDeleteModalOpen(false)
      setProgramsPendingBulkDelete([])
      return
    }
    handleBulkDelete(programsPendingBulkDelete, () => {
      setSelectedRowKeys([])
      refetchPrograms()
    })
    setBulkDeleteModalOpen(false)
    setProgramsPendingBulkDelete([])
  }, [
    deleteProgramsMutation,
    handleBulkDelete,
    programsPendingBulkDelete,
    refetchPrograms,
    remoteEnabled,
    showAlert,
  ])

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
        loading={listQuery.isFetching}
        headerTitle={headerTitle}
        onView={handleView}
        onPrefetch={program => prefetchTrainedTeacherProgramDetail(program.id)}
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

      <ProgramDetailFullPageModal
        open={Boolean(programIdFromUrl) || Boolean(selectedProgramForFullPageModal)}
        program={detailProgram}
        programVariant="trained-teachers"
        externalLoading={
          Boolean(programIdFromUrl) &&
          !detailData &&
          (detailQuery.isFetching || detailQuery.isLoading)
        }
        externalError={detailQuery.isError && !detailData}
        onClose={handleCloseFullPageModal}
        onUpdateProgram={
          remoteEnabled
            ? async (programId, program, patch) => {
                await updateMutation.mutateAsync({ programId, program, patch })
                refetchPrograms()
              }
            : undefined
        }
      />

      <GeneralProgramRegistrationFullpageModal
        open={isTrainedTeachersRegistrationOpen}
        onClose={handleCloseRegistrationFullpage}
        onProgramRegistrationSaved={handleRegistrationSaved}
        registrationFormVariant="trainedTeachers"
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
        onConfirm={() => {
          void handleBulkDeleteConfirm()
        }}
        onCancel={() => {
          setBulkDeleteModalOpen(false)
          setProgramsPendingBulkDelete([])
        }}
      />
    </div>
  )
}

export function TrainedTeachersProgramPage() {
  return (
    <TemplateWritingPreviewProvider>
      <TrainedTeachersProgramPageContent />
    </TemplateWritingPreviewProvider>
  )
}

export default TrainedTeachersProgramPage
