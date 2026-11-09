/**
 * UJAT 프로그램 목록 페이지
 * 레이아웃·공통 컴포넌트는 `program-list-page.tsx` / `ProgramList` 와 동일하게 FilterTableLayout + cms-data-table 사용
 */

import { useCallback, useEffect, useMemo, useState, type Key, type MouseEvent } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_INST_APP_ID_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  isResolvableUjatProgramId,
  resolveUjatProgramForDetail,
} from '@/features/program/ujat/lib/ujat-program-detail-meta'
import {
  formatUjatDispatchedSchoolCount,
  formatUjatVolunteerHalfRecruitment,
  resolveUjatProgramDisplayTitle,
} from '@/features/program/ujat/lib/ujat-program-list-display'
import {
  fetchRegistrationDraftNotice,
  PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import { assertRegistrationWizardRemoteReady } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import { buildProgramListSearchParamsAfterRegistrationComplete } from '@/features/program/shared/lib/post-registration-search-params'
import {
  RegistrationDraftNoticeModal,
  type RegistrationDraftNoticeChoice,
} from '@/features/program/shared/ui/registration/draft-notice-modal'
import {
  useBulkDeleteUjatPrograms,
  useDeleteProgram,
  useProgramDetail,
  usePrograms,
  useUjatBusinessYears,
  useUpdateProgram,
} from '@/features/program/ujat/api/queries'
import {
  buildProgramSingleDeleteGuideLines,
  isProgramHardDeleteBlockedError,
  PROGRAM_DELETE_GUIDE_TITLE,
  resolveProgramDeleteGuideModalCopy,
  resolveProgramHardDeleteBlockedModalCopy,
} from '@/features/program/shared/lib/program-delete-guide'
import { DeleteBlockedGuideModal } from '@/shared/ui/delete-blocked-guide-modal'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  buildUjatProgressYearFieldOptions,
  UJAT_PROGRESS_YEAR_ALL,
  type UjatProgressYearFilter,
} from '@/features/program/ujat/lib/progress-year-options'
import {
  UJAT_PROGRAM_LIST_PROGRESS_LABELS,
  UJAT_PROGRAM_LIST_PROGRESS_ORDER,
  resolveUjatProgramListProgressStatus,
} from '@/features/program/ujat/lib/ujat-program-list-progress'
import { shouldUseRemoteApi } from '@/features/program/ujat/api/capabilities'
import { getHttpStatus } from '@/features/program/ujat/api/errors'
import type { Program, UjatProgramProgressStatus } from '@/types/domain'
import {
  FilterTableLayout,
  DeleteGuideModal,
  showDeleteCompletedAlert,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/ujat/model/ujat-program-registration-flow'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { UjatProgramListProgressCell } from '@/features/program/ujat/ui/list/ujat-program-list-progress-cell'
import {
  LazyUjatProgramDetailFullPageModal,
  LazyUjatProgramRegistrationFullpageModal,
  preloadUjatProgramRegistrationModal,
  ProgramModalWhenOpen,
} from '@/pages/programs/lazy-program-modals'

import '@/pages/programs/program-list-page.css'
import './ujat-program-list-page.css'
import { ensureProgramWriteAllowed } from '@/features/program/shared/lib/program-role-action-check'

/** `/programs/ujat?new` — 5단계 UJAT 등록 플로우 풀페이지. `userPreview`는 상단「미리보기」시 `TemplatePreviewModal` 동기화용. */
const PROGRAMS_UJAT_NEW_QUERY_KEY = 'new'
const UJAT_PROGRESS_STATUS_ALL = '__all__' as const
type UjatProgressStatusFilter = UjatProgramProgressStatus | typeof UJAT_PROGRESS_STATUS_ALL

const UJAT_PROGRESS_STATUS_FILTER_OPTIONS = [
  { label: '전체', value: UJAT_PROGRESS_STATUS_ALL },
  ...UJAT_PROGRAM_LIST_PROGRESS_ORDER.map(status => ({
    label: UJAT_PROGRAM_LIST_PROGRESS_LABELS[status],
    value: status,
  })),
]

function readUjatProgressStatusFilter(raw: string | null): UjatProgressStatusFilter {
  if (!raw) return UJAT_PROGRESS_STATUS_ALL
  return (UJAT_PROGRAM_LIST_PROGRESS_ORDER as readonly string[]).includes(raw)
    ? (raw as UjatProgramProgressStatus)
    : UJAT_PROGRESS_STATUS_ALL
}

/** `/programs/ujat` 및 하위 경로(라우터 `ujat/*`) — 교육 지역 관리 제외 */
function isUjatProgramListPath(pathnameNormalized: string): boolean {
  if (
    pathnameNormalized === '/programs/ujat/regions' ||
    pathnameNormalized.startsWith('/programs/ujat/regions/')
  ) {
    return false
  }
  return pathnameNormalized === '/programs/ujat' || pathnameNormalized.startsWith('/programs/ujat/')
}

function readUjatProgressYearFilter(raw: string | null): UjatProgressYearFilter {
  if (!raw) return UJAT_PROGRESS_YEAR_ALL
  const year = Number(raw)
  return Number.isInteger(year) ? year : UJAT_PROGRESS_YEAR_ALL
}

function clearUjatDetailQueryParams(next: URLSearchParams): URLSearchParams {
  next.delete('programId')
  next.delete('lnb')
  next.delete('tab')
  next.delete('edit')
  next.delete(UJAT_INST_APP_ID_PARAM)
  next.delete(UJAT_APPLICANT_ID_PARAM)
  next.delete(UJAT_EDU_INST_ID_PARAM)
  next.delete(UJAT_EDU_INST_TAB_PARAM)
  next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
  return next
}

function readErrorResponseMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object' || !('message' in data)) return undefined
  const message = (data as { message?: unknown }).message
  return typeof message === 'string' ? message : undefined
}

function UjatProgramListPageContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert } = useCmsAlert()
  const pNorm = location.pathname.replace(/\/$/, '') || '/'

  const isUjatProgramNewRegistrationQuery =
    isUjatProgramListPath(pNorm) && searchParams.has(PROGRAMS_UJAT_NEW_QUERY_KEY)

  const ujatRemoteEnabled = shouldUseRemoteApi()
  const [pendingFilters, setPendingFilters] = useState<{
    keyword: string
    progressYear: UjatProgressYearFilter
    ujatProgressStatus: UjatProgressStatusFilter
  }>(() => ({
    keyword: searchParams.get('keyword') ?? '',
    progressYear: readUjatProgressYearFilter(searchParams.get('progressYear')),
    ujatProgressStatus: readUjatProgressStatusFilter(searchParams.get('ujatProgressStatus')),
  }))
  const [appliedKeyword, setAppliedKeyword] = useState(() => searchParams.get('keyword') ?? '')
  const [appliedYear, setAppliedYear] = useState<UjatProgressYearFilter>(() =>
    readUjatProgressYearFilter(searchParams.get('progressYear'))
  )
  const [appliedUjatProgressStatus, setAppliedUjatProgressStatus] =
    useState<UjatProgressStatusFilter>(() =>
      readUjatProgressStatusFilter(searchParams.get('ujatProgressStatus'))
    )

  const listParams = useMemo(
    () => ({
      keyword: appliedKeyword.trim() || undefined,
      businessYear: appliedYear === UJAT_PROGRESS_YEAR_ALL ? undefined : appliedYear,
      ujatProgressStatus:
        appliedUjatProgressStatus === UJAT_PROGRESS_STATUS_ALL
          ? undefined
          : appliedUjatProgressStatus,
    }),
    [appliedKeyword, appliedYear, appliedUjatProgressStatus]
  )
  const programsQuery = usePrograms(listParams)
  const businessYearsQuery = useUjatBusinessYears()
  const updateProgramMutation = useUpdateProgram()
  const deleteProgramMutation = useDeleteProgram()
  const bulkDeleteProgramsMutation = useBulkDeleteUjatPrograms()
  const programs = useMemo(
    () => programsQuery.data?.pages.flatMap(page => page.programs) ?? [],
    [programsQuery.data]
  )
  const loading = programsQuery.isFetching && !programsQuery.isFetchingNextPage
  const infiniteResetKey = `${appliedKeyword}:${String(appliedYear)}:${appliedUjatProgressStatus}`
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage: programsQuery.hasNextPage ?? false,
    isFetchingNextPage: programsQuery.isFetchingNextPage,
    fetchNextPage: programsQuery.fetchNextPage,
    resetKey: infiniteResetKey,
  })

  const totalElements = programsQuery.data?.pages[0]?.totalElements ?? programs.length

  useEffect(() => {
    const nextKeyword = searchParams.get('keyword') ?? ''
    const nextYear = readUjatProgressYearFilter(searchParams.get('progressYear'))
    const nextStatus = readUjatProgressStatusFilter(searchParams.get('ujatProgressStatus'))

    setPendingFilters(prev => {
      if (
        prev.keyword === nextKeyword &&
        prev.progressYear === nextYear &&
        prev.ujatProgressStatus === nextStatus
      ) {
        return prev
      }
      return { keyword: nextKeyword, progressYear: nextYear, ujatProgressStatus: nextStatus }
    })
    setAppliedKeyword(prev => (prev === nextKeyword ? prev : nextKeyword))
    setAppliedYear(prev => (prev === nextYear ? prev : nextYear))
    setAppliedUjatProgressStatus(prev => (prev === nextStatus ? prev : nextStatus))
  }, [searchParams])

  useEffect(() => {
    if (!programsQuery.isError || programsQuery.isFetching) return
    showAlert({
      title: '목록 조회 실패',
      content: 'UJAT 프로그램 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }, [programsQuery.isError, programsQuery.isFetching, showAlert])

  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()

  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [draftNoticeTitle, setDraftNoticeTitle] = useState('')

  const handleCloseUjatProgramRegistrationFullpage = useCallback(() => {
    if (!isUjatProgramListPath(pNorm)) return
    closeWritingUserPreview()
    const next = new URLSearchParams(searchParams)
    next.delete(PROGRAMS_UJAT_NEW_QUERY_KEY)
    next.delete(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
  }, [closeWritingUserPreview, pNorm, searchParams, setSearchParams])

  const handleUjatProgramRegistrationSaved = useCallback(
    (program: Program) => {
      // 목록 갱신은 등록 mutation onSuccess의 무효화가 맡는다 — 여기서 refetch하면 요청을 취소하고 전 페이지를 다시 받는다.
      closeWritingUserPreview()
      setSearchParams(
        prev => buildProgramListSearchParamsAfterRegistrationComplete(prev, program.id),
        { replace: true }
      )
    },
    [closeWritingUserPreview, programsQuery, setSearchParams]
  )

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

  const programIdFromUrl = searchParams.get('programId')
  const ujatDetailModalOpen =
    Boolean(programIdFromUrl) && !searchParams.has(PROGRAMS_UJAT_NEW_QUERY_KEY)
  const initialDetailProgram = useMemo(() => {
    if (!programIdFromUrl) return undefined
    return (
      programs.find(p => p.id === programIdFromUrl) ?? resolveUjatProgramForDetail(programIdFromUrl)
    )
  }, [programIdFromUrl, programs])
  const detailQuery = useProgramDetail(programIdFromUrl ?? undefined, initialDetailProgram)
  // remote: 상세 data만. local: mock/시드 허용
  const ujatDetailProgram = detailQuery.data ?? null

  useEffect(() => {
    if (!programIdFromUrl) return
    if (isResolvableUjatProgramId(programIdFromUrl)) return
    if (loading || detailQuery.isFetching) return
    if (detailQuery.isError && getHttpStatus(detailQuery.error) !== 404) return
    if (ujatDetailProgram) return
    if (programs.some(p => p.id === programIdFromUrl)) return
    setSearchParams(clearUjatDetailQueryParams(new URLSearchParams(searchParams)), {
      replace: true,
    })
  }, [
    programIdFromUrl,
    loading,
    detailQuery.isFetching,
    detailQuery.isError,
    detailQuery.error,
    ujatDetailProgram,
    programs,
    searchParams,
    setSearchParams,
  ])

  const [programPendingDelete, setProgramPendingDelete] = useState<Program | null>(null)
  const [programDeleteBlockedOpen, setProgramDeleteBlockedOpen] = useState(false)
  const [programDeleteBlockedCopy, setProgramDeleteBlockedCopy] = useState({
    title: '',
    description: '',
  })

  const handleConfirmDelete = useCallback(async () => {
    if (!programPendingDelete) return
    const targetId = programPendingDelete.id
    try {
      await deleteProgramMutation.mutateAsync(targetId)
      setProgramPendingDelete(null)
      setSearchParams(prev => clearUjatDetailQueryParams(new URLSearchParams(prev)), {
        replace: true,
      })
      // 목록 갱신은 삭제 mutation onSuccess의 무효화가 맡는다.
      showDeleteCompletedAlert()
    } catch (error) {
      setProgramPendingDelete(null)
      if (getHttpStatus(error) === 409 || isProgramHardDeleteBlockedError(error)) {
        setProgramDeleteBlockedCopy(
          resolveProgramHardDeleteBlockedModalCopy(1, readErrorResponseMessage(error))
        )
        setProgramDeleteBlockedOpen(true)
        return
      }
      showAlert({
        title: '삭제 실패',
        content: '선택한 프로그램을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
    }
  }, [deleteProgramMutation, programPendingDelete, programsQuery, setSearchParams, showAlert])

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const bulkDeleteGuide = useMemo(
    () => resolveProgramDeleteGuideModalCopy(selectedRowKeys.length),
    [selectedRowKeys.length]
  )

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    void (async () => {
      // 권한 설정 V1.2: 프로그램 삭제는 담당 프로그램의 Program Owner·Program Assistant만. 확인 모달 전에 막는다.
      if (!(await ensureProgramWriteAllowed(selectedRowKeys.map(key => String(key))))) return
      setBulkDeleteModalOpen(true)
    })()
  }, [selectedRowKeys, showAlert])

  const handleConfirmBulkDelete = useCallback(async () => {
    const idsToDelete = selectedRowKeys.map(key => String(key))
    try {
      if (programIdFromUrl && idsToDelete.includes(programIdFromUrl)) {
        setSearchParams(prev => clearUjatDetailQueryParams(new URLSearchParams(prev)), {
          replace: true,
        })
      }
      await bulkDeleteProgramsMutation.mutateAsync(idsToDelete)
      setSelectedRowKeys([])
      setBulkDeleteModalOpen(false)
      // 목록 갱신은 삭제 mutation onSuccess의 무효화가 맡는다.
      showDeleteCompletedAlert()
    } catch (error) {
      setBulkDeleteModalOpen(false)
      if (isProgramHardDeleteBlockedError(error)) {
        setProgramDeleteBlockedCopy(
          resolveProgramHardDeleteBlockedModalCopy(selectedRowKeys.length)
        )
        setProgramDeleteBlockedOpen(true)
        return
      }
      showAlert({
        title: '삭제 실패',
        content: '선택한 프로그램을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
    }
  }, [
    bulkDeleteProgramsMutation,
    programIdFromUrl,
    programsQuery,
    selectedRowKeys,
    setSearchParams,
    showAlert,
  ])

  const ujatPrograms = programs

  const progressYearFieldOptions = useMemo(
    () => buildUjatProgressYearFieldOptions(businessYearsQuery.data ?? []),
    [businessYearsQuery.data]
  )

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: 'keyword',
        type: 'search',
        label: '프로그램명',
        placeholder: '프로그램명을 입력해 주세요',
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'progressYear',
        type: 'select',
        label: '진행년도',
        options: progressYearFieldOptions,
        placeholder: '진행년도',
        allowClear: false,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
      {
        key: 'ujatProgressStatus',
        type: 'select',
        label: '프로그램 진행 현황',
        options: UJAT_PROGRESS_STATUS_FILTER_OPTIONS,
        placeholder: '전체',
        allowClear: false,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
    ],
    [progressYearFieldOptions]
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key === 'keyword') {
      setPendingFilters(prev => ({ ...prev, keyword: String(value ?? '') }))
      return
    }
    if (key === 'ujatProgressStatus') {
      setPendingFilters(prev => ({
        ...prev,
        ujatProgressStatus: readUjatProgressStatusFilter(String(value ?? '')),
      }))
      return
    }
    if (key !== 'progressYear') return
    if (value === UJAT_PROGRESS_YEAR_ALL) {
      setPendingFilters(prev => ({ ...prev, progressYear: UJAT_PROGRESS_YEAR_ALL }))
      return
    }
    const nextYear = Number(value)
    setPendingFilters(prev => ({
      ...prev,
      progressYear: Number.isFinite(nextYear) ? nextYear : UJAT_PROGRESS_YEAR_ALL,
    }))
  }, [])

  const handleSearch = useCallback(() => {
    const keyword = pendingFilters.keyword.trim()
    setAppliedKeyword(keyword)
    setAppliedYear(pendingFilters.progressYear)
    setAppliedUjatProgressStatus(pendingFilters.ujatProgressStatus)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (keyword) next.set('keyword', keyword)
        else next.delete('keyword')
        if (pendingFilters.progressYear === UJAT_PROGRESS_YEAR_ALL) {
          next.delete('progressYear')
        } else {
          next.set('progressYear', String(pendingFilters.progressYear))
        }
        if (pendingFilters.ujatProgressStatus === UJAT_PROGRESS_STATUS_ALL) {
          next.delete('ujatProgressStatus')
        } else {
          next.set('ujatProgressStatus', pendingFilters.ujatProgressStatus)
        }
        return next
      },
      { replace: true }
    )
  }, [
    pendingFilters.keyword,
    pendingFilters.progressYear,
    pendingFilters.ujatProgressStatus,
    setSearchParams,
  ])

  const filteredRows = useMemo(() => {
    const sorted = [...ujatPrograms].sort(
      (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf()
    )
    // remote: API `keyword`/`businessYear`가 이미 반영됨 — 클라이언트 재필터 금지
    if (ujatRemoteEnabled) return sorted
    return sorted.filter(program => {
      const matchesKeyword = appliedKeyword
        ? resolveUjatProgramDisplayTitle(program)
            .toLocaleLowerCase()
            .includes(appliedKeyword.toLocaleLowerCase())
        : true
      const matchesYear =
        appliedYear === UJAT_PROGRESS_YEAR_ALL || dayjs(program.startDate).year() === appliedYear
      const matchesStatus =
        appliedUjatProgressStatus === UJAT_PROGRESS_STATUS_ALL ||
        resolveUjatProgramListProgressStatus(program) === appliedUjatProgressStatus
      return matchesKeyword && matchesYear && matchesStatus
    })
  }, [ujatPrograms, appliedKeyword, appliedYear, appliedUjatProgressStatus, ujatRemoteEnabled])

  const columns = useMemo<ColumnsType<Program>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 80,
        align: 'center',
        render: (_value, _record, index) => filteredRows.length - index,
      },
      {
        title: '진행년도',
        key: 'progressYear',
        width: 110,
        align: 'center',
        render: (_value, record) => `${dayjs(record.startDate).year()}년`,
      },
      {
        title: '프로그램명',
        key: 'title',
        ellipsis: true,
        align: 'center',
        render: (_value, record) => resolveUjatProgramDisplayTitle(record),
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycleProgress',
        width: 200,
        align: 'center',
        render: (_value, record) => <UjatProgramListProgressCell program={record} />,
      },
      {
        title: '최종 파견 학교 수',
        key: 'dispatchedSchools',
        width: 180,
        align: 'center',
        render: (_value, record) => formatUjatDispatchedSchoolCount(record),
      },
      {
        title: '상반기 봉사자 모집 인원',
        key: 'volunteerFirstHalf',
        width: 200,
        align: 'center',
        render: (_value, record) => formatUjatVolunteerHalfRecruitment(record, 'h1'),
      },
      {
        title: '하반기 봉사자 모집 인원',
        key: 'volunteerSecondHalf',
        width: 200,
        align: 'center',
        render: (_value, record) => formatUjatVolunteerHalfRecruitment(record, 'h2'),
      },
    ],
    [filteredRows]
  )

  const openNewRegistration = useCallback(
    (mode?: 'continue' | 'fresh') => {
      preloadUjatProgramRegistrationModal()
      const draftMode =
        mode === 'continue'
          ? REGISTRATION_DRAFT_MODE_CONTINUE
          : mode === 'fresh'
            ? REGISTRATION_DRAFT_MODE_FRESH
            : null
      const search = draftMode
        ? `?new=1&${REGISTRATION_DRAFT_MODE_QUERY_KEY}=${draftMode}`
        : '?new=1'
      navigate({ pathname: '/programs/ujat', search })
    },
    [navigate]
  )

  const handleProgramCreateClick = useCallback(() => {
    preloadUjatProgramRegistrationModal()
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
      const draft = await fetchRegistrationDraftNotice(PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE)
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

  const handleRowNavigate = useCallback(
    (program: Program) => {
      const target = getProgramAdminDetailUrlFromPathname(program.id, location.pathname)
      const [targetPath, targetQuery = ''] = target.split('?')
      // 같은 목록 화면에서 상세를 열 때는 검색·진행년도·상태 필터를 유지한다.
      // 상세 URL만 새로 만들면 필터가 지워져 목록이 필터 없이 한 번 더 조회되고, 닫은 뒤에도 필터가 사라진다.
      if (targetPath !== location.pathname) {
        navigate(target)
        return
      }
      const next = clearUjatDetailQueryParams(new URLSearchParams(location.search))
      new URLSearchParams(targetQuery).forEach((value, key) => next.set(key, value))
      navigate(`${targetPath}?${next.toString()}`)
    },
    [navigate, location.pathname, location.search]
  )

  const toolbarActionsAfterExcel = (
    <FilterTableToolbarButton onClick={handleProgramCreateClick}>
      신규 등록
    </FilterTableToolbarButton>
  )

  return (
    <div className="program-list-page ujat-program-list-page">
      <FilterTableLayout
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        bordered={false}
        title="전체 프로그램"
        description={`총 ${totalElements.toLocaleString()}건`}
        actions={
          <FilterTableToolbarButton variant="delete" onClick={handleBulkDeleteClick}>
            선택 삭제
          </FilterTableToolbarButton>
        }
        actionsAfterExcel={toolbarActionsAfterExcel}
        excelExport={{
          accessLog: { downloadKind: 'PROGRAM_LIST_EXPORT', containedPiiTypes: [] },
          columns,
          data: filteredRows,
          selectedRowKeys,
        }}
      >
        <CmsDataTable<Program>
          className="cms-data-table"
          rowKey="id"
          loading={loading && filteredRows.length === 0}
          dataSource={filteredRows}
          columns={columns}
          pagination={false}
          rowSelection={{
            columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys),
            getCheckboxProps: record => ({ disabled: record.listDeleteBlocked === true }),
          }}
          onRow={record => ({
            onClick: (e: MouseEvent<HTMLElement>) => {
              if ((e.target as HTMLElement).closest('.ant-table-selection-column')) return
              handleRowNavigate(record)
            },
            style: { cursor: 'pointer' },
          })}
        />
        <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
      </FilterTableLayout>

      <ProgramModalWhenOpen open={ujatDetailModalOpen}>
        <LazyUjatProgramDetailFullPageModal
          open={ujatDetailModalOpen}
          onClose={() => undefined}
          program={ujatDetailProgram}
          programIdHint={programIdFromUrl}
          externalLoading={
            Boolean(programIdFromUrl) &&
            !ujatDetailProgram &&
            (detailQuery.isFetching || detailQuery.isLoading)
          }
          externalError={detailQuery.isError && !ujatDetailProgram}
          onUpdateProgram={(programId, program, patch) =>
            updateProgramMutation.mutateAsync({ programId, program, patch })
          }
          onRequestDelete={setProgramPendingDelete}
        />
      </ProgramModalWhenOpen>

      <ProgramModalWhenOpen open={isUjatProgramNewRegistrationQuery} registrationEntry>
        <LazyUjatProgramRegistrationFullpageModal
          open={isUjatProgramNewRegistrationQuery}
          onClose={handleCloseUjatProgramRegistrationFullpage}
          onProgramRegistrationSaved={handleUjatProgramRegistrationSaved}
        />
      </ProgramModalWhenOpen>

      <RegistrationDraftNoticeModal
        open={draftNoticeOpen}
        draftTitle={draftNoticeTitle}
        onConfirm={handleDraftNoticeConfirm}
        onCancel={() => setDraftNoticeOpen(false)}
      />

      <DeleteGuideModal
        open={programPendingDelete != null}
        title={PROGRAM_DELETE_GUIDE_TITLE}
        lines={buildProgramSingleDeleteGuideLines()}
        confirmText="삭제"
        confirmLoading={deleteProgramMutation.isPending}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        onCancel={() => setProgramPendingDelete(null)}
      />

      <DeleteGuideModal
        open={bulkDeleteModalOpen}
        title={bulkDeleteGuide.title}
        lines={bulkDeleteGuide.lines}
        confirmText="삭제"
        confirmLoading={bulkDeleteProgramsMutation.isPending}
        onConfirm={() => {
          void handleConfirmBulkDelete()
        }}
        onCancel={() => setBulkDeleteModalOpen(false)}
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

export default function UjatProgramListPage() {
  return (
    <TemplateWritingPreviewProvider>
      <UjatProgramListPageContent />
    </TemplateWritingPreviewProvider>
  )
}
