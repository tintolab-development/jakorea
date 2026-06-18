/**
 * UJAT 프로그램 목록 페이지
 * 레이아웃·공통 컴포넌트는 `program-list-page.tsx` / `ProgramList` 와 동일하게 FilterTableLayout + cms-data-table 사용
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import {
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_INST_APP_ID_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { getUjatPrograms } from '@/data/mock/program-schedule-categories'
import {
  isResolvableUjatProgramId,
  resolveUjatProgramForDetail,
} from '@/features/program/ujat/lib/ujat-program-detail-meta'
import {
  formatUjatDispatchedSchoolCount,
  formatUjatProgramManagementName,
  formatUjatVolunteerHalfRecruitment,
} from '@/features/program/ujat/lib/ujat-program-list-display'
import {
  readUjatRegistrationLocalSaveRecords,
  UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import type { Program } from '@/types/domain'
import { FilterTableLayout, CmsButton } from '@/shared/ui'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  TemplateWritingPreviewProvider,
  useTemplateWritingPreview,
} from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { UjatProgramRegistrationFullpageModal } from '@/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal'
import { UjatRegistrationDraftNoticeModal } from '@/features/program/ujat/ui/registration/registration-draft-notice-modal'
import { UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/ujat/model/ujat-program-registration-flow'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { UjatProgramDetailFullPageModal } from '@/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal'
import { UjatProgramListProgressCell } from '@/features/program/ujat/ui/list/ujat-program-list-progress-cell'

import '@/pages/programs/program-list-page.css'
import './ujat-program-list-page.css'

/** `/programs/ujat?new` — 5단계 UJAT 등록 플로우 풀페이지. `userPreview`는 상단「미리보기」시 `TemplatePreviewModal` 동기화용. */
const PROGRAMS_UJAT_NEW_QUERY_KEY = 'new'

/** `/programs/ujat` 및 하위 경로(라우터 `ujat/*`) — 교육 지역 관리 제외 */
function isUjatProgramListPath(pathnameNormalized: string): boolean {
  if (
    pathnameNormalized === '/programs/ujat/regions' ||
    pathnameNormalized.startsWith('/programs/ujat/regions/')
  ) {
    return false
  }
  return (
    pathnameNormalized === '/programs/ujat' || pathnameNormalized.startsWith('/programs/ujat/')
  )
}

/** 진행년도 필터 — 전체 */
const UJAT_PROGRESS_YEAR_ALL = '__all__' as const
type UjatProgressYearFilter = typeof UJAT_PROGRESS_YEAR_ALL | number

const ujatProgramIdSet = new Set(getUjatPrograms().map(p => p.id))

function UjatProgramListPageContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const pNorm = location.pathname.replace(/\/$/, '') || '/'

  const isUjatProgramNewRegistrationQuery =
    isUjatProgramListPath(pNorm) && searchParams.has(PROGRAMS_UJAT_NEW_QUERY_KEY)

  const { programs, loading, fetchPrograms } = useProgramStore()

  const { isWritingUserPreviewOpen, closeWritingUserPreview } = useTemplateWritingPreview()

  const [draftNoticeOpen, setDraftNoticeOpen] = useState(false)
  const [pendingDraftRecords, setPendingDraftRecords] = useState(
    () => readUjatRegistrationLocalSaveRecords()
  )

  const handleCloseUjatProgramRegistrationFullpage = useCallback(() => {
    if (!isUjatProgramListPath(pNorm)) return
    closeWritingUserPreview()
    const next = new URLSearchParams(searchParams)
    next.delete(PROGRAMS_UJAT_NEW_QUERY_KEY)
    next.delete(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
  }, [closeWritingUserPreview, pNorm, searchParams, setSearchParams])

  const handleUjatProgramRegistrationSaved = useCallback(() => {
    void fetchPrograms()
    setPendingDraftRecords(readUjatRegistrationLocalSaveRecords())
    handleCloseUjatProgramRegistrationFullpage()
  }, [fetchPrograms, handleCloseUjatProgramRegistrationFullpage])

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

  const [pendingFilters, setPendingFilters] = useState<{ progressYear: UjatProgressYearFilter }>({
    progressYear: UJAT_PROGRESS_YEAR_ALL,
  })
  const [appliedYear, setAppliedYear] = useState<UjatProgressYearFilter>(UJAT_PROGRESS_YEAR_ALL)

  useEffect(() => {
    void fetchPrograms()
  }, [fetchPrograms])

  const programIdFromUrl = searchParams.get('programId')
  const ujatDetailModalOpen =
    Boolean(programIdFromUrl) && !searchParams.has(PROGRAMS_UJAT_NEW_QUERY_KEY)
  const ujatDetailProgram = useMemo(() => {
    if (!programIdFromUrl) return undefined
    return (
      programs.find(p => p.id === programIdFromUrl) ??
      resolveUjatProgramForDetail(programIdFromUrl)
    )
  }, [programIdFromUrl, programs])

  useEffect(() => {
    if (!programIdFromUrl) return
    if (isResolvableUjatProgramId(programIdFromUrl)) return
    if (loading) return
    if (programs.some(p => p.id === programIdFromUrl)) return
    const next = new URLSearchParams(searchParams)
    next.delete('programId')
    next.delete('lnb')
    next.delete('tab')
    next.delete('edit')
    next.delete(UJAT_INST_APP_ID_PARAM)
    next.delete(UJAT_APPLICANT_ID_PARAM)
    next.delete(UJAT_EDU_INST_ID_PARAM)
    next.delete(UJAT_EDU_INST_TAB_PARAM)
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
    setSearchParams(next, { replace: true })
  }, [programIdFromUrl, loading, programs, searchParams, setSearchParams])

  const ujatPrograms = useMemo(
    () =>
      programs.filter(
        p =>
          ujatProgramIdSet.has(p.id) || p.id.startsWith(UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
      ),
    [programs]
  )

  const progressYearFieldOptions = useMemo(() => {
    const years = new Set<number>()
    ujatPrograms.forEach(p => {
      const y = dayjs(p.startDate).year()
      if (Number.isFinite(y)) years.add(y)
    })
    const yearOptions = Array.from(years)
      .sort((a, b) => b - a)
      .map(y => ({ label: `${y}년`, value: y as number }))
    return [{ label: '전체', value: UJAT_PROGRESS_YEAR_ALL }, ...yearOptions]
  }, [ujatPrograms])

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: 'progressYear',
        type: 'select',
        label: '진행년도',
        options: progressYearFieldOptions,
        placeholder: '진행년도',
        allowClear: false,
        width: FILTER_CONTROL_MAX_WIDTH_PX,
      },
    ],
    [progressYearFieldOptions]
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key !== 'progressYear') return
    if (value === UJAT_PROGRESS_YEAR_ALL) {
      setPendingFilters({ progressYear: UJAT_PROGRESS_YEAR_ALL })
      return
    }
    const nextYear = Number(value)
    setPendingFilters({
      progressYear: Number.isFinite(nextYear) ? nextYear : UJAT_PROGRESS_YEAR_ALL,
    })
  }, [])

  const handleSearch = useCallback(() => {
    setAppliedYear(pendingFilters.progressYear)
  }, [pendingFilters.progressYear])

  const filteredRows = useMemo(() => {
    const sorted = [...ujatPrograms].sort(
      (a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf()
    )
    if (appliedYear === UJAT_PROGRESS_YEAR_ALL) return sorted
    return sorted.filter(p => dayjs(p.startDate).year() === appliedYear)
  }, [ujatPrograms, appliedYear])

  const columns = useMemo<ColumnsType<Program>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 72,
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
        render: (_value, record) => formatUjatProgramManagementName(record),
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

  const openNewRegistration = useCallback(() => {
    navigate({ pathname: '/programs/ujat', search: '?new=1' })
  }, [navigate])

  const handleProgramCreateClick = useCallback(() => {
    const records = readUjatRegistrationLocalSaveRecords()
    setPendingDraftRecords(records)
    if (records.length > 0) {
      setDraftNoticeOpen(true)
      return
    }
    openNewRegistration()
  }, [openNewRegistration])

  const handleDraftNoticeConfirm = useCallback(() => {
    setDraftNoticeOpen(false)
    openNewRegistration()
  }, [openNewRegistration])

  const handleRowNavigate = useCallback(
    (program: Program) => {
      navigate(getProgramAdminDetailUrlFromPathname(program.id, location.pathname))
    },
    [navigate, location.pathname]
  )

  const toolbarActions = (
    <CmsButton width={180} onClick={handleProgramCreateClick}>
      프로그램 신규 등록
    </CmsButton>
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
        description={`총 ${filteredRows.length.toLocaleString()}건`}
        actions={toolbarActions}
        excelExport={{
          columns,
          data: filteredRows,
        }}
      >
        <Table<Program>
          className="cms-data-table"
          rowKey="id"
          loading={loading}
          dataSource={filteredRows}
          columns={columns}
          pagination={false}
          onRow={record => ({
            onClick: () => handleRowNavigate(record),
            style: { cursor: 'pointer' },
          })}
        />
      </FilterTableLayout>

      <UjatProgramDetailFullPageModal
        open={ujatDetailModalOpen}
        onClose={() => undefined}
        program={ujatDetailProgram ?? null}
        programIdHint={programIdFromUrl}
      />

      <UjatProgramRegistrationFullpageModal
        open={isUjatProgramNewRegistrationQuery}
        onClose={handleCloseUjatProgramRegistrationFullpage}
        onProgramRegistrationSaved={handleUjatProgramRegistrationSaved}
      />

      <UjatRegistrationDraftNoticeModal
        open={draftNoticeOpen}
        records={pendingDraftRecords}
        onConfirm={handleDraftNoticeConfirm}
        onCancel={() => setDraftNoticeOpen(false)}
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
