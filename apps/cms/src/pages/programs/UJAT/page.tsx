/**
 * UJAT 프로그램 목록 페이지
 * 레이아웃·공통 컴포넌트는 `program-list-page.tsx` / `ProgramList` 와 동일하게 FilterTableLayout + cms-data-table 사용
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProgramStore } from '@/features/program/model/program-store'
import { getCapacity } from '@/features/program/lib/program-helpers'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/lib/program-admin-detail-url'
import { getUjatPrograms } from '@/data/mock/program-schedule-categories'
import type { Program } from '@/types/domain'
import { FilterTableLayout, CmsButton } from '@/shared/ui'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'

import './ujat-program-list-page.css'

const UJAT_VOLUNTEER_CAP_FALLBACK = 30

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
  const cap =
    program.instructorCapacity ??
    getCapacity(program) ??
    UJAT_VOLUNTEER_CAP_FALLBACK
  const current = Math.min(sumVolunteers(program), cap)
  return formatCurrentTotal(current, cap)
}

function participantDisplay(program: Program): string {
  const cap = getCapacity(program) ?? UJAT_VOLUNTEER_CAP_FALLBACK
  const approved = program.approvedStudentCount ?? 0
  return formatCurrentTotal(approved, cap)
}

const ujatProgramIdSet = new Set(getUjatPrograms().map(p => p.id))

export function UjatProgramListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { programs, loading, fetchPrograms } = useProgramStore()

  const defaultYear = dayjs().year()
  const [pendingFilters, setPendingFilters] = useState<{ progressYear: number }>({
    progressYear: defaultYear,
  })
  const [appliedYear, setAppliedYear] = useState(defaultYear)

  useEffect(() => {
    void fetchPrograms()
  }, [fetchPrograms])

  const ujatPrograms = useMemo(
    () => programs.filter(p => ujatProgramIdSet.has(p.id)),
    [programs]
  )

  const progressYearFieldOptions = useMemo(() => {
    const years = new Set<number>()
    ujatPrograms.forEach(p => {
      const y = dayjs(p.startDate).year()
      if (Number.isFinite(y)) years.add(y)
    })
    years.add(defaultYear)
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(y => ({ label: `${y}년`, value: y }))
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
        width: 200,
      },
    ],
    [progressYearFieldOptions]
  )

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (key !== 'progressYear') return
    const nextYear =
      value === '' || value === undefined || value === null
        ? defaultYear
        : Number(value)
    setPendingFilters(prev => ({
      ...prev,
      progressYear: Number.isFinite(nextYear) ? nextYear : defaultYear,
    }))
  }, [defaultYear])

  const handleSearch = useCallback(() => {
    setAppliedYear(pendingFilters.progressYear)
  }, [pendingFilters.progressYear])

  const filteredRows = useMemo(() => {
    return ujatPrograms
      .filter(p => dayjs(p.startDate).year() === appliedYear)
      .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf())
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
        align: 'left',
        render: (text: string | undefined) => text ?? '-',
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycleProgress',
        width: 200,
        align: 'center',
        render: (_value, record) =>
          record.lifecycleStatus ? (
            <ProgramLifecycleStatusBadge status={record.lifecycleStatus} variant="table" />
          ) : (
            '-'
          ),
      },
      {
        title: '참여자 모집 인원',
        key: 'participantRecruitment',
        width: 160,
        align: 'center',
        render: (_value, record) => participantDisplay(record),
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
    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
  }, [])

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
    </div>
  )
}

export default UjatProgramListPage
