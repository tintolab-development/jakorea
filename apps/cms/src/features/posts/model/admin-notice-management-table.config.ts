import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { Notice } from '@/data/mock/notices'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  AdminNoticePendingFilters,
  AdminNoticeTableContext,
} from './admin-notice-management.types'
import {
  normalizeDateRangePickerValueToPending,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type UrlDateRangePendingSyncRef,
} from '@/features/posts/lib/url-date-range-pending-sync'

const adminNoticeUrlDateRangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseVisibility(raw: string | null): AdminNoticePendingFilters['visibility'] {
  if (raw === 'private') return 'private'
  return 'public'
}

function parseCategory(
  raw: string | null,
  allowedLabels: readonly string[]
): AdminNoticePendingFilters['category'] {
  if (raw && allowedLabels.includes(raw)) return raw
  return 'ALL'
}

/** 서버 필터 결과를 신뢰하고 고정·작성일시 정렬만 맞춘다. */
function sortRows(data: Notice[]): Notice[] {
  return [...data].sort((a, b) => {
    const pin = Number(b.isImportant) - Number(a.isImportant)
    if (pin !== 0) return pin
    return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  })
}

const tanstackColumns: ColumnDef<Notice>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<AdminNoticePendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'an_q',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'author',
    paramKey: 'an_auth',
    condition: f => f.author.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'visibility',
    paramKey: 'an_vis',
    condition: () => true,
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'category',
    paramKey: 'an_cat',
    condition: f => f.category !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      if (f.dateRange?.[0] && f.dateRange?.[1]) {
        nextParams.set('an_from', f.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('an_to', f.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('an_from')
        nextParams.delete('an_to')
      }
    },
  },
]

export const adminNoticeManagementTablePageConfig: TablePageConfig<
  Notice,
  AdminNoticePendingFilters,
  AdminNoticeTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<Notice> => [],
  },

  filters: {
    initialPending: {
      title: '',
      author: '',
      visibility: 'public',
      category: 'ALL',
      dateRange: null,
    },

    syncPendingFromUrl: ({ context, searchParams, setPendingFilters }) => {
      const title = searchParams.get('an_q') ?? ''
      const author = searchParams.get('an_auth') ?? ''
      const visibility = parseVisibility(searchParams.get('an_vis'))
      const category = parseCategory(searchParams.get('an_cat'), context.allowedCategoryLabels)
      const from = searchParams.get('an_from')
      const to = searchParams.get('an_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          ref: adminNoticeUrlDateRangeSyncRef,
          from,
          to,
          prev: prev.dateRange,
        }) as AdminNoticePendingFilters['dateRange']

        const next: AdminNoticePendingFilters = {
          title,
          author,
          visibility,
          category,
          dateRange,
        }
        if (
          prev.title === next.title &&
          prev.author === next.author &&
          prev.visibility === next.visibility &&
          prev.category === next.category &&
          pendingDateRangeTupleEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },

    hasActiveFilters: ({ context, searchParams }) => {
      if ((searchParams.get('an_q') ?? '').trim()) return true
      if ((searchParams.get('an_auth') ?? '').trim()) return true
      if (parseVisibility(searchParams.get('an_vis')) !== 'public') return true
      if (parseCategory(searchParams.get('an_cat'), context.allowedCategoryLabels) !== 'ALL')
        return true
      if (searchParams.get('an_from') && searchParams.get('an_to')) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'visibility') {
        const v = value === 'private' ? 'private' : 'public'
        return { ...prev, visibility: v }
      }
      if (key === 'category') {
        const v =
          value == null || value === ''
            ? 'ALL'
            : (value as AdminNoticePendingFilters['category'])
        return { ...prev, category: v }
      }
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValueToPending(value) }
      }
      if (key === 'title' || key === 'author') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as AdminNoticePendingFilters
    },
  },

  filterFn: ({ data }) => {
    const sorted = sortRows(data)
    return { dataForTable: sorted, filteredData: sorted }
  },

  getSearchSync: (_context: AdminNoticeTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
