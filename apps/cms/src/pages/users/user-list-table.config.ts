import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { User, UserRole } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import {
  DEFAULT_MEMBER_LIST_KIND,
  memberListKindToPendingRole,
  memberListKindToUserRole,
  normalizeMemberListKind,
  pendingRoleToMemberListKind,
  resolveRoleFilterFromMemberListParams,
  type MemberListKind,
} from '@/shared/config/member-list-kinds'
import { parseLegacyRoleFilterParam } from '@/features/user/api/map-member-role'
import {
  accountTypeForDirectoryRoleFilter,
  instructorListRolesExactAnyOf,
  parseAllTabRoleFilterParam,
  rolesExactAnyOfForAllTabRoleFilter,
  type AllTabRoleFilterValue,
} from '@/features/user/api/map-roles-exact-any-of'
import {
  INSTITUTION_SIDO_VALUES,
  LEGACY_INSTITUTION_LOCATION_TO_SIDO_SIGUNGU,
  buildInstitutionLocationFilterToken,
} from '@/shared/config/institution-address-region-data'

export type UserListRow = Omit<User, 'password'>

export type UserListQueryParams = Record<string, string | undefined> & {
  kind?: string
  role?: UserRole | AllTabRoleFilterValue | 'ALL'
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
  /** @deprecated 구 북마크 호환 — `jaEvaluationGrade`로 이관 */
  instructorType?: string
  jaEvaluationGrade?: string
  settlementStatus?: string
  adminPermissionVariant?: string
}

export type UserListApiFilters = {
  role?: UserRole
  /** 전체 회원 탭 — `GET /api/admin/members/all` */
  listAllAccounts?: boolean
  search?: string
  createdAtFrom?: string
  createdAtTo?: string
  /** 학교 목록 API — 시/도 */
  regionSido?: string
  /** 학교 목록 API — 시/군/구 */
  regionSigungu?: string
  /** mock·레거시 호환 — remote institutions는 region* 사용 */
  institutionLocation?: string
  jaEvaluationGrade?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
  /** `listMembers` exact-set allowlist 직렬화 */
  rolesExactAnyOf?: string
  /** 전체 회원 디렉터리 — MEMBER / ADMIN_ACCOUNT */
  accountType?: 'MEMBER' | 'ADMIN_ACCOUNT'
  /** 전체 회원 탭 유형 필터 — `/members/all` 클라이언트 매칭용 */
  allTabRoleFilter?: AllTabRoleFilterValue | 'ALL'
}

export type UserListPendingFilters = {
  search: string
  role: AllTabRoleFilterValue | UserRole | 'ALL'
  institutionSido: string
  institutionSigungu: string
  jaEvaluationGrade: string
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
  jaEvaluationGrade?: string
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

export function pendingRoleFromParams(
  params: UserListQueryParams
): AllTabRoleFilterValue | UserRole | 'ALL' {
  const kind =
    params.kind !== undefined && params.kind !== ''
      ? normalizeMemberListKind(params.kind)
      : DEFAULT_MEMBER_LIST_KIND

  if (kind === 'all') {
    return parseAllTabRoleFilterParam(params.role)
  }

  return memberListKindToPendingRole(kind)
}

export function pendingToApiFilters(
  pending: Pick<
    UserListPendingFilters,
    | 'search'
    | 'institutionSido'
    | 'institutionSigungu'
    | 'jaEvaluationGrade'
    | 'settlementStatus'
    | 'adminPermissionVariant'
    | 'createdAtRange'
  >,
  listKind: MemberListKind
): Omit<UserListApiFilters, 'role' | 'rolesExactAnyOf'> {
  const api: Omit<UserListApiFilters, 'role' | 'rolesExactAnyOf'> = {}
  if (pending.search) api.search = pending.search
  if (listKind === 'institutions') {
    const s = pending.institutionSido.trim()
    const g = pending.institutionSigungu.trim()
    if (s) api.regionSido = s
    if (g) api.regionSigungu = g
    const loc = buildInstitutionLocationFilterToken(s, g).trim()
    if (loc) api.institutionLocation = loc
  }
  if (listKind === 'instructors') {
    const grade = pending.jaEvaluationGrade.trim()
    if (grade) api.jaEvaluationGrade = grade
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
    if (institutionSido) api.regionSido = institutionSido
    if (institutionSigungu) api.regionSigungu = institutionSigungu
    const loc = buildInstitutionLocationFilterToken(institutionSido, institutionSigungu).trim()
    if (loc) api.institutionLocation = loc
  }
  if (kind === 'instructors') {
    const grade = (params.jaEvaluationGrade ?? params.instructorType)?.trim()
    if (grade) api.jaEvaluationGrade = grade
    const ss = params.settlementStatus?.trim()
    if (ss) api.settlementStatus = ss
    api.rolesExactAnyOf = instructorListRolesExactAnyOf()
  }
  if (kind === 'admins') {
    const apv = parseAdminPermissionVariantParam(params.adminPermissionVariant)
    if (apv) api.adminPermissionVariant = apv
  }
  if (kind === 'individual') {
    api.rolesExactAnyOf = rolesExactAnyOfForAllTabRoleFilter('INDIVIDUAL')
  }
  if (kind === 'all') {
    api.listAllAccounts = true
    const allTabRole = parseAllTabRoleFilterParam(params.role)
    api.allTabRoleFilter = allTabRole
    const accountType = accountTypeForDirectoryRoleFilter(allTabRole)
    if (accountType) api.accountType = accountType
    return api
  }
  const role = resolveRoleFilterFromMemberListParams({
    kind: params.kind,
    role: params.role,
  })
  return {
    ...api,
    ...(role ? { role } : {}),
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
    jaEvaluationGrade:
      kind === 'instructors'
        ? (params.jaEvaluationGrade ?? params.instructorType ?? '').trim()
        : '',
    settlementStatus: kind === 'instructors' ? (params.settlementStatus ?? '').trim() : '',
    adminPermissionVariant:
      kind === 'admins' ? parseAdminPermissionVariantParam(params.adminPermissionVariant) : '',
    createdAtRange,
  }
}

export function applyUserListSearchToParams(
  nextParams: URLSearchParams,
  filters: UserListPendingFilters
): void {
  const currentKind = normalizeMemberListKind(nextParams.get('kind'))
  const stayOnAllList = currentKind === 'all'
  const nextKind = stayOnAllList
    ? 'all'
    : normalizeMemberListKind(pendingRoleToMemberListKind(filters.role))

  if (filters.search?.trim()) nextParams.set('search', filters.search.trim())
  else nextParams.delete('search')

  nextParams.set('kind', nextKind)

  if (nextKind === 'all') {
    if (filters.role && filters.role !== 'ALL') nextParams.set('role', filters.role)
    else nextParams.delete('role')
  } else {
    nextParams.delete('role')
  }

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
    nextParams.delete('instructorType')
    const grade = filters.jaEvaluationGrade.trim()
    if (grade) nextParams.set('jaEvaluationGrade', grade)
    else nextParams.delete('jaEvaluationGrade')
    const ss = filters.settlementStatus.trim()
    if (ss) nextParams.set('settlementStatus', ss)
    else nextParams.delete('settlementStatus')
  } else {
    nextParams.delete('instructorType')
    nextParams.delete('jaEvaluationGrade')
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
        jaEvaluationGrade: '',
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
        if (key === 'jaEvaluationGrade' || key === 'settlementStatus') {
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
      afterApplyParams: (nextParams, filters) => {
        const nextKind = normalizeMemberListKind(nextParams.get('kind'))
        const api = pendingToApiFilters(filters, nextKind)
        const roleForStore =
          nextKind === 'all'
            ? parseLegacyRoleFilterParam(filters.role === 'ALL' ? undefined : filters.role)
            : memberListKindToUserRole(nextKind)
        opts.setFilters({ ...api, role: roleForStore })
      },
    }),
  }
}
