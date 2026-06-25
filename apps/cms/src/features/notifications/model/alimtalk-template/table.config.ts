import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  AlimtalkTemplatePendingFilters,
  AlimtalkTemplateRow,
  AlimtalkTemplateTableContext,
} from './types'

const URL_PREFIX = 'kat'

function parseApprovalStatus(raw: string | null): AlimtalkTemplatePendingFilters['kakaoApprovalStatus'] {
  if (
    raw === 'REGISTERED' ||
    raw === 'REQUESTED' ||
    raw === 'APPROVED' ||
    raw === 'REJECTED'
  ) {
    return raw
  }
  return 'ALL'
}

function parseUsageStatus(raw: string | null): AlimtalkTemplatePendingFilters['templateUsageStatus'] {
  if (
    raw === 'WAITING' ||
    raw === 'NORMAL' ||
    raw === 'SUSPENDED' ||
    raw === 'DORMANT' ||
    raw === 'BLOCKED'
  ) {
    return raw
  }
  return 'ALL'
}

function filterRowsBySearchParams(
  data: AlimtalkTemplateRow[],
  searchParams: URLSearchParams
): AlimtalkTemplateRow[] {
  const approvalStatus = parseApprovalStatus(searchParams.get(`${URL_PREFIX}_appr`))
  const usageStatus = parseUsageStatus(searchParams.get(`${URL_PREFIX}_usage`))
  const channelName = (searchParams.get(`${URL_PREFIX}_ch`) ?? '').trim().toLowerCase()
  const templateName = (searchParams.get(`${URL_PREFIX}_name`) ?? '').trim().toLowerCase()
  const fromStr = searchParams.get(`${URL_PREFIX}_from`)
  const toStr = searchParams.get(`${URL_PREFIX}_to`)

  let list = [...data]

  if (approvalStatus !== 'ALL') {
    list = list.filter(row => row.kakaoApprovalStatus === approvalStatus)
  }
  if (usageStatus !== 'ALL') {
    list = list.filter(row => row.templateUsageStatus === usageStatus)
  }
  if (channelName) {
    list = list.filter(row => row.channelName.toLowerCase().includes(channelName))
  }
  if (templateName) {
    list = list.filter(row => row.templateName.toLowerCase().includes(templateName))
  }
  if (fromStr && toStr) {
    const from = dayjs(fromStr).startOf('day')
    const to = dayjs(toStr).endOf('day')
    if (from.isValid() && to.isValid()) {
      list = list.filter(row => {
        const registeredAt = dayjs(row.registeredAt)
        return (
          (registeredAt.isAfter(from) || registeredAt.isSame(from, 'day')) &&
          (registeredAt.isBefore(to) || registeredAt.isSame(to, 'day'))
        )
      })
    }
  }

  return list.sort((a, b) => b.displayNo - a.displayNo)
}

const tanstackColumns: ColumnDef<AlimtalkTemplateRow>[] = [{ accessorKey: 'id', header: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<AlimtalkTemplatePendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'kakaoApprovalStatus',
    paramKey: `${URL_PREFIX}_appr`,
    condition: f => f.kakaoApprovalStatus !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'templateUsageStatus',
    paramKey: `${URL_PREFIX}_usage`,
    condition: f => f.templateUsageStatus !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'channelName',
    paramKey: `${URL_PREFIX}_ch`,
    condition: f => f.channelName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'templateName',
    paramKey: `${URL_PREFIX}_name`,
    condition: f => f.templateName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      nextParams.delete(`${URL_PREFIX}_from`)
      nextParams.delete(`${URL_PREFIX}_to`)
      const range = filters.dateRange
      if (range?.[0] && range[1]) {
        nextParams.set(`${URL_PREFIX}_from`, range[0].format('YYYY-MM-DD'))
        nextParams.set(`${URL_PREFIX}_to`, range[1].format('YYYY-MM-DD'))
      }
    },
  },
]

const defaultDateRange: [Dayjs, Dayjs] = [dayjs('2025-09-15'), dayjs('2026-01-30')]

export const alimtalkTemplateTablePageConfig: TablePageConfig<
  AlimtalkTemplateRow,
  AlimtalkTemplatePendingFilters,
  AlimtalkTemplateTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<AlimtalkTemplateRow> => [],
  },

  filters: {
    initialPending: {
      kakaoApprovalStatus: 'ALL',
      templateUsageStatus: 'ALL',
      channelName: '',
      templateName: '',
      dateRange: defaultDateRange,
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const kakaoApprovalStatus = parseApprovalStatus(searchParams.get(`${URL_PREFIX}_appr`))
      const templateUsageStatus = parseUsageStatus(searchParams.get(`${URL_PREFIX}_usage`))
      const channelName = searchParams.get(`${URL_PREFIX}_ch`) ?? ''
      const templateName = searchParams.get(`${URL_PREFIX}_name`) ?? ''
      const fromStr = searchParams.get(`${URL_PREFIX}_from`)
      const toStr = searchParams.get(`${URL_PREFIX}_to`)

      let dateRange: [Dayjs | null, Dayjs | null] | null = defaultDateRange
      if (fromStr && toStr) {
        const from = dayjs(fromStr)
        const to = dayjs(toStr)
        if (from.isValid() && to.isValid()) {
          dateRange = [from, to]
        }
      } else if (!fromStr && !toStr) {
        dateRange = defaultDateRange
      } else {
        dateRange = null
      }

      setPendingFilters(prev => {
        if (
          prev.kakaoApprovalStatus === kakaoApprovalStatus &&
          prev.templateUsageStatus === templateUsageStatus &&
          prev.channelName === channelName &&
          prev.templateName === templateName &&
          ((prev.dateRange === null && dateRange === null) ||
            (prev.dateRange?.[0]?.valueOf() === dateRange?.[0]?.valueOf() &&
              prev.dateRange?.[1]?.valueOf() === dateRange?.[1]?.valueOf()))
        ) {
          return prev
        }
        return {
          kakaoApprovalStatus,
          templateUsageStatus,
          channelName,
          templateName,
          dateRange,
        }
      })
    },

    hasActiveFilters: ({ searchParams }) => {
      const appr = searchParams.get(`${URL_PREFIX}_appr`)
      if (appr && appr !== 'ALL') return true
      const usage = searchParams.get(`${URL_PREFIX}_usage`)
      if (usage && usage !== 'ALL') return true
      if ((searchParams.get(`${URL_PREFIX}_ch`) ?? '').trim()) return true
      if ((searchParams.get(`${URL_PREFIX}_name`) ?? '').trim()) return true
      if (searchParams.get(`${URL_PREFIX}_from`) && searchParams.get(`${URL_PREFIX}_to`)) {
        return true
      }
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => ({
      ...prev,
      [key]: value,
    }),
  },

  filterFn: ({ data, searchParams }) => {
    const filtered = filterRowsBySearchParams(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
