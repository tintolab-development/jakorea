import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { User, UserRole } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import {
  memberListKindToPendingRole,
  normalizeMemberListKind,
  pendingRoleToMemberListKind,
  resolveRoleFilterFromMemberListParams,
  type MemberListKind,
} from '@/shared/config/member-list-kinds'
import {
  INSTITUTION_SIDO_VALUES,
  LEGACY_INSTITUTION_LOCATION_TO_SIDO_SIGUNGU,
  buildInstitutionLocationFilterToken,
} from '@/shared/config/institution-address-region-data'

export type UserListRow = Omit<User, 'password'>

export type UserListQueryParams = Record<string, string | undefined> & {
  kind?: string
  role?: UserRole | 'ALL'
  search?: string
  id?: string
  lnb?: string
  programsChild?: string
  createdAtFrom?: string
  createdAtTo?: string
  /** @deprecated 구 북마크 호환용. 신규는 `institutionSido`·`institutionSigungu` */
  institutionLocation?: string
  institutionSido?: string
  institutionSigungu?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: string
}

export type UserListApiFilters = {
  role?: UserRole
  search?: string
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  instructorListPureOnly?: boolean
}

export type UserListPendingFilters = {
  search: string
  role: UserRole | 'ALL'
  institutionSido: string
  institutionSigungu: string
  instructorType: string
  settlementStatus: string
  adminPermissionVariant: string
  createdAtRange: [Dayjs | null, Dayjs | null] | null
}

export type UserListTableContext = Record<string, never>

export type UserListStoreFilters = Partial<{
  role?: UserRole
  search?: string
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  instructorType?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
}>

export function parseUserListQueryParams(searchParams: URLSearchParams): UserListQueryParams {
  const o: UserListQueryParams = {} as UserListQueryParams
  searchParams.forEach((value, key) => {
    o[key as keyof UserListQueryParams] = value as never
  })
  return o
}

export function parseAdminPermissionVariantParam(raw: string | undefined): AdminPermissionTagVariant | '' {
  if (!raw || raw === 'ALL') return ''
  if (raw === 'manager' || raw === 'partner' || raw === 'viewer') return raw
  return ''
}

const INSTITUTION_SIDO_SET = new Set<string>(INSTITUTION_SIDO_VALUES as unknown as string[])

/** URL 쿼리 → 시/도·시/군/구 (구형 `institutionLocation` 단일 값 호환) */
export function parseInstitutionRegionFromUserListParams(params: UserListQueryParams): {
  institutionSido: string
  institutionSigungu: string
} {
  const kind = normalizeMemberListKind(params.kind)
  if (kind !== 'institutions') return { institutionSido: '', institutionSigungu: '' }

  const s0 = (params.institutionSido ?? '').trim()
  const g0 = (params.institutionSigungu ?? '').trim()
  if (s0 || g0) return { institutionSido: s0, institutionSigungu: g0 }

  const legacy = (params.institutionLocation ?? '').trim()
  if (!legacy) return { institutionSido: '', institutionSigungu: '' }

  if (INSTITUTION_SIDO_SET.has(legacy)) return { institutionSido: legacy, institutionSigungu: '' }

  for (const sido of INSTITUTION_SIDO_VALUES) {
    if (legacy.startsWith(`${sido} `)) {
      return { institutionSido: sido, institutionSigungu: legacy.slice(sido.length + 1).trim() }
    }
  }

  const mapped = LEGACY_INSTITUTION_LOCATION_TO_SIDO_SIGUNGU[legacy]
  if (mapped) return { institutionSido: mapped[0], institutionSigungu: mapped[1] }

  return { institutionSido: '', institutionSigungu: '' }
}

export function pendingRoleFromParams(params: UserListQueryParams): UserRole | 'ALL' {
  if (params.kind !== undefined && params.kind !== '') {
    return memberListKindToPendingRole(normalizeMemberListKind(params.kind))
  }
  if (params.role && params.role !== 'ALL') {
    return params.role as UserRole
  }
  return 'ALL'
}

export function pendingToApiFilters(
  pending: Pick<
    UserListPendingFilters,
    | 'search'
    | 'institutionSido'
    | 'institutionSigungu'
    | 'instructorType'
    | 'settlementStatus'
    | 'adminPermissionVariant'
    | 'createdAtRange'
  >,
  listKind: MemberListKind
): Omit<UserListApiFilters, 'role' | 'instructorListPureOnly'> {
  const api: Omit<UserListApiFilters, 'role' | 'instructorListPureOnly'> = {}
  if (pending.search) api.search = pending.search
  if (listKind === 'institutions') {
    const loc = buildInstitutionLocationFilterToken(pending.institutionSido, pending.institutionSigungu).trim()
    if (loc) api.institutionLocation = loc
  }
  if (listKind === 'instructors') {
    const it = pending.instructorType.trim()
    if (it) api.instructorType = it
    const ss = pending.settlementStatus.trim()
    if (ss) api.settlementStatus = ss
  }
  if (listKind === 'admins') {
    const v = pending.adminPermissionVariant.trim()
    if (v === 'manager' || v === 'partner' || v === 'viewer') {
      api.adminPermissionVariant = v
    }
  }
  if (pending.createdAtRange?.[0] && pending.createdAtRange[1]) {
    api.createdAtFrom = pending.createdAtRange[0].format('YYYY-MM-DD')
    api.createdAtTo = pending.createdAtRange[1].format('YYYY-MM-DD')
  }
  return api
}

export function buildListQueryApiFilters(params: UserListQueryParams): UserListApiFilters {
  const kind = normalizeMemberListKind(params.kind)
  const api: UserListApiFilters = {}
  if (params.search) api.search = params.search
  const from = params.createdAtFrom
  const to = params.createdAtTo
  if (from && to) {
    api.createdAtFrom = from
    api.createdAtTo = to
  }
  if (kind === 'institutions') {
    const { institutionSido, institutionSigungu } = parseInstitutionRegionFromUserListParams(params)
    const loc = buildInstitutionLocationFilterToken(institutionSido, institutionSigungu).trim()
    if (loc) api.institutionLocation = loc
  }
  if (kind === 'instructors') {
    const it = params.instructorType?.trim()
    if (it) api.instructorType = it
    const ss = params.settlementStatus?.trim()
    if (ss) api.settlementStatus = ss
  }
  if (kind === 'admins') {
    const apv = parseAdminPermissionVariantParam(params.adminPermissionVariant)
    if (apv) api.adminPermissionVariant = apv
  }
  const role = resolveRoleFilterFromMemberListParams({
    kind: params.kind,
    role: params.role,
  })
  return {
    ...api,
    ...(role ? { role } : {}),
    ...(kind === 'instructors' ? { instructorListPureOnly: true as const } : {}),
  }
}

export function userListPendingFiltersFromParams(params: UserListQueryParams): UserListPendingFilters {
  const from = params.createdAtFrom
  const to = params.createdAtTo
  let createdAtRange: [Dayjs | null, Dayjs | null] | null = null
  if (from && to) {
    const start = dayjs(from)
    const end = dayjs(to)
    if (start.isValid() && end.isValid()) createdAtRange = [start, end]
  }
  const kind = normalizeMemberListKind(params.kind)
  const region =
    kind === 'institutions' ? parseInstitutionRegionFromUserListParams(params) : { institutionSido: '', institutionSigungu: '' }
  return {
    search: params.search || '',
    role: pendingRoleFromParams(params),
    institutionSido: region.institutionSido,
    institutionSigungu: region.institutionSigungu,
    instructorType: kind === 'instructors' ? (params.instructorType ?? '').trim() : '',
    settlementStatus: kind === 'instructors' ? (params.settlementStatus ?? '').trim() : '',
    adminPermissionVariant:
      kind === 'admins' ? parseAdminPermissionVariantParam(params.adminPermissionVariant) : '',
    createdAtRange,
  }
}

function applyUserListSearchToParams(nextParams: URLSearchParams, filters: UserListPendingFilters): void {
  const nextKind = normalizeMemberListKind(pendingRoleToMemberListKind(filters.role))

  if (filters.search?.trim()) nextParams.set('search', filters.search.trim())
  else nextParams.delete('search')

  nextParams.set('kind', nextKind)
  nextParams.delete('role')

  if (nextKind === 'institutions') {
    nextParams.delete('institutionLocation')
    const s = filters.institutionSido.trim()
    const g = filters.institutionSigungu.trim()
    if (s) nextParams.set('institutionSido', s)
    else nextParams.delete('institutionSido')
    if (g) nextParams.set('institutionSigungu', g)
    else nextParams.delete('institutionSigungu')
  } else {
    nextParams.delete('institutionLocation')
    nextParams.delete('institutionSido')
    nextParams.delete('institutionSigungu')
  }

  if (nextKind === 'instructors') {
    const it = filters.instructorType.trim()
    if (it) nextParams.set('instructorType', it)
    else nextParams.delete('instructorType')
    const ss = filters.settlementStatus.trim()
    if (ss) nextParams.set('settlementStatus', ss)
    else nextParams.delete('settlementStatus')
  } else {
    nextParams.delete('instructorType')
    nextParams.delete('settlementStatus')
  }

  if (nextKind === 'admins') {
    const apv = filters.adminPermissionVariant.trim()
    if (apv === 'manager' || apv === 'partner' || apv === 'viewer') {
      nextParams.set('adminPermissionVariant', apv)
    } else {
      nextParams.delete('adminPermissionVariant')
    }
  } else {
    nextParams.delete('adminPermissionVariant')
  }

  if (filters.createdAtRange?.[0] && filters.createdAtRange[1]) {
    nextParams.set('createdAtFrom', filters.createdAtRange[0].format('YYYY-MM-DD'))
    nextParams.set('createdAtTo', filters.createdAtRange[1].format('YYYY-MM-DD'))
  } else {
    nextParams.delete('createdAtFrom')
    nextParams.delete('createdAtTo')
  }
}

const userListTanstackColumns: ColumnDef<UserListRow>[] = [
  { accessorKey: 'id', header: 'id' },
  { accessorKey: 'name', header: 'name' },
]

export function createUserListTablePageConfig(opts: {
  setFilters: (filters: UserListStoreFilters) => void
}): TablePageConfig<UserListRow, UserListPendingFilters, UserListTableContext> {
  const paramConfig: readonly TableSearchParamRule<UserListPendingFilters>[] = [
    {
      kind: 'apply',
      apply: (nextParams, filters) => {
        applyUserListSearchToParams(nextParams, filters)
      },
    },
  ]

  return {
    columns: {
      tanstack: userListTanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<UserListRow> => [],
    },
    filters: {
      initialPending: {
        search: '',
        role: 'ALL',
        institutionSido: '',
        institutionSigungu: '',
        instructorType: '',
        settlementStatus: '',
        adminPermissionVariant: '',
        createdAtRange: null,
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
        const parsed = parseUserListQueryParams(searchParams)
        setPendingFilters(userListPendingFiltersFromParams(parsed))
      },
      hasActiveFilters: () => false,
      getBaseCount: ({ filteredData }) => filteredData.length,
      onFilterChange: ({ prev, key, value }) => {
        if (key === 'createdAtRange') {
          return { ...prev, createdAtRange: value as [Dayjs | null, Dayjs | null] | null }
        }
        if (key === 'institutionSido') {
          return {
            ...prev,
            institutionSido: value === undefined || value === null ? '' : String(value),
            institutionSigungu: '',
          }
        }
        if (key === 'institutionSigungu') {
          return {
            ...prev,
            institutionSigungu: value === undefined || value === null ? '' : String(value),
          }
        }
        if (key === 'instructorType' || key === 'settlementStatus') {
          return {
            ...prev,
            [key]: value === undefined || value === null ? '' : String(value),
          }
        }
        if (key === 'adminPermissionVariant') {
          return {
            ...prev,
            adminPermissionVariant: value === undefined || value === null ? '' : String(value),
          }
        }
        return { ...prev, [key]: value }
      },
    },
    filterFn: ({ data }) => ({
      dataForTable: data,
      filteredData: data,
    }),
    getSearchSync: () => ({
      paramConfig,
      tableConfig: {},
      afterApplyParams: (_nextParams, filters) => {
        const nextKind = normalizeMemberListKind(pendingRoleToMemberListKind(filters.role))
        const api = pendingToApiFilters(filters, nextKind)
        const roleForStore = filters.role === 'ALL' ? undefined : (filters.role as UserRole)
        opts.setFilters({ ...api, role: roleForStore })
      },
    }),
  }
}
