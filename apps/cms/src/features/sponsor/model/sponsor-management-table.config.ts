import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { SponsorOrganizationKind, SponsorSponsorshipStatus } from '@/types/domain'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import type {
  SponsorManagementPendingFilters,
  SponsorManagementRow,
  SponsorManagementTableContext,
} from './sponsor-management.types'

function parseKind(raw: string | null): 'ALL' | SponsorOrganizationKind {
  if (raw === 'corporate' || raw === 'foundation' || raw === 'institution') return raw
  return 'ALL'
}

function parseStatus(raw: string | null): 'ALL' | SponsorSponsorshipStatus {
  if (raw === 'active' || raw === 'ended') return raw
  return 'ALL'
}

function filterRows(
  data: SponsorManagementRow[],
  searchParams: URLSearchParams
): SponsorManagementRow[] {
  const kind = parseKind(searchParams.get('sp_kind'))
  const nameQ = (searchParams.get('sp_name') ?? '').trim().toLowerCase()
  const mgrQ = (searchParams.get('sp_mgr') ?? '').trim().toLowerCase()
  const st = parseStatus(searchParams.get('sp_st'))

  return data.filter(row => {
    const rowKind = row.organizationKind ?? 'corporate'
    if (kind !== 'ALL' && rowKind !== kind) return false

    if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

    const mainName = row.managers?.[0]?.name?.toLowerCase() ?? ''
    if (mgrQ && !mainName.includes(mgrQ)) return false

    const rowSt = row.sponsorshipStatus ?? 'active'
    if (st !== 'ALL' && rowSt !== st) return false

    return true
  })
}

const tanstackColumns: ColumnDef<SponsorManagementRow>[] = [{ accessorKey: 'id', header: 'id' }]

const searchSyncRules: readonly TableSearchParamRule<SponsorManagementPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'organizationKind',
    paramKey: 'sp_kind',
    condition: f => f.organizationKind !== 'ALL',
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'sponsorName',
    paramKey: 'sp_name',
    condition: f => f.sponsorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'managerName',
    paramKey: 'sp_mgr',
    condition: f => f.managerName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sponsorshipStatus',
    paramKey: 'sp_st',
    condition: f => f.sponsorshipStatus !== 'ALL',
    transform: v => String(v),
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
      organizationKind: 'ALL',
      sponsorName: '',
      managerName: '',
      sponsorshipStatus: 'ALL',
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const organizationKind = parseKind(searchParams.get('sp_kind'))
      const sponsorName = searchParams.get('sp_name') ?? ''
      const managerName = searchParams.get('sp_mgr') ?? ''
      const sponsorshipStatus = parseStatus(searchParams.get('sp_st'))

      setPendingFilters(prev => {
        if (
          prev.organizationKind === organizationKind &&
          prev.sponsorName === sponsorName &&
          prev.managerName === managerName &&
          prev.sponsorshipStatus === sponsorshipStatus
        ) {
          return prev
        }
        return {
          organizationKind,
          sponsorName,
          managerName,
          sponsorshipStatus,
        }
      })
    },

    hasActiveFilters: ({ searchParams }) => {
      if (parseKind(searchParams.get('sp_kind')) !== 'ALL') return true
      if ((searchParams.get('sp_name') ?? '').trim()) return true
      if ((searchParams.get('sp_mgr') ?? '').trim()) return true
      if (parseStatus(searchParams.get('sp_st')) !== 'ALL') return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,
  },

  filterFn: ({ data, searchParams }) => {
    const filtered = filterRows(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (_context: SponsorManagementTableContext) => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
