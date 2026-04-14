import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'

const P = 'admprg'

export type AdminManagedProgramFilters = {
  title: string
  year: string
  lifecycle: string
  participantType: string
  targetLevel: string
}

export type AdminManagedProgramTableContext = Record<string, never>

const ALL = ''

function participantTypeKey(p: Program): 'school' | 'volunteer' | 'individual' {
  const ls = p.lifecycleStatus
  if (ls === 'recruiting_volunteers' || ls === 'volunteer_recruitment_planned') {
    return 'volunteer'
  }
  if (p.category === 'school') return 'school'
  return 'individual'
}

function yearOfProgram(p: Program): number {
  return new Date(p.startDate).getFullYear()
}

function filterPrograms(
  data: Program[],
  searchParams: URLSearchParams
): Program[] {
  const title = (searchParams.get(`${P}_title`) ?? '').trim()
  const year = searchParams.get(`${P}_year`) ?? ''
  const lifecycle = searchParams.get(`${P}_lifecycle`) ?? ''
  const participantType = searchParams.get(`${P}_ptype`) ?? ''
  const targetLevel = searchParams.get(`${P}_tlevel`) ?? ''

  return data.filter(p => {
    if (title && !p.title.includes(title)) return false
    if (year && String(yearOfProgram(p)) !== year) return false
    if (lifecycle && p.lifecycleStatus !== lifecycle) return false
    if (participantType && participantTypeKey(p) !== participantType) return false
    if (targetLevel && p.targetLevel !== targetLevel) return false
    return true
  })
}

const tanstackColumns: ColumnDef<Program>[] = [{ accessorKey: 'id', header: 'id' }]

const paramRules: readonly TableSearchParamRule<AdminManagedProgramFilters>[] = [
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: `${P}_title`,
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'year',
    paramKey: `${P}_year`,
    condition: f => Boolean(f.year),
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'lifecycle',
    paramKey: `${P}_lifecycle`,
    condition: f => Boolean(f.lifecycle),
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'participantType',
    paramKey: `${P}_ptype`,
    condition: f => Boolean(f.participantType),
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'targetLevel',
    paramKey: `${P}_tlevel`,
    condition: f => Boolean(f.targetLevel),
    transform: v => String(v),
  },
]

export const adminManagedProgramTablePageConfig: TablePageConfig<
  Program,
  AdminManagedProgramFilters,
  AdminManagedProgramTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<Program> => [],
  },
  filters: {
    initialPending: {
      title: '',
      year: ALL,
      lifecycle: ALL,
      participantType: ALL,
      targetLevel: ALL,
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters, table: _t, columnFilters: _c, context: _ctx }) => {
      setPendingFilters(prev => {
        const next: AdminManagedProgramFilters = {
          title: searchParams.get(`${P}_title`) ?? '',
          year: searchParams.get(`${P}_year`) ?? ALL,
          lifecycle: searchParams.get(`${P}_lifecycle`) ?? ALL,
          participantType: searchParams.get(`${P}_ptype`) ?? ALL,
          targetLevel: searchParams.get(`${P}_tlevel`) ?? ALL,
        }
        if (
          prev.title === next.title &&
          prev.year === next.year &&
          prev.lifecycle === next.lifecycle &&
          prev.participantType === next.participantType &&
          prev.targetLevel === next.targetLevel
        ) {
          return prev
        }
        return next
      })
    },
    hasActiveFilters: ({ searchParams }) =>
      Boolean(
        (searchParams.get(`${P}_title`) ?? '').trim() ||
          searchParams.get(`${P}_year`) ||
          searchParams.get(`${P}_lifecycle`) ||
          searchParams.get(`${P}_ptype`) ||
          searchParams.get(`${P}_tlevel`)
      ),
    getBaseCount: ({ filteredData }) => filteredData.length,
    onFilterChange: ({ prev, key, value }) => ({
      ...prev,
      [key]: value === undefined || value === null ? ALL : (value as string),
    }),
  },
  filterFn: ({ data, searchParams }) => {
    const filtered = filterPrograms(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },
  getSearchSync: () => ({
    paramConfig: paramRules,
    tableConfig: {},
  }),
}
