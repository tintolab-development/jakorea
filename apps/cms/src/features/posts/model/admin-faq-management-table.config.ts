import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { AdminFaq } from '@/data/mock/admin-faqs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  AdminFaqPendingFilters,
  AdminFaqTableContext,
} from './admin-faq-management.types'

function dayjsPairEqual(
  a: [Dayjs, Dayjs] | null | undefined,
  b: [Dayjs, Dayjs] | null | undefined
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a[0].valueOf() === b[0].valueOf() && a[1].valueOf() === b[1].valueOf()
}

function parseVisibility(raw: string | null): AdminFaqPendingFilters['visibility'] {
  if (raw === 'public' || raw === 'private') return raw
  return 'ALL'
}

function parseCategory(
  raw: string | null,
  allowedLabels: readonly string[]
): AdminFaqPendingFilters['category'] {
  if (raw && allowedLabels.includes(raw)) return raw
  return 'ALL'
}

function filterRows(
  data: AdminFaq[],
  searchParams: URLSearchParams,
  context: AdminFaqTableContext
): AdminFaq[] {
  const title = (searchParams.get('af_q') ?? '').trim().toLowerCase()
  const author = (searchParams.get('af_auth') ?? '').trim().toLowerCase()
  const vis = parseVisibility(searchParams.get('af_vis'))
  const cat = parseCategory(searchParams.get('af_cat'), context.allowedCategoryLabels)
  const from = searchParams.get('af_from')
  const to = searchParams.get('af_to')

  return data
    .filter(row => {
      if (title && !row.question.toLowerCase().includes(title)) return false
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
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
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
    condition: f => f.visibility !== 'ALL',
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
      visibility: 'ALL',
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
      const dateRange =
        from && to ? ([dayjs(from), dayjs(to)] as [Dayjs, Dayjs]) : null

      setPendingFilters(prev => {
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
          dayjsPairEqual(prev.dateRange, next.dateRange)
        ) {
          return prev
        }
        return next
      })
    },

    hasActiveFilters: ({ context, searchParams }) => {
      if ((searchParams.get('af_q') ?? '').trim()) return true
      if ((searchParams.get('af_auth') ?? '').trim()) return true
      if (parseVisibility(searchParams.get('af_vis')) !== 'ALL') return true
      if (parseCategory(searchParams.get('af_cat'), context.allowedCategoryLabels) !== 'ALL')
        return true
      if (searchParams.get('af_from') && searchParams.get('af_to')) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'visibility') {
        const v =
          value == null || value === ''
            ? 'ALL'
            : (value as AdminFaqPendingFilters['visibility'])
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
        const range = Array.isArray(value) ? value : null
        const dr =
          range?.[0] && range?.[1]
            ? ([range[0], range[1]] as [Dayjs, Dayjs])
            : null
        return { ...prev, dateRange: dr }
      }
      if (key === 'title' || key === 'author') {
        return { ...prev, [key]: String(value ?? '') }
      }
      return { ...prev, [key]: value } as AdminFaqPendingFilters
    },
  },

  filterFn: ({ context, data, searchParams }) => {
    const filtered = filterRows(data, searchParams, context)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (_context: AdminFaqTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
