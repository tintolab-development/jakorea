/**
 * 프로그램 관리 > 일반 프로그램 목록
 * 레이아웃·공통 컴포넌트: program-list-page.tsx / ProgramList (overview 모드) 패턴
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { isHistoryTraversalPending } from '@/shared/lib/history-ancestor-navigation'
import { ProgramList } from '@/features/program/general/ui/program-list'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ProgramStatusWidget } from '@/features/dashboard/ui/program-status-widget'
import {
  LazyGeneralProgramDetailFullPageModal,
  LazyGeneralProgramRegistrationFullpageModal,
  preloadGeneralProgramRegistrationModal,
  ProgramModalWhenOpen,
} from '@/pages/programs/lazy-program-modals'
import { useDeleteGeneralPrograms } from '@/features/program/general/hooks/use-delete-general-program'
import { GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/general/model/registration-flow'
import {
  isGeneralProgramId,
  resolveGeneralProgramForDetail,
} from '@/features/program/general/lib/detail-meta'
import { resolveGeneralProgramListTitle } from '@/features/program/general/lib/detail-common-info-display'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { resolveProgramListDetailEntry } from '@/features/program/general/lib/resolve-program-list-detail-entry'
import type { Program } from '@/types/domain'
import { DeleteGuideModal, showDeleteCompletedAlert, FilterTableToolbarButton } from '@/shared/ui'
import {
  isProgramHardDeleteBlockedError,
  resolveProgramDeleteGuideModalCopyWithNames,
  resolveProgramHardDeleteBlockedModalCopy,
} from '@/features/program/shared/lib/program-delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { useProgramListActions } from '@/pages/programs/use-program-list-actions'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useGeneralProgramListFilters } from './use-general-program-list-filters'
import { clearSponsorDetailQueryStack } from '@/features/sponsor/lib/sponsor-detail-query-stack'
import { clearGeneralProgramDetailQueryParams } from '@/features/program/general/lib/general-program-detail-route'
import { buildProgramListSearchParamsAfterRegistrationComplete } from '@/features/program/shared/lib/post-registration-search-params'
import {
  fetchRegistrationDraftNotice,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import { assertRegistrationWizardRemoteReady } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import { useCmsAlert } from '@/shared/ui'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'

import { ButtonCalendarIcon, ButtonListIcon } from '@/shared/ui/icons/ButtonIcons'
import './general-program-list-page.css'
import { ensureProgramWriteAllowed } from '@/features/program/shared/lib/program-role-action-check'

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
    totalElements,
    headerTitle,
    programListConfig,
    statusFilter,
    refetchPrograms,
    loading: listLoading,
    isPlaceholderData: isListPlaceholderData,
    isRemoteDataSource,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    listQueryFiltersKey,
  } = useGeneralProgramListFilters()

  const viewModeFromUrl = searchParams.get('viewMode') as 'list' | 'calendar' | null
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    viewModeFromUrl === 'list' || viewModeFromUrl === 'calendar' ? viewModeFromUrl : 'list'
  )

  useEffect(() => {
    const urlViewMode = searchParams.get('viewMode') as 'list' | 'calendar' | null
    if (urlViewMode === 'list' || urlViewMode === 'calendar') {
      setViewMode(urlViewMode)
    }
  }, [searchParams])

  const isListView = viewMode === 'list'
  const infiniteResetKey = `${statusFilter ?? 'all'}:${listQueryFiltersKey}`
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage: isListView && hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteResetKey,
  })

  const deleteGeneralProgramsMutation = useDeleteGeneralPrograms()

  const { handleBulkDelete } = useProgramListActions()

  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()

  const [selectedProgramForDetail, setSelectedProgramForDetail] = useState<Program | null>(null)
  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')

  const openNewRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      preloadGeneralProgramRegistrationModal()
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(PROGRAMS_GENERAL_NEW_QUERY_KEY, '1')
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
      closeWritingUserPreview()
      const createdId = createdProgram?.id?.trim()
      if (createdId) {
        setSelectedProgramForDetail(createdProgram ?? ({ id: createdId } as Program))
      }
      setSearchParams(
        prev => buildProgramListSearchParamsAfterRegistrationComplete(prev, createdId),
        { replace: true }
      )
    },
    [closeWritingUserPreview, refetchPrograms, setSearchParams]
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
  /** 캘린더 우측 목록에서 체크한 프로그램 id — 캘린더 뷰의 선택 삭제 대상 */
  const [calendarSelectedProgramIds, setCalendarSelectedProgramIds] = useState<React.Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  /**
   * 삭제 대기 프로그램 id. 캘린더 선택은 목록에 아직 로드되지 않은 프로그램일 수 있어
   * Program 행이 아니라 id로 들고 있는다.
   */
  const [programIdsPendingBulkDelete, setProgramIdsPendingBulkDelete] = useState<string[]>([])
  /** 삭제 안내 문구용 프로그램명(시안: 단건 `[이름]` / 일괄 `[첫 이름] 외 N개`) */
  const [programNamesPendingBulkDelete, setProgramNamesPendingBulkDelete] = useState<string[]>([])
  const programBulkDeleteGuide = useMemo(
    () =>
      resolveProgramDeleteGuideModalCopyWithNames(
        programIdsPendingBulkDelete.length,
        programNamesPendingBulkDelete
      ),
    [programIdsPendingBulkDelete.length, programNamesPendingBulkDelete]
  )
  const clearProgramSelections = useCallback(() => {
    setSelectedRowKeys([])
    setCalendarSelectedProgramIds([])
  }, [])
  const [programDeleteBlockedOpen, setProgramDeleteBlockedOpen] = useState(false)
  const [programDeleteBlockedCopy, setProgramDeleteBlockedCopy] = useState({
    title: '',
    description: '',
  })

  const isScheduledFilter = statusFilter === 'scheduled'
  const showBulkSelection = statusFilter == null || isScheduledFilter
  const [, setHasListFilters] = useState(false)
  const handleDisplayCountChange = useCallback((_count: number, hasActiveFilters: boolean) => {
    setHasListFilters(hasActiveFilters)
  }, [])

  useEffect(() => {
    clearProgramSelections()
  }, [statusFilter, clearProgramSelections])

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
      filteredPrograms.find(p => p.id === pid) ?? resolveGeneralProgramForDetail(pid) ?? null
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

  const handleCloseFullPageModal = useCallback(() => {
    setSelectedProgramForDetail(null)
    // 모달이 지나온 엔트리로 뒤로 이동 중이면 URL을 쓰지 않는다 — traversal 완료 전이라
    // 지금 쓰면(replace) 출발 엔트리(상세)가 목록 URL로 덮어써져 앞으로가기로 상세가 돌아오지 않는다.
    if (isHistoryTraversalPending()) return
    // 이미 다른 페이지로 이동했는데(지연 로딩 동안 이전 화면이 남아 있는 상태) 이 콜백이 불리면
    // 그 페이지 주소를 덮어쓰지 않는다 — 예: 후원사 링크 직후 남아 있던 프로그램 상세의 X
    if (window.location.pathname !== location.pathname) return
    // 모달 open 중에는 목록 필터 UI가 가려져 pending 변경이 없다.
    // applySearch를 함께 호출하면 RR setSearchParams 클로저가 programId를
    // 다시 실어 모달이 안 닫히는 레이스가 난다 — 상세 쿼리만 제거한다.
    setSearchParams(
      prev =>
        clearGeneralProgramDetailQueryParams(
          clearSponsorDetailQueryStack(new URLSearchParams(prev))
        ),
      { replace: true }
    )
  }, [location.pathname, setSearchParams])

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

  const { showAlert } = useCmsAlert()

  const handleBulkDeleteClick = () => {
    // 캘린더 뷰는 우측 목록 체크, 리스트 뷰는 테이블 행 선택을 삭제 대상으로 쓴다.
    const idsToDelete =
      viewMode === 'calendar'
        ? [...new Set(calendarSelectedProgramIds.map(String))]
        : filteredPrograms.filter(p => selectedRowKeys.includes(p.id)).map(p => p.id)
    if (idsToDelete.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    void (async () => {
      // 권한 설정 V1.2: 프로그램 삭제는 담당 프로그램의 Program Owner·Program Assistant만. 확인 모달 전에 막는다.
      if (!(await ensureProgramWriteAllowed(idsToDelete))) return
      setProgramIdsPendingBulkDelete(idsToDelete)
      setProgramNamesPendingBulkDelete(
        idsToDelete.flatMap(id => {
          const program = filteredPrograms.find(p => p.id === id)
          return program ? [resolveGeneralProgramListTitle(program)] : []
        })
      )
      setBulkDeleteModalOpen(true)
    })()
  }

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
      const draft = await fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE)
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
        const entry = resolveProgramListDetailEntry(program, {
          statusFilter,
          detailSurface: 'general',
        })
        nextParams.set('lnb', entry.lnb)
        nextParams.set('tab', entry.tab)
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
        'general-program-list-page',
        isScheduledFilter && 'program-list-page--scheduled-filters',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="program-progress-widget-container">
        <ProgramStatusWidget
          title={null}
          onBeforeStageChange={generalDetailModalOpen ? handleCloseFullPageModal : undefined}
        />
      </div>
      <ProgramList
        data={filteredPrograms}
        loading={listLoading && (filteredPrograms.length === 0 || isListPlaceholderData)}
        headerTitle={headerTitle}
        headerCount={isRemoteDataSource ? totalElements : undefined}
        onView={handleView}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        disableUrlSync={generalDetailModalOpen}
        onSelectionChange={showBulkSelection ? setSelectedRowKeys : undefined}
        selectedRowKeys={showBulkSelection ? selectedRowKeys : undefined}
        calendarSelectedProgramIds={showBulkSelection ? calendarSelectedProgramIds : undefined}
        onCalendarSelectionChange={showBulkSelection ? setCalendarSelectedProgramIds : undefined}
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
      {isRemoteDataSource && isListView ? (
        <div
          ref={loadMoreRef}
          className="program-list-page__load-more-sentinel"
          aria-hidden
          style={{ height: 1 }}
        />
      ) : null}

      <ProgramModalWhenOpen open={generalDetailModalOpen}>
        <LazyGeneralProgramDetailFullPageModal
          open={generalDetailModalOpen}
          program={generalDetailProgram}
          programIdHint={programIdFromUrl}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          onClose={handleCloseFullPageModal}
          onRequestDelete={program => {
            setProgramIdsPendingBulkDelete([program.id])
            setProgramNamesPendingBulkDelete([resolveGeneralProgramListTitle(program)])
            setBulkDeleteModalOpen(true)
          }}
        />
      </ProgramModalWhenOpen>

      <ProgramModalWhenOpen open={isGeneralProgramNewRegistrationQuery} registrationEntry>
        <LazyGeneralProgramRegistrationFullpageModal
          open={isGeneralProgramNewRegistrationQuery}
          onClose={handleCloseGeneralProgramRegistrationFullpage}
          onProgramRegistrationSaved={handleGeneralProgramRegistrationSaved}
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
          void (async () => {
            try {
              const idsToDelete = programIdsPendingBulkDelete
              // 상세가 열려 있으면 먼저 닫아 detail observer를 끈 뒤 삭제한다.
              if (programIdFromUrl && idsToDelete.includes(programIdFromUrl)) {
                handleCloseFullPageModal()
              }
              if (isRemoteDataSource) {
                await deleteGeneralProgramsMutation.mutateAsync(idsToDelete)
                refetchPrograms()
                clearProgramSelections()
                setBulkDeleteModalOpen(false)
                setProgramIdsPendingBulkDelete([])
                showDeleteCompletedAlert()
              } else {
                const programsToDelete = filteredPrograms.filter(p => idsToDelete.includes(p.id))
                await handleBulkDelete(programsToDelete, clearProgramSelections)
                clearProgramSelections()
                setBulkDeleteModalOpen(false)
                setProgramIdsPendingBulkDelete([])
              }
            } catch (error) {
              if (isProgramHardDeleteBlockedError(error)) {
                const count = programIdsPendingBulkDelete.length
                setProgramDeleteBlockedCopy(resolveProgramHardDeleteBlockedModalCopy(count))
                setBulkDeleteModalOpen(false)
                setProgramIdsPendingBulkDelete([])
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
          setProgramIdsPendingBulkDelete([])
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

export function GeneralProgramListPage() {
  return (
    <TemplateWritingPreviewProvider>
      <GeneralProgramListPageContent />
    </TemplateWritingPreviewProvider>
  )
}

export default GeneralProgramListPage
