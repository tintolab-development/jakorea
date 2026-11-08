import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type { GeminiRecruitmentDisplayStatus, GeminiRecruitmentRow } from './types'

export type GeminiRecruitmentTableContext = {
  /** `YYYY-MM-DD` — 자정·재마운트 시 필터·건수가 신청 기간 기준 상태로 다시 계산된다 */
  todayKey: string
}

type StatusFilter = GeminiRecruitmentDisplayStatus | 'ALL'

export type GeminiRecruitmentPendingFilters = {
  title: string
  status: StatusFilter
  trainingRequestPeriodRange: [Dayjs | null, Dayjs | null] | null
}

const URL_PREFIX = 'gvt'

export function getDefaultTrainingRequestPeriodRange(
  referenceDate: Dayjs | string = dayjs()
): [Dayjs, Dayjs] {
  const ref = typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate
  return [ref.startOf('year'), ref.startOf('day')]
}

function parseStatus(raw: string | null): StatusFilter {
  if (!raw || raw === 'ALL') return 'ALL'
  if (
    raw === 'SCHEDULED' ||
    raw === 'IN_PROGRESS' ||
    raw === 'ENDED' ||
    raw === 'DRAFT'
  ) {
    return raw
  }
  return 'ALL'
}

const tanstackColumns: ColumnDef<GeminiRecruitmentRow>[] = [{ accessorKey: 'id', header: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<GeminiRecruitmentPendingFilters>[] = [
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
      const range = filters.trainingRequestPeriodRange
      const from = range?.[0]
      const to = range?.[1]
      if (from) nextParams.set(`${URL_PREFIX}_from`, from.format('YYYY-MM-DD'))
      else nextParams.delete(`${URL_PREFIX}_from`)
      if (to) nextParams.set(`${URL_PREFIX}_to`, to.format('YYYY-MM-DD'))
      else nextParams.delete(`${URL_PREFIX}_to`)
    },
  },
]

const [defaultFrom, defaultTo] = getDefaultTrainingRequestPeriodRange()

export const geminiRecruitmentTablePageConfig: TablePageConfig<
  GeminiRecruitmentRow,
  GeminiRecruitmentPendingFilters,
  GeminiRecruitmentTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<GeminiRecruitmentRow> => [],
  },

  filters: {
    initialPending: {
      title: '',
      status: 'ALL',
      trainingRequestPeriodRange: [defaultFrom, defaultTo],
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const title = searchParams.get(`${URL_PREFIX}_title`) ?? ''
      const status = parseStatus(searchParams.get(`${URL_PREFIX}_status`))
      const fromStr = searchParams.get(`${URL_PREFIX}_from`)
      const toStr = searchParams.get(`${URL_PREFIX}_to`)
      let trainingRequestPeriodRange: [Dayjs | null, Dayjs | null] | null = [
        defaultFrom,
        defaultTo,
      ]
      if (fromStr || toStr) {
        const a = fromStr ? dayjs(fromStr) : null
        const b = toStr ? dayjs(toStr) : null
        if ((a == null || a.isValid()) && (b == null || b.isValid())) {
          trainingRequestPeriodRange = [a, b]
        }
      }

      setPendingFilters(prev => {
        if (
          prev.title === title &&
          prev.status === status &&
          prev.trainingRequestPeriodRange?.[0]?.valueOf() ===
            trainingRequestPeriodRange?.[0]?.valueOf() &&
          prev.trainingRequestPeriodRange?.[1]?.valueOf() ===
            trainingRequestPeriodRange?.[1]?.valueOf()
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
      if (searchParams.get(`${URL_PREFIX}_from`) || searchParams.get(`${URL_PREFIX}_to`)) {
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

  // 공고명·상태·연수요청기간은 `GET /recruitments` 쿼리로 보낸다(`list-remote-filters`).
  // 받아 온 페이지를 화면에서 다시 거르면 총 N건과 표 행이 어긋나고 첫 페이지가 비어 보인다.
  filterFn: ({ data }) => ({ dataForTable: data, filteredData: data }),

  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
