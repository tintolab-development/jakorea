/**
 * CMS 프로그램 목록 (필터 카드 + 테이블/캘린더)
 */

import { Table } from 'antd'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useProgramTable } from '../model/use-program-table'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import './program-list.css'
import { ProgramCalendarView } from './program-calendar-view'
import { programLifecycleStatusConfig } from '@/shared/constants/status'
import { resolveEducationColumns } from './table/program-table-column-resolver'
import { programListFilterFields, economyFilterFields } from './table/program-list-filter-fields'
import { buildProgramListFilters } from './table/program-list-filter-builder'
import dayjs, { type Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { FilterTableLayout } from '@/shared/ui'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const economyFilterLifecycleStatuses = new Set<ProgramLifecycleStatus>(
  programLifecycleStatusConfig.order
)

export type ProgramListTableVariant = 'general' | 'economy'

export interface ProgramListProps {
  data: Program[]
  loading?: boolean
  headerTitle?: string
  onView: (program: Program) => void
  onBulkDelete?: (programs: Program[]) => void
  onSelectionChange?: (selectedKeys: React.Key[]) => void
  selectedRowKeys?: React.Key[]
  showRowSelection?: boolean
  showCalendarView?: boolean
  viewMode?: 'list' | 'calendar'
  tableVariant?: ProgramListTableVariant
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  onDisplayCountChange?: (count: number, hasActiveFilters: boolean) => void
  effectiveLifecycleStatus?: ProgramLifecycleStatus | null
  readOnlyLifecycleStatus?: boolean
  /** 경제 교육 ProgramStatusWidget — 전체 */
  economyAllProgramsActive?: boolean
  /** 경제 교육 — 예정 */
  economyScheduledActive?: boolean
  /** 경제 교육 — 진행 중 */
  economyInProgressActive?: boolean
  /** 경제 교육 — 완료 (전체와 동일 컬럼) */
  economyCompletedActive?: boolean
  children?: React.ReactNode
}

export function ProgramList({
  data,
  loading,
  onView,
  headerTitle,
  onBulkDelete,
  onSelectionChange,
  selectedRowKeys: externalSelectedRowKeys,
  showRowSelection = false,
  showCalendarView = false,
  viewMode: externalViewMode,
  tableVariant = 'general',
  onDisplayCountChange,
  effectiveLifecycleStatus,
  readOnlyLifecycleStatus = false,
  economyAllProgramsActive = false,
  economyScheduledActive = false,
  economyInProgressActive = false,
  economyCompletedActive = false,
  studentRecruitmentTable = false,
  instructorRecruitmentTable = false,
  children,
}: ProgramListProps) {
  const location = useLocation()
  const isEconomyPage =
    location.pathname === '/programs/economy-education' || tableVariant === 'economy'
  const [searchParams, setSearchParams] = useSearchParams()

  const operationPeriodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const start = searchParams.get('operationStartDate')
    const end = searchParams.get('operationEndDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [searchParams])

  const applicationPeriodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const start = searchParams.get('applicationStartDate')
    const end = searchParams.get('applicationEndDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [searchParams])

  const filteredData = useMemo(() => {
    let filtered = data

    if (operationPeriodRange?.[0] && operationPeriodRange?.[1]) {
      const rangeStart = operationPeriodRange[0].startOf('day')
      const rangeEnd = operationPeriodRange[1].endOf('day')
      filtered = filtered.filter(program => {
        if (!program.startDate || !program.endDate) {
          return false
        }
        const startDate = dayjs(program.startDate)
        const endDate = dayjs(program.endDate)
        if (!startDate.isValid() || !endDate.isValid()) {
          return false
        }
        return startDate.isSameOrBefore(rangeEnd) && endDate.isSameOrAfter(rangeStart)
      })
    }

    if (applicationPeriodRange?.[0] && applicationPeriodRange?.[1]) {
      const rangeStart = applicationPeriodRange[0].startOf('day')
      const rangeEnd = applicationPeriodRange[1].endOf('day')
      filtered = filtered.filter(program => {
        if (program.applicationStartDate && program.applicationEndDate) {
          const appStart = dayjs(program.applicationStartDate)
          const appEnd = dayjs(program.applicationEndDate)
          if (!appStart.isValid() || !appEnd.isValid()) {
            return false
          }
          return appStart.isSameOrBefore(rangeEnd) && appEnd.isSameOrAfter(rangeStart)
        }
        return false
      })
    }

    return filtered
  }, [data, operationPeriodRange, applicationPeriodRange])

  const economyFilteredData = useMemo(() => {
    if (!readOnlyLifecycleStatus) return filteredData
    const title = searchParams.get('title') || ''

    let result = filteredData
    if (title.trim()) {
      const q = title.trim().toLowerCase()
      result = result.filter(p => p.title?.toLowerCase().includes(q))
    }
    return result
  }, [filteredData, readOnlyLifecycleStatus, searchParams])

  const dataForTable = readOnlyLifecycleStatus ? economyFilteredData : filteredData
  const { table, columnFilters } = useProgramTable(dataForTable)

  const hasActiveFilters = useMemo(() => {
    if (readOnlyLifecycleStatus) {
      const title = searchParams.get('title') || ''
      const lifecycleRaw = searchParams.get('lifecycleStatus') || ''
      const hasLifecycleFilter =
        lifecycleRaw !== '' &&
        economyFilterLifecycleStatuses.has(lifecycleRaw as ProgramLifecycleStatus)
      const hasOperationPeriod = Boolean(
        searchParams.get('operationStartDate') && searchParams.get('operationEndDate')
      )
      const hasColumnFilter = columnFilters.some(
        f => f.value != null && String(f.value).trim() !== ''
      )
      return Boolean(
        hasColumnFilter || title.trim() !== '' || hasLifecycleFilter || hasOperationPeriod
      )
    }
    const hasColumnFilter = columnFilters.some(
      f => f.value != null && String(f.value).trim() !== ''
    )
    return Boolean(
      hasColumnFilter ||
      (operationPeriodRange?.[0] && operationPeriodRange?.[1]) ||
      (applicationPeriodRange?.[0] && applicationPeriodRange?.[1])
    )
  }, [
    columnFilters,
    operationPeriodRange,
    applicationPeriodRange,
    readOnlyLifecycleStatus,
    searchParams,
  ])

  const displayedCount = hasActiveFilters
    ? table.getFilteredRowModel().rows.length
    : filteredData.length
  useEffect(() => {
    onDisplayCountChange?.(displayedCount, hasActiveFilters)
  }, [displayedCount, hasActiveFilters, onDisplayCountChange])

  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([])
  const [internalViewMode] = useState<'list' | 'calendar'>('list')
  const viewMode = externalViewMode ?? internalViewMode

  const [pendingFilters, setPendingFilters] = useState({
    title: '',
    lifecycleStatus: undefined as ProgramLifecycleStatus | undefined,
    category: undefined as string | undefined,
    businessArea: undefined as string | undefined,
    targetLevel: undefined as string | undefined,
    type: undefined as string | undefined,
    applicationStartDate: null as Dayjs | null,
    applicationEndDate: null as Dayjs | null,
    operationStartDate: null as Dayjs | null,
    operationEndDate: null as Dayjs | null,
  })

  useEffect(() => {
    if (readOnlyLifecycleStatus) {
      const titleFromUrl = searchParams.get('title') || ''
      const lifecycleRaw = searchParams.get('lifecycleStatus') || ''
      const lifecycleFromUrl =
        lifecycleRaw && economyFilterLifecycleStatuses.has(lifecycleRaw as ProgramLifecycleStatus)
          ? (lifecycleRaw as ProgramLifecycleStatus)
          : undefined
      const categoryFilter = searchParams.get('category') || undefined
      const targetLevelFilter = searchParams.get('targetLevel') || undefined

      setPendingFilters(prev => {
        const hasChanges =
          prev.title !== titleFromUrl ||
          prev.lifecycleStatus !== lifecycleFromUrl ||
          prev.category !== categoryFilter ||
          prev.targetLevel !== targetLevelFilter

        if (!hasChanges) return prev

        return {
          ...prev,
          title: titleFromUrl,
          lifecycleStatus: lifecycleFromUrl,
          category: categoryFilter,
          targetLevel: targetLevelFilter,
        }
      })
    } else {
      const titleFromUrl = searchParams.get('title') || ''
      const titleFilter = columnFilters.find(f => f.id === 'title')?.value as string | undefined
      const currentTitle = titleFromUrl || titleFilter || ''

      if (currentTitle !== ((table.getColumn('title')?.getFilterValue() as string) || '')) {
        table.getColumn('title')?.setFilterValue(currentTitle || null)
      }

      const categoryFilter = columnFilters.find(f => f.id === 'category')?.value as
        | string
        | undefined
      const businessAreaFilter = columnFilters.find(f => f.id === 'businessArea')?.value as
        | string
        | undefined
      const targetLevelFilter = columnFilters.find(f => f.id === 'targetLevel')?.value as
        | string
        | undefined

      const statusFromUrl = searchParams.get('status') as ProgramLifecycleStatus | null
      const statusFilter = statusFromUrl ?? effectiveLifecycleStatus ?? null
      const typeFilter = searchParams.get('type') || null

      const operationStartDateStr = searchParams.get('operationStartDate')
      const operationEndDateStr = searchParams.get('operationEndDate')

      setPendingFilters(prev => {
        const hasChanges =
          prev.title !== currentTitle ||
          prev.lifecycleStatus !== (statusFilter || undefined) ||
          prev.type !== (typeFilter || undefined) ||
          prev.category !== categoryFilter ||
          prev.businessArea !== businessAreaFilter ||
          prev.targetLevel !== targetLevelFilter ||
          prev.operationStartDate?.format('YYYY-MM-DD') !== operationStartDateStr ||
          prev.operationEndDate?.format('YYYY-MM-DD') !== operationEndDateStr

        if (!hasChanges) return prev

        return {
          title: currentTitle,
          lifecycleStatus: statusFilter || undefined,
          category: categoryFilter,
          businessArea: businessAreaFilter,
          targetLevel: targetLevelFilter,
          type: typeFilter || undefined,
          applicationStartDate: null,
          applicationEndDate: null,
          operationStartDate: operationStartDateStr
            ? dayjs(operationStartDateStr).isValid()
              ? dayjs(operationStartDateStr)
              : null
            : null,
          operationEndDate: operationEndDateStr
            ? dayjs(operationEndDateStr).isValid()
              ? dayjs(operationEndDateStr)
              : null
            : null,
        }
      })
    }
  }, [columnFilters, searchParams, table, effectiveLifecycleStatus, readOnlyLifecycleStatus])

  const handleSearch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (readOnlyLifecycleStatus) {
      if (pendingFilters.title?.trim()) {
        nextParams.set('title', pendingFilters.title.trim())
      } else {
        nextParams.delete('title')
      }
      if (pendingFilters.lifecycleStatus) {
        nextParams.set('lifecycleStatus', pendingFilters.lifecycleStatus)
      } else {
        nextParams.delete('lifecycleStatus')
      }
      nextParams.delete('statusText')
      if (pendingFilters.category) {
        nextParams.set('category', pendingFilters.category)
      } else {
        nextParams.delete('category')
      }
      if (pendingFilters.targetLevel) {
        nextParams.set('targetLevel', pendingFilters.targetLevel)
      } else {
        nextParams.delete('targetLevel')
      }
      table.getColumn('category')?.setFilterValue(pendingFilters.category || null)
      table.getColumn('targetLevel')?.setFilterValue(pendingFilters.targetLevel || null)
    } else {
      table.getColumn('category')?.setFilterValue(pendingFilters.category || null)
      table.getColumn('businessArea')?.setFilterValue(pendingFilters.businessArea || null)
      table.getColumn('targetLevel')?.setFilterValue(pendingFilters.targetLevel || null)
      table
        .getColumn('type')
        ?.setFilterValue(
          pendingFilters.type && pendingFilters.type !== 'all' ? pendingFilters.type : null
        )

      if (pendingFilters.title) {
        nextParams.set('title', pendingFilters.title)
      } else {
        nextParams.delete('title')
      }
      if (pendingFilters.lifecycleStatus) {
        nextParams.set('status', pendingFilters.lifecycleStatus)
      } else {
        nextParams.delete('status')
      }
      if (pendingFilters.type && pendingFilters.type !== 'all') {
        nextParams.set('type', pendingFilters.type)
      } else {
        nextParams.delete('type')
      }
      if (pendingFilters.operationStartDate && pendingFilters.operationEndDate) {
        nextParams.set('operationStartDate', pendingFilters.operationStartDate.format('YYYY-MM-DD'))
        nextParams.set('operationEndDate', pendingFilters.operationEndDate.format('YYYY-MM-DD'))
      } else {
        nextParams.delete('operationStartDate')
        nextParams.delete('operationEndDate')
      }
    }

    setSearchParams(nextParams, { replace: true })
  }, [pendingFilters, table, searchParams, setSearchParams, readOnlyLifecycleStatus])

  const effectiveSelectedRowKeys =
    externalSelectedRowKeys !== undefined ? externalSelectedRowKeys : internalSelectedRowKeys

  const handleSelectionChange = useCallback(
    (keys: React.Key[]) => {
      if (externalSelectedRowKeys !== undefined) {
        onSelectionChange?.(keys)
      } else {
        setInternalSelectedRowKeys(keys)
        onSelectionChange?.(keys)
      }
    },
    [externalSelectedRowKeys, onSelectionChange]
  )
  const tableColumns = useMemo(
    () =>
      resolveEducationColumns({
        studentRecruitmentTable,
        instructorRecruitmentTable,
        isEconomyPage,
        readOnlyLifecycleStatus,
        economyAllProgramsActive,
        economyScheduledActive,
        economyInProgressActive,
        economyCompletedActive,
      }),
    [
      studentRecruitmentTable,
      instructorRecruitmentTable,
      isEconomyPage,
      readOnlyLifecycleStatus,
      economyAllProgramsActive,
      economyScheduledActive,
      economyInProgressActive,
      economyCompletedActive,
    ]
  )

  return (
    <div
      className={
        viewMode === 'list' ? 'program-list-container' : 'program-list-calendar-view-container'
      }
    >
      {viewMode === 'list' ? (
        <FilterTableLayout
          fields={readOnlyLifecycleStatus ? economyFilterFields : programListFilterFields}
          filters={buildProgramListFilters(pendingFilters, readOnlyLifecycleStatus)}
          onFilterChange={(key, value) => {
            if (key === 'operationPeriod') {
              const dates = value as [Dayjs, Dayjs] | null
              setPendingFilters(prev => ({
                ...prev,
                operationStartDate: dates?.[0] || null,
                operationEndDate: dates?.[1] || null,
              }))
            } else if (
              readOnlyLifecycleStatus &&
              (key === 'category' || key === 'targetLevel' || key === 'lifecycleStatus')
            ) {
              setPendingFilters(prev => ({
                ...prev,
                [key]:
                  value != null && String(value).trim()
                    ? key === 'lifecycleStatus'
                      ? (value as ProgramLifecycleStatus)
                      : value
                    : undefined,
              }))
            } else {
              setPendingFilters(prev => ({ ...prev, [key]: value }))
            }
          }}
          onSearch={handleSearch}
          bordered={false}
          title={headerTitle}
          description={`총 ${displayedCount.toLocaleString()}건`}
          actions={children}
        >
          <Table
            className="cms-data-table"
            rowSelection={
              showRowSelection && (onBulkDelete != null || onSelectionChange != null)
                ? {
                    columnWidth: isEconomyPage ? 80 : TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: effectiveSelectedRowKeys,
                    onChange: handleSelectionChange,
                  }
                : undefined
            }
            dataSource={table.getFilteredRowModel().rows.map(row => row.original)}
            columns={tableColumns}
            rowKey="id"
            loading={loading}
            onRow={record => ({
              onClick: () => onView(record),
              style: { cursor: 'pointer' },
            })}
            pagination={false}
          />
        </FilterTableLayout>
      ) : null}

      {showCalendarView && viewMode === 'calendar' ? (
        <>
          {children}
          <ProgramCalendarView
            programs={table.getRowModel().rows.map(row => row.original)}
            loading={loading}
            onProgramClick={onView}
          />
        </>
      ) : null}
    </div>
  )
}
