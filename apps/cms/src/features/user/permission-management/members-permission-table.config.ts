import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'
import type { UserRole } from '@/types/user'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

export type MembersPermissionTableContext = {
  memberType: 'instructor' | 'admin'
  /** remote 목록 — keyword·승인현황은 서버 필터, 클라이언트 filterFn에서 제외 */
  remoteEnabled?: boolean
}

type ApprovalStatusFilter = MemberPermissionApplicationRow['approvalStatus'] | 'ALL'

export type MembersPermissionPendingFilters = {
  search: string
  role: UserRole | 'ALL'
  approvalStatus: ApprovalStatusFilter
  createdAtRange: [Dayjs | null, Dayjs | null] | null
}

const USER_ROLES: readonly UserRole[] = ['INDIVIDUAL', 'SCHOOL', 'INSTRUCTOR', 'ADMIN']

function urlPrefix(memberType: MembersPermissionTableContext['memberType']): string {
  return memberType === 'instructor' ? 'permI' : 'permA'
}

function parseRole(raw: string | null): UserRole | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL'
  if (USER_ROLES.includes(raw as UserRole)) return raw as UserRole
  return 'ALL'
}

function parseApproval(raw: string | null): ApprovalStatusFilter {
  if (!raw || raw === 'ALL') return 'ALL'
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw
  return 'ALL'
}

const tanstackColumns: ColumnDef<MemberPermissionApplicationRow>[] = [
  { accessorKey: 'id', header: 'id' },
]

function filterRowsBySearchParams(
  data: MemberPermissionApplicationRow[],
  searchParams: URLSearchParams,
  memberType: MembersPermissionTableContext['memberType'],
  remoteEnabled?: boolean
): MemberPermissionApplicationRow[] {
  const p = urlPrefix(memberType)
  const q = (searchParams.get(`${p}_search`) ?? '').trim().toLowerCase()
  const role =
    memberType === 'admin' ? 'ALL' : parseRole(searchParams.get(`${p}_role`))
  const approvalStatus = parseApproval(searchParams.get(`${p}_approval`))
  const fromStr = searchParams.get(`${p}_from`)
  const toStr = searchParams.get(`${p}_to`)

  let list = data
  if (!remoteEnabled && q) {
    list = list.filter(r => r.name.toLowerCase().includes(q))
  }
  if (role !== 'ALL') {
    list = list.filter(r => r.memberCategory === role)
  }
  if (!remoteEnabled && approvalStatus !== 'ALL') {
    list = list.filter(r => r.approvalStatus === approvalStatus)
  }
  if (fromStr || toStr) {
    const from = fromStr ? dayjs(fromStr).startOf('day') : null
    const to = toStr ? dayjs(toStr).endOf('day') : null
    list = list.filter(r => {
      const d = dayjs(r.appliedAt)
      if (!d.isValid()) return false
      if (from?.isValid() && d.isBefore(from, 'day')) return false
      if (to?.isValid() && d.isAfter(to, 'day')) return false
      return true
    })
  }
  return list
}

const searchSyncRules = (
  memberType: MembersPermissionTableContext['memberType']
): readonly TableSearchParamRule<MembersPermissionPendingFilters>[] => {
  const p = urlPrefix(memberType)
  const roleParamRule: TableSearchParamRule<MembersPermissionPendingFilters> = {
    kind: 'param',
    filterKey: 'role',
    paramKey: `${p}_role`,
    condition: f => f.role !== 'ALL',
    transform: v => String(v),
  }
  const baseRules: TableSearchParamRule<MembersPermissionPendingFilters>[] = [
    {
      kind: 'param',
      filterKey: 'search',
      paramKey: `${p}_search`,
      condition: f => f.search.trim().length > 0,
      transform: v => String(v).trim(),
    },
    ...(memberType === 'instructor' ? [roleParamRule] : []),
    {
      kind: 'param',
      filterKey: 'approvalStatus',
      paramKey: `${p}_approval`,
      condition: f => f.approvalStatus !== 'ALL',
      transform: v => String(v),
    },
    {
      kind: 'apply',
      apply: (nextParams, filters) => {
        const prefix = urlPrefix(memberType)
        if (memberType === 'admin') {
          nextParams.delete(`${prefix}_role`)
        }
        const range = filters.createdAtRange
        const from = range?.[0]
        const to = range?.[1]
        if (from) nextParams.set(`${prefix}_from`, from.format('YYYY-MM-DD'))
        else nextParams.delete(`${prefix}_from`)
        if (to) nextParams.set(`${prefix}_to`, to.format('YYYY-MM-DD'))
        else nextParams.delete(`${prefix}_to`)
      },
    },
  ]
  return baseRules
}

/** 탭별(inst/admin)로 쿼리 키가 분리되어 동시 마운트 시에도 URL이 충돌하지 않는다. */
export const membersPermissionTablePageConfig: TablePageConfig<
  MemberPermissionApplicationRow,
  MembersPermissionPendingFilters,
  MembersPermissionTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<MemberPermissionApplicationRow> => [],
  },

  filters: {
    initialPending: {
      search: '',
      role: 'ALL',
      approvalStatus: 'ALL',
      createdAtRange: null,
    },

    syncPendingFromUrl: ({ context, searchParams, setPendingFilters, table: _t, columnFilters: _cf }) => {
      const p = urlPrefix(context.memberType)
      const search = searchParams.get(`${p}_search`) ?? ''
      const role =
        context.memberType === 'admin' ? 'ALL' : parseRole(searchParams.get(`${p}_role`))
      const approvalStatus = parseApproval(searchParams.get(`${p}_approval`))
      const fromStr = searchParams.get(`${p}_from`)
      const toStr = searchParams.get(`${p}_to`)
      let createdAtRange: [Dayjs | null, Dayjs | null] | null = null
      if (fromStr || toStr) {
        const a = fromStr ? dayjs(fromStr) : null
        const b = toStr ? dayjs(toStr) : null
        if ((a == null || a.isValid()) && (b == null || b.isValid())) {
          createdAtRange = [a, b]
        }
      }

      setPendingFilters(prev => {
        if (
          prev.search === search &&
          prev.role === role &&
          prev.approvalStatus === approvalStatus &&
          ((prev.createdAtRange === null && createdAtRange === null) ||
            (prev.createdAtRange?.[0]?.valueOf() === createdAtRange?.[0]?.valueOf() &&
              prev.createdAtRange?.[1]?.valueOf() === createdAtRange?.[1]?.valueOf()))
        ) {
          return prev
        }
        return { search, role, approvalStatus, createdAtRange }
      })
    },

    hasActiveFilters: ({ context, searchParams }) => {
      const p = urlPrefix(context.memberType)
      if ((searchParams.get(`${p}_search`) ?? '').trim()) return true
      if (context.memberType === 'instructor') {
        const r = searchParams.get(`${p}_role`)
        if (r && r !== 'ALL') return true
      }
      const a = searchParams.get(`${p}_approval`)
      if (a && a !== 'ALL') return true
      if (searchParams.get(`${p}_from`) || searchParams.get(`${p}_to`)) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: ({ prev, key, value }) => {
      if (key === 'createdAtRange') {
        return {
          ...prev,
          createdAtRange: value as [Dayjs | null, Dayjs | null] | null,
        }
      }
      return {
        ...prev,
        [key]: value,
      }
    },
  },

  filterFn: ({ context, data, searchParams }) => {
    const filtered = filterRowsBySearchParams(
      data,
      searchParams,
      context.memberType,
      context.remoteEnabled
    )
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: (context: MembersPermissionTableContext) => ({
    paramConfig: searchSyncRules(context.memberType),
    tableConfig: {},
  }),
}