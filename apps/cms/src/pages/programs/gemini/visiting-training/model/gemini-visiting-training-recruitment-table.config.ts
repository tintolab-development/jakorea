import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  GeminiVisitingTrainingRecruitmentRow,
  GeminiVisitingTrainingRecruitmentStatus,
} from './gemini-visiting-training-types'

export type GeminiVisitingTrainingRecruitmentTableContext = Record<string, never>

type StatusFilter = GeminiVisitingTrainingRecruitmentStatus | 'ALL'

export type GeminiVisitingTrainingRecruitmentPendingFilters = {
  title: string
  status: StatusFilter
  trainingRequestPeriodRange: [Dayjs | null, Dayjs | null] | null
}

const URL_PREFIX = 'gvt'

function parseStatus(raw: string | null): StatusFilter {
  if (!raw || raw === 'ALL') return 'ALL'
  if (raw === 'SCHEDULED' || raw === 'IN_PROGRESS' || raw === 'ENDED') return raw
  return 'ALL'
}

function filterRowsBySearchParams(
  data: GeminiVisitingTrainingRecruitmentRow[],
  searchParams: URLSearchParams
): GeminiVisitingTrainingRecruitmentRow[] {
  const titleQ = (searchParams.get(`${URL_PREFIX}_title`) ?? '').trim().toLowerCase()
  const status = parseStatus(searchParams.get(`${URL_PREFIX}_status`))
  const fromStr = searchParams.get(`${URL_PREFIX}_from`)
  const toStr = searchParams.get(`${URL_PREFIX}_to`)

  let list = [...data]
  if (titleQ) {
    list = list.filter(r => r.title.toLowerCase().includes(titleQ))
  }
  if (status !== 'ALL') {
    list = list.filter(r => r.status === status)
  }
  if (fromStr && toStr) {
    const from = dayjs(fromStr).startOf('day')
    const to = dayjs(toStr).endOf('day')
    if (from.isValid() && to.isValid()) {
      list = list.filter(r => {
        const start = dayjs(r.trainingRequestPeriodStart)
        const end = dayjs(r.trainingRequestPeriodEnd)
        return (
          (end.isAfter(from) || end.isSame(from, 'day')) &&
          (start.isBefore(to) || start.isSame(to, 'day'))
        )
      })
    }
  }

  return list.sort((a, b) => b.displayNo - a.displayNo)
}

const tanstackColumns: ColumnDef<GeminiVisitingTrainingRecruitmentRow>[] = [
  { accessorKey: 'id', header: 'id' },
]

const searchSyncRules: readonly TableSearchParamRule<GeminiVisitingTrainingRecruitmentPendingFilters>[] =
  [
    {
      kind: 'param',
      filterKey: 'title',
      paramKey: `${URL_PREFIX}_title`,
      condition: f => f.title.trim().length > 0,
      transform: v => String(v).trim(),
    },
    {
      kind: 'param',
      filterKey: 'status',
      paramKey: `${URL_PREFIX}_status`,
      condition: f => f.status !== 'ALL',
      transform: v => String(v),
    },
    {
      kind: 'apply',
      apply: (nextParams, filters) => {
        nextParams.delete(`${URL_PREFIX}_from`)
        nextParams.delete(`${URL_PREFIX}_to`)
        const range = filters.trainingRequestPeriodRange
        if (range?.[0] && range[1]) {
          nextParams.set(`${URL_PREFIX}_from`, range[0].format('YYYY-MM-DD'))
          nextParams.set(`${URL_PREFIX}_to`, range[1].format('YYYY-MM-DD'))
        }
      },
    },
  ]

export const geminiVisitingTrainingRecruitmentTablePageConfig: TablePageConfig<
  GeminiVisitingTrainingRecruitmentRow,
  GeminiVisitingTrainingRecruitmentPendingFilters,
  GeminiVisitingTrainingRecruitmentTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<GeminiVisitingTrainingRecruitmentRow> => [],
  },

  filters: {
    initialPending: {
      title: '',
      status: 'ALL',
      trainingRequestPeriodRange: null,
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const title = searchParams.get(`${URL_PREFIX}_title`) ?? ''
      const status = parseStatus(searchParams.get(`${URL_PREFIX}_status`))
      const fromStr = searchParams.get(`${URL_PREFIX}_from`)
      const toStr = searchParams.get(`${URL_PREFIX}_to`)
      let trainingRequestPeriodRange: [Dayjs | null, Dayjs | null] | null = null
      if (fromStr && toStr) {
        const a = dayjs(fromStr)
        const b = dayjs(toStr)
        if (a.isValid() && b.isValid()) {
          trainingRequestPeriodRange = [a, b]
        }
      }

      setPendingFilters(prev => {
        if (
          prev.title === title &&
          prev.status === status &&
          ((prev.trainingRequestPeriodRange === null && trainingRequestPeriodRange === null) ||
            (prev.trainingRequestPeriodRange?.[0]?.valueOf() ===
              trainingRequestPeriodRange?.[0]?.valueOf() &&
              prev.trainingRequestPeriodRange?.[1]?.valueOf() ===
                trainingRequestPeriodRange?.[1]?.valueOf()))
        ) {
          return prev
        }
        return { title, status, trainingRequestPeriodRange }
      })
    },

    hasActiveFilters: ({ searchParams }) => {
      if ((searchParams.get(`${URL_PREFIX}_title`) ?? '').trim()) return true
      const s = searchParams.get(`${URL_PREFIX}_status`)
      if (s && s !== 'ALL') return true
      if (searchParams.get(`${URL_PREFIX}_from`) && searchParams.get(`${URL_PREFIX}_to`)) {
        return true
      }
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'trainingRequestPeriodRange') {
        return {
          ...prev,
          trainingRequestPeriodRange: value as [Dayjs | null, Dayjs | null] | null,
        }
      }
      return {
        ...prev,
        [key]: value,
      }
    },
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
