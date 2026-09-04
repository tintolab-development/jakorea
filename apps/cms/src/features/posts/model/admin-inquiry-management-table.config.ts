import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  AdminInquiryPendingFilters,
  AdminInquiryRow,
  AdminInquiryTableContext,
} from '@/features/posts/model/admin-inquiry-management.types'
import {
  normalizeDateRangePickerValueToPending,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type UrlDateRangePendingSyncRef,
} from '@/features/posts/lib/url-date-range-pending-sync'

const adminInquiryUrlDateRangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseStatus(raw: string | null): AdminInquiryPendingFilters['status'] {
  if (raw === 'PENDING' || raw === 'ANSWERED') return raw
  return 'ALL'
}

function parseCategory(
  raw: string | null,
  allowedLabels: readonly string[]
): AdminInquiryPendingFilters['category'] {
  if (raw && allowedLabels.includes(raw)) return raw
  return 'ALL'
}

/** 서버 필터 결과를 신뢰하고 문의일시 정렬만 맞춘다. */
function sortRows(data: AdminInquiryRow[]): AdminInquiryRow[] {
  return [...data].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
}

const tanstackColumns: ColumnDef<AdminInquiryRow>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<AdminInquiryPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'status',
    paramKey: 'inq_st',
    condition: f => f.status !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'category',
    paramKey: 'inq_cat',
    condition: f => f.category !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'programName',
    paramKey: 'inq_prog',
    condition: f => f.programName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'inq_title',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'memberName',
    paramKey: 'inq_mem',
    condition: f => f.memberName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'assigneeName',
    paramKey: 'inq_asg',
    condition: f => f.assigneeName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      if (f.dateRange?.[0] && f.dateRange?.[1]) {
        nextParams.set('inq_from', f.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('inq_to', f.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('inq_from')
        nextParams.delete('inq_to')
      }
    },
  },
]

export const adminInquiryManagementTablePageConfig: TablePageConfig<
  AdminInquiryRow,
  AdminInquiryPendingFilters,
  AdminInquiryTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<AdminInquiryRow> => [],
  },

  filters: {
    initialPending: {
      status: 'ALL',
      category: 'ALL',
      programName: '',
      title: '',
      memberName: '',
      assigneeName: '',
      dateRange: null,
    },

    syncPendingFromUrl: ({ context, searchParams, setPendingFilters }) => {
      const status = parseStatus(searchParams.get('inq_st'))
      const category = parseCategory(searchParams.get('inq_cat'), context.allowedCategoryLabels)
      const programName = searchParams.get('inq_prog') ?? ''
      const title = searchParams.get('inq_title') ?? ''
      const memberName = searchParams.get('inq_mem') ?? ''
      const assigneeName = searchParams.get('inq_asg') ?? ''
      const from = searchParams.get('inq_from')
      const to = searchParams.get('inq_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          ref: adminInquiryUrlDateRangeSyncRef,
          from,
          to,
          prev: prev.dateRange,
        }) as AdminInquiryPendingFilters['dateRange']

        const next: AdminInquiryPendingFilters = {
          status,
          category,
          programName,
          title,
          memberName,
          assigneeName,
          dateRange,
        }
        if (
          prev.status === next.status &&
          prev.category === next.category &&
          prev.programName === next.programName &&
          prev.title === next.title &&
          prev.memberName === next.memberName &&
          prev.assigneeName === next.assigneeName &&
          pendingDateRangeTupleEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },

    hasActiveFilters: ({ context, searchParams }) => {
      if (parseStatus(searchParams.get('inq_st')) !== 'ALL') return true
      if (parseCategory(searchParams.get('inq_cat'), context.allowedCategoryLabels) !== 'ALL')
        return true
      if ((searchParams.get('inq_prog') ?? '').trim()) return true
      if ((searchParams.get('inq_title') ?? '').trim()) return true
      if ((searchParams.get('inq_mem') ?? '').trim()) return true
      if ((searchParams.get('inq_asg') ?? '').trim()) return true
      if (searchParams.get('inq_from') && searchParams.get('inq_to')) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'status') {
        const v =
          value == null || value === ''
            ? 'ALL'
            : (value as AdminInquiryPendingFilters['status'])
        return { ...prev, status: v === 'PENDING' || v === 'ANSWERED' ? v : 'ALL' }
      }
      if (key === 'category') {
        const v =
          value == null || value === ''
            ? 'ALL'
            : (value as AdminInquiryPendingFilters['category'])
        return { ...prev, category: v }
      }
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValueToPending(value) }
      }
      if (
        key === 'programName' ||
        key === 'title' ||
        key === 'memberName' ||
        key === 'assigneeName'
      ) {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as AdminInquiryPendingFilters
    },
  },

  filterFn: ({ data }) => {
    const sorted = sortRows(data)
    return { dataForTable: sorted, filteredData: sorted }
  },

  getSearchSync: (_context: AdminInquiryTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
