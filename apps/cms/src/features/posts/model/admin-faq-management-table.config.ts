import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  AdminFaqPendingFilters,
  AdminFaqTableContext,
} from './admin-faq-management.types'
import {
  normalizeDateRangePickerValueToPending,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type UrlDateRangePendingSyncRef,
} from '@/features/posts/lib/url-date-range-pending-sync'

const adminFaqUrlDateRangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseVisibility(raw: string | null): AdminFaqPendingFilters['visibility'] {
  if (raw === 'private') return 'private'
  return 'public'
}

function parseCategory(
  raw: string | null,
  allowedLabels: readonly string[]
): AdminFaqPendingFilters['category'] {
  if (raw && allowedLabels.includes(raw)) return raw
  return 'ALL'
}

/** 서버 필터 결과를 신뢰하고 작성일시 정렬만 맞춘다. */
function sortRows(data: AdminFaq[]): AdminFaq[] {
  return [...data].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
}

const tanstackColumns: ColumnDef<AdminFaq>[] = [{ accessorKey: 'id', id: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<AdminFaqPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: 'af_q',
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'author',
    paramKey: 'af_auth',
    condition: f => f.author.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'visibility',
    paramKey: 'af_vis',
    condition: () => true,
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'category',
    paramKey: 'af_cat',
    condition: f => f.category !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      if (f.dateRange?.[0] && f.dateRange?.[1]) {
        nextParams.set('af_from', f.dateRange[0].format('YYYY-MM-DD'))
        nextParams.set('af_to', f.dateRange[1].format('YYYY-MM-DD'))
      } else {
        nextParams.delete('af_from')
        nextParams.delete('af_to')
      }
    },
  },
]

export const adminFaqManagementTablePageConfig: TablePageConfig<
  AdminFaq,
  AdminFaqPendingFilters,
  AdminFaqTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<AdminFaq> => [],
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
      const title = searchParams.get('af_q') ?? ''
      const author = searchParams.get('af_auth') ?? ''
      const visibility = parseVisibility(searchParams.get('af_vis'))
      const category = parseCategory(searchParams.get('af_cat'), context.allowedCategoryLabels)
      const from = searchParams.get('af_from')
      const to = searchParams.get('af_to')

      setPendingFilters(prev => {
        const dateRange = resolvePendingDateRangeFromUrl({
          ref: adminFaqUrlDateRangeSyncRef,
          from,
          to,
          prev: prev.dateRange,
        }) as AdminFaqPendingFilters['dateRange']

        const next: AdminFaqPendingFilters = {
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
      if ((searchParams.get('af_q') ?? '').trim()) return true
      if ((searchParams.get('af_auth') ?? '').trim()) return true
      if (parseVisibility(searchParams.get('af_vis')) !== 'public') return true
      if (parseCategory(searchParams.get('af_cat'), context.allowedCategoryLabels) !== 'ALL')
        return true
      if (searchParams.get('af_from') && searchParams.get('af_to')) return true
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
            : (value as AdminFaqPendingFilters['category'])
        return { ...prev, category: v }
      }
      if (key === 'dateRange') {
        return { ...prev, dateRange: normalizeDateRangePickerValueToPending(value) }
      }
      if (key === 'title' || key === 'author') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as AdminFaqPendingFilters
    },
  },

  filterFn: ({ data }) => {
    const sorted = sortRows(data)
    return { dataForTable: sorted, filteredData: sorted }
  },

  getSearchSync: (_context: AdminFaqTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
