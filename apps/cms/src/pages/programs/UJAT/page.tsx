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
import { getCapacity } from '@/features/program/general/lib/program-helpers'
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
import type { Program } from '@/types/domain'
import { FilterTableLayout, CmsButton } from '@/shared/ui'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { ProgramProgressStatusText } from '@/shared/components/program-enrollment-status-text'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { UjatProgramRegistrationFullpageModal } from '@/features/program/ujat/ui/registration/ujat-program-registration-fullpage-modal'
import { UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY } from '@/features/program/ujat/model/ujat-program-registration-flow'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { UjatProgramDetailFullPageModal } from '@/features/program/ujat/ui/detail-modal/ujat-program-detail-fullpage-modal'
import { UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/ujat/lib/ujat-registration-local-save'

import './ujat-program-list-page.css'

const UJAT_VOLUNTEER_CAP_FALLBACK = 30

/** `/programs/ujat?new` — 5단계 UJAT 등록 플로우 풀페이지. `userPreview`는 상단「미리보기」시 `TemplatePreviewModal` 동기화용. */
const PROGRAMS_UJAT_NEW_QUERY_KEY = 'new'

/** `/programs/ujat` 및 하위 경로(라우터 `ujat/*`) */
function isUjatProgramListPath(pathnameNormalized: string): boolean {
  return (
    pathnameNormalized === '/programs/ujat' || pathnameNormalized.startsWith('/programs/ujat/')
  )
}
/** 진행년도 필터 — 전체(진행 현황별 mock 건수) */
const UJAT_PROGRESS_YEAR_ALL = '__all__' as const
type UjatProgressYearFilter = typeof UJAT_PROGRESS_YEAR_ALL | number

function sumVolunteers(program: Program): number {
  return (
    (program.generalVolunteers ?? 0) +
    (program.staffVolunteers ?? 0) +
    (program.returningVolunteers ?? 0)
  )
}

function formatCurrentTotal(current: number, total: number): string {
  return `${current} / ${total}`
}

function volunteerHalfDisplay(program: Program): string {
  const cap = program.instructorCapacity ?? getCapacity(program) ?? UJAT_VOLUNTEER_CAP_FALLBACK
  const current = Math.min(sumVolunteers(program), cap)
  return formatCurrentTotal(current, cap)
}

function dispatchedSchoolDisplay(program: Program): string {
  const cap = program.instructorCapacity ?? UJAT_VOLUNTEER_CAP_FALLBACK
  const current = Math.min(program.participatingSchoolCount ?? 0, cap)
  return formatCurrentTotal(current, cap)
}

/** UJAT 목록 — 프로그램 진행 현황(7단계, 모집 신청 현황과 별도) */
function UjatProgramProgressCell({ program }: { program: Program }) {
  return <ProgramProgressStatusText program={program} />
}

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

  const defaultYear = dayjs().year()
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
    years.add(defaultYear)
    const yearOptions = Array.from(years)
      .sort((a, b) => b - a)
      .map(y => ({ label: `${y}년`, value: y as number }))
    return [{ label: '전체', value: UJAT_PROGRESS_YEAR_ALL }, ...yearOptions]
  }, [ujatPrograms, defaultYear])

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: 'progressYear',
        type: 'select',
        label: '진행년도',
        options: progressYearFieldOptions,
        placeholder: '진행년도',
        allowClear: false,
        width: 260,
      },
    ],
    [progressYearFieldOptions]
  )

  const handleFilterChange = useCallback(
    (key: string, value: unknown) => {
      if (key !== 'progressYear') return
      if (value === UJAT_PROGRESS_YEAR_ALL) {
        setPendingFilters({ progressYear: UJAT_PROGRESS_YEAR_ALL })
        return
      }
      const nextYear =
        value === '' || value === undefined || value === null ? defaultYear : Number(value)
      setPendingFilters({
        progressYear: Number.isFinite(nextYear) ? nextYear : defaultYear,
      })
    },
    [defaultYear]
  )

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
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        align: 'center',
        render: (text: string | undefined) => text ?? '-',
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycleProgress',
        width: 200,
        align: 'center',
        render: (_value, record) => <UjatProgramProgressCell program={record} />,
      },
      {
        title: '최종 파견 학교 수',
        key: 'dispatchedSchools',
        width: 180,
        align: 'center',
        render: (_value, record) => dispatchedSchoolDisplay(record),
      },
      {
        title: '상반기 봉사자 모집 인원',
        key: 'volunteerFirstHalf',
        width: 200,
        align: 'center',
        render: (_value, record) => volunteerHalfDisplay(record),
      },
      {
        title: '하반기 봉사자 모집 인원',
        key: 'volunteerSecondHalf',
        width: 200,
        align: 'center',
        render: (_value, record) => volunteerHalfDisplay(record),
      },
    ],
    [filteredRows]
  )

  const handleProgramCreateClick = useCallback(() => {
    navigate({ pathname: '/programs/ujat', search: '?new=1' })
  }, [navigate])

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
    <div className="ujat-program-list-page">
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
    </div>
  )
}

export default function UjatProgramListPage() {
  return <UjatProgramListPageContent />
}
