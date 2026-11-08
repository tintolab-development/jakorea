/**
 * 프로그램 관리 > 교육받은 교사 프로그램
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import { ProgramList } from '@/features/program/general/ui/program-list'
import {
  LazyGeneralProgramRegistrationFullpageModal,
  LazyProgramDetailFullPageModal,
  preloadGeneralProgramRegistrationModal,
  ProgramModalWhenOpen,
} from '@/pages/programs/lazy-program-modals'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  fetchRegistrationDraftNotice,
  PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import { assertRegistrationWizardRemoteReady } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import {
  clearGeneralProgramDetailQueryParams,
  patchGeneralProgramDetailLnbTab,
} from '@/features/program/general/lib/general-program-detail-route'
import { buildTrainedTeachersSearchParamsAfterRegistrationComplete } from '@/features/program/trained-teachers/lib/post-registration-search-params'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import { DeleteGuideModal, showDeleteCompletedAlert, FilterTableToolbarButton } from '@/shared/ui'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import {
  isProgramHardDeleteBlockedError,
  resolveProgramHardDeleteBlockedModalCopy,
  resolveProgramDeleteGuideModalCopy,
} from '@/features/program/shared/lib/program-delete-guide'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
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
  useTrainedTeacherProgramDetail,
  useUpdateTrainedTeacherProgram,
} from '@/features/program/trained-teachers/api/hooks'
import { useTrainedTeachersProgramListFilters } from '@/features/program/trained-teachers/hooks/use-list-filters'

import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
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
    listQueryFiltersKey,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    totalElements,
  } = useTrainedTeachersProgramListFilters()

  const infiniteResetKey = `${statusFilter ?? 'all'}:${listQueryFiltersKey}`
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteResetKey,
  })
  const updateMutation = useUpdateTrainedTeacherProgram()
  const deleteProgramsMutation = useDeleteTrainedTeacherPrograms()

  const [selectedProgramForFullPageModal, setSelectedProgramForFullPageModal] =
    useState<Program | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
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

  const isTrainedTeachersRegistrationOpen =
    isTrainedTeachersProgramListPath(normalizedPath) &&
    searchParams.has(TRAINED_TEACHERS_NEW_QUERY_KEY)
  const isScheduledFilter = statusFilter === 'scheduled'
  const showBulkSelection = statusFilter == null || isScheduledFilter
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
  const detailData = detailQuery.data ?? null
  const detailProgram =
    detailData ??
    (remoteEnabled
      ? null
      : programIdFromUrl
        ? ({ id: programIdFromUrl } as Program)
        : selectedProgramForFullPageModal)

  useEffect(() => {
    setSelectedRowKeys([])
  }, [statusFilter])

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
    // 목록 행은 rounds:[] 경량 — 상세 GET 전에 공통정보를 빈 일정처럼 덮지 않음
    if (detailQuery.isFetching || detailQuery.isLoading) return
    if (filteredPrograms.length === 0) return
    const program = filteredPrograms.find(item => item.id === programIdFromUrl)
    if (program) setSelectedProgramForFullPageModal(program)
  }, [
    detailQuery.data,
    detailQuery.isFetching,
    detailQuery.isLoading,
    filteredPrograms,
    programIdFromUrl,
    searchParams,
  ])

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
  }, [detailQuery.isError, detailQuery.isFetching, programIdFromUrl, remoteEnabled, showAlert])

  const userPreviewSyncParams = useMemo(
    () => ({ userPreview: searchParams.get('userPreview') ?? undefined }),
    [searchParams]
  )

  const setUserPreviewSyncParams = useCallback(
    (updates: { userPreview?: string }, options?: SetQueryParamsOptions) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (updates.userPreview == null || updates.userPreview === '') {
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

  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  const handleCloseRegistrationFullpage = useCallback(() => {
    if (!isTrainedTeachersProgramListPath(normalizedPath)) return
    closeWritingUserPreview()
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(TRAINED_TEACHERS_NEW_QUERY_KEY)
        next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
        next.delete('userPreview')
        return next
      },
      { replace: true }
    )
  }, [closeWritingUserPreview, normalizedPath, setSearchParams])

  const handleRegistrationSaved = useCallback(
    (createdProgram?: Program) => {
      void refetchPrograms()
      closeWritingUserPreview()
      const createdId = createdProgram?.id?.trim()
      if (createdId) {
        setSelectedProgramForFullPageModal(createdProgram ?? ({ id: createdId } as Program))
      }
      setSearchParams(
        prev => buildTrainedTeachersSearchParamsAfterRegistrationComplete(prev, createdProgram),
        { replace: true }
      )
    },
    [closeWritingUserPreview, refetchPrograms, setSearchParams]
  )

  const openNewRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      preloadGeneralProgramRegistrationModal()
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(TRAINED_TEACHERS_NEW_QUERY_KEY, '1')
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
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const handleProgramCreateClick = useCallback(() => {
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
      const draft = await fetchRegistrationDraftNotice(
        PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE
      )
      if (draft != null) {
        setDraftNoticeTitle(draft.title)
        setDraftNoticeOpen(true)
        return
      }
      openNewRegistration('fresh')
    })()
  }, [openNewRegistration, showAlert])

  const handleDraftNoticeConfirm = useCallback(
    (choice: RegistrationDraftNoticeChoice) => {
      setDraftNoticeOpen(false)
      if (choice === 'fresh') {
        // 기존 임시저장본은 유지 — 닫았다가 다시 진입해도 안내 팝업을 다시 노출
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
      setSearchParams(
        prev => {
          const next = patchGeneralProgramDetailLnbTab(prev, {
            programId: program.id,
            lnb: 'info',
            tab: 'info',
          })
          next.delete('subTab')
          return next
        },
        { replace: false }
      )
    },
    [isAuthenticated, location.pathname, navigate, setSearchParams, user]
  )

  const handleViewModeToggle = useCallback(() => {
    const nextViewMode = viewMode === 'list' ? 'calendar' : 'list'
    setViewMode(nextViewMode)
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('viewMode', nextViewMode)
        return nextParams
      },
      { replace: true }
    )
  }, [setSearchParams, viewMode])

  const handleCloseFullPageModal = useCallback(() => {
    setSelectedProgramForFullPageModal(null)
    setSearchParams(
      prev =>
        clearGeneralProgramDetailQueryParams(
          clearSponsorDetailQueryStack(new URLSearchParams(prev))
        ),
      { replace: true }
    )
  }, [setSearchParams])

  const handleBulkDeleteClick = useCallback(() => {
    const programsToDelete = filteredPrograms.filter(program =>
      selectedRowKeys.includes(program.id)
    )
    if (programsToDelete.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setProgramsPendingBulkDelete(programsToDelete)
    setBulkDeleteModalOpen(true)
  }, [filteredPrograms, selectedRowKeys, showAlert])

  const handleBulkDeleteConfirm = useCallback(async () => {
    const idsToDelete = programsPendingBulkDelete.map(program => program.id)
    if (programIdFromUrl && idsToDelete.includes(programIdFromUrl)) {
      handleCloseFullPageModal()
    }
    if (remoteEnabled) {
      try {
        await deleteProgramsMutation.mutateAsync(idsToDelete)
        setSelectedRowKeys([])
        refetchPrograms()
        setBulkDeleteModalOpen(false)
        setProgramsPendingBulkDelete([])
        showDeleteCompletedAlert()
        return
      } catch (error) {
        if (isProgramHardDeleteBlockedError(error)) {
          const count = programsPendingBulkDelete.length
          setProgramDeleteBlockedCopy(resolveProgramHardDeleteBlockedModalCopy(count))
          setProgramDeleteBlockedOpen(true)
        } else {
          showAlert({
            title: '삭제 실패',
            content: '선택한 프로그램 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
        }
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
    handleCloseFullPageModal,
    programIdFromUrl,
    programsPendingBulkDelete,
    refetchPrograms,
    remoteEnabled,
    showAlert,
  ])

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
        'program-list-page--overview',
        isScheduledFilter && 'program-list-page--scheduled-filters',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="program-progress-widget-container">
        <ProgramStatusWidget
          title={null}
          onBeforeStageChange={
            programIdFromUrl || selectedProgramForFullPageModal
              ? handleCloseFullPageModal
              : undefined
          }
        />
      </div>
      <ProgramList
        data={filteredPrograms}
        loading={
          listQuery.isFetching &&
          !listQuery.isFetchingNextPage &&
          (filteredPrograms.length === 0 || listQuery.isPlaceholderData)
        }
        headerTitle={headerTitle}
        headerCount={remoteEnabled ? totalElements : undefined}
        onView={handleView}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        disableUrlSync={Boolean(programIdFromUrl) || Boolean(selectedProgramForFullPageModal)}
        onSelectionChange={showBulkSelection ? setSelectedRowKeys : undefined}
        selectedRowKeys={showBulkSelection ? selectedRowKeys : undefined}
        showRowSelection={showBulkSelection}
        showCalendarView={showCalendarView}
        viewMode={viewMode}
        tableVariant="overview"
        config={programListConfig}
        onDisplayCountChange={handleDisplayCountChange}
        toolbarActionsAfterExcel={programListToolbarActionsAfterExcel}
      >
        {programListToolbarActions}
      </ProgramList>
      <div
        ref={loadMoreRef}
        className="program-list-page__load-more-sentinel"
        aria-hidden
        style={{ height: 1 }}
      />

      <ProgramModalWhenOpen
        open={Boolean(programIdFromUrl) && !searchParams.has(TRAINED_TEACHERS_NEW_QUERY_KEY)}
      >
        <LazyProgramDetailFullPageModal
          open={Boolean(programIdFromUrl) && !searchParams.has(TRAINED_TEACHERS_NEW_QUERY_KEY)}
          program={detailProgram}
          programVariant="trained-teachers"
          searchParams={searchParams}
          setSearchParams={setSearchParams}
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
          onRequestDelete={program => {
            setProgramsPendingBulkDelete([program])
            setBulkDeleteModalOpen(true)
          }}
        />
      </ProgramModalWhenOpen>

      <ProgramModalWhenOpen open={isTrainedTeachersRegistrationOpen} registrationEntry>
        <LazyGeneralProgramRegistrationFullpageModal
          open={isTrainedTeachersRegistrationOpen}
          onClose={handleCloseRegistrationFullpage}
          onProgramRegistrationSaved={handleRegistrationSaved}
          registrationFormVariant="trainedTeachers"
        />
      </ProgramModalWhenOpen>

      <RegistrationDraftNoticeModal
        open={draftNoticeOpen}
        draftTitle={draftNoticeTitle}
        onConfirm={handleDraftNoticeConfirm}
        onCancel={() => setDraftNoticeOpen(false)}
      />

      <DeleteGuideModal
        open={bulkDeleteModalOpen}
        title={programBulkDeleteGuide.title}
        lines={programBulkDeleteGuide.lines}
        confirmText="삭제"
        onConfirm={() => {
          void handleBulkDeleteConfirm()
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

export function TrainedTeachersProgramPage() {
  return (
    <TemplateWritingPreviewProvider>
      <TrainedTeachersProgramPageContent />
    </TemplateWritingPreviewProvider>
  )
}

export default TrainedTeachersProgramPage
