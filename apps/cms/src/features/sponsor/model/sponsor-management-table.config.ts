import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { SponsorOrganizationKind, SponsorSponsorshipStatus } from '@/types/domain'
import { parseSponsorSponsorshipStatusFilter } from '@/features/sponsor/model/sponsorship-status'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import {
  filterSponsorsBySponsorshipStartDateRange,
  writeSponsorshipStartDateRangeToSearchParams,
} from '@/features/sponsor/api/sponsor-filter-params'
import type {
  SponsorManagementDateRange,
  SponsorManagementPendingFilters,
  SponsorManagementRow,
  SponsorManagementTableContext,
} from './sponsor-management.types'

function parseKind(raw: string | null): SponsorOrganizationKind {
  if (raw === 'foundation') return 'foundation'
  return 'corporate'
}

function parseStatus(raw: string | null): 'ALL' | SponsorSponsorshipStatus {
  return parseSponsorSponsorshipStatusFilter(raw)
}

function dayjsPairEqual(a: SponsorManagementDateRange, b: SponsorManagementDateRange): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return (
    (a[0]?.valueOf() ?? null) === (b[0]?.valueOf() ?? null) &&
    (a[1]?.valueOf() ?? null) === (b[1]?.valueOf() ?? null)
  )
}

function normalizeDateRangePickerValue(value: unknown): SponsorManagementDateRange {
  if (!Array.isArray(value) || value.length < 2) return null
  const start = (value[0] ?? null) as Dayjs | null
  const end = (value[1] ?? null) as Dayjs | null
  if (start == null && end == null) return null
  return [start, end]
}

const urlDateRangeSyncState = { hadCompleteInUrl: false }

function resolvePendingDateRangeFromUrl(args: {
  from: string | null
  to: string | null
  prev: SponsorManagementDateRange
}): SponsorManagementDateRange {
  const { from, to, prev } = args
  const fromKey = from?.trim() || null
  const toKey = to?.trim() || null
  if (fromKey || toKey) {
    urlDateRangeSyncState.hadCompleteInUrl = true
    const start = dayjs(fromKey ?? toKey!)
    const end = dayjs(toKey ?? fromKey!)
    return [start, end]
  }
  if (urlDateRangeSyncState.hadCompleteInUrl) {
    urlDateRangeSyncState.hadCompleteInUrl = false
    return null
  }
  return prev ?? null
}

const tanstackColumns: ColumnDef<SponsorManagementRow>[] = [{ accessorKey: 'id', header: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<SponsorManagementPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'organizationKind',
    paramKey: 'sp_kind',
    condition: () => true,
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'sponsorName',
    paramKey: 'sp_name',
    condition: f => (f.sponsorName ?? '').trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'managerName',
    paramKey: 'sp_mgr',
    condition: f => (f.managerName ?? '').trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sponsorshipStatus',
    paramKey: 'sp_st',
    condition: f => f.sponsorshipStatus !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'apply',
    apply: (nextParams, filters) => {
      writeSponsorshipStartDateRangeToSearchParams(
        nextParams,
        filters.sponsorshipStartDateRange
      )
    },
  },
]

export const sponsorManagementTablePageConfig: TablePageConfig<
  SponsorManagementRow,
  SponsorManagementPendingFilters,
  SponsorManagementTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<SponsorManagementRow> => [],
  },

  filters: {
    initialPending: {
      organizationKind: 'corporate',
      sponsorName: '',
      managerName: '',
      sponsorshipStatus: 'ALL',
      sponsorshipStartDateRange: null,
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const organizationKind = parseKind(searchParams.get('sp_kind'))
      const sponsorName = searchParams.get('sp_name') ?? ''
      const managerName = searchParams.get('sp_mgr') ?? ''
      const sponsorshipStatus = parseStatus(searchParams.get('sp_st'))
      const from = searchParams.get('sp_from')
      const to = searchParams.get('sp_to')

      setPendingFilters(prev => {
        const sponsorshipStartDateRange = resolvePendingDateRangeFromUrl({
          from,
          to,
          prev: prev.sponsorshipStartDateRange,
        })
        if (
          prev.organizationKind === organizationKind &&
          prev.sponsorName === sponsorName &&
          prev.managerName === managerName &&
          prev.sponsorshipStatus === sponsorshipStatus &&
          dayjsPairEqual(prev.sponsorshipStartDateRange, sponsorshipStartDateRange)
        ) {
          return prev
        }
        return {
          organizationKind,
          sponsorName,
          managerName,
          sponsorshipStatus,
          sponsorshipStartDateRange,
        }
      })
    },

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'sponsorshipStartDateRange') {
        return { ...prev, sponsorshipStartDateRange: normalizeDateRangePickerValue(value) }
      }
      return { ...prev, [key]: value }
    },

    hasActiveFilters: ({ searchParams }) => {
      if (parseKind(searchParams.get('sp_kind')) !== 'corporate') return true
      if ((searchParams.get('sp_name') ?? '').trim()) return true
      if ((searchParams.get('sp_mgr') ?? '').trim()) return true
      if (parseStatus(searchParams.get('sp_st')) !== 'ALL') return true
      if ((searchParams.get('sp_from') ?? '').trim() || (searchParams.get('sp_to') ?? '').trim()) {
        return true
      }
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,
  },

  /** 구분·상태 등은 서버. 후원 시작일은 BE 갭 동안 클라 보조 필터 */
  filterFn: ({ data, searchParams }) => {
    const filtered = filterSponsorsBySponsorshipStartDateRange(
      data,
      searchParams.get('sp_from'),
      searchParams.get('sp_to')
    )
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (_context: SponsorManagementTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
