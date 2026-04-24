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
  if (raw === 'public' || raw === 'private') return raw
  return 'ALL'
}

function parseCategory(
  raw: string | null,
  allowedLabels: readonly string[]
): AdminNoticePendingFilters['category'] {
  if (raw && allowedLabels.includes(raw)) return raw
  return 'ALL'
}

function filterRows(
  data: Notice[],
  searchParams: URLSearchParams,
  context: AdminNoticeTableContext
): Notice[] {
  const title = (searchParams.get('an_q') ?? '').trim().toLowerCase()
  const author = (searchParams.get('an_auth') ?? '').trim().toLowerCase()
  const vis = parseVisibility(searchParams.get('an_vis'))
  const cat = parseCategory(searchParams.get('an_cat'), context.allowedCategoryLabels)
  const from = searchParams.get('an_from')
  const to = searchParams.get('an_to')

  return data
    .filter(row => {
      if (title && !row.title.toLowerCase().includes(title)) return false
      if (author && !row.author.toLowerCase().includes(author)) return false
      if (vis === 'public' && row.status !== 'published') return false
      if (vis === 'private' && row.status === 'published') return false
      if (cat !== 'ALL' && row.category !== cat) return false
      if (from && to) {
        const d = dayjs(row.createdAt)
        const start = dayjs(from).startOf('day')
        const end = dayjs(to).endOf('day')
        if (d.isBefore(start) || d.isAfter(end)) return false
      }
      return true
    })
    .sort((a, b) => {
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
    condition: f => f.visibility !== 'ALL',
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
      visibility: 'ALL',
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
      if (parseVisibility(searchParams.get('an_vis')) !== 'ALL') return true
      if (parseCategory(searchParams.get('an_cat'), context.allowedCategoryLabels) !== 'ALL')
        return true
      if (searchParams.get('an_from') && searchParams.get('an_to')) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'visibility') {
        const v =
          value == null || value === ''
            ? 'ALL'
            : (value as AdminNoticePendingFilters['visibility'])
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

  filterFn: ({ context, data, searchParams }) => {
    const filtered = filterRows(data, searchParams, context)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (_context: AdminNoticeTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
