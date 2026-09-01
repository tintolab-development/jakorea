/**
 * 실적 관리 목록 TablePageConfig
 * - URL 쿼리 `er_year / er_q / er_area / er_sido / er_sigungu / er_sponsor / er_main / er_title / er_book / er_org / er_ips / er_etype` 와 동기화
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import { matchesEducationRecordFilter } from '../lib/match-education-record-filter'
import { createEducationRecordColumns } from './education-record-columns'
import type {
  EducationRecordPendingFilters,
  EducationRecordQuarter,
  EducationRecordRow,
  EducationRecordTableContext,
} from './education-record-types'

const PARAM_KEYS = {
  year: 'er_year',
  quarter: 'er_q',
  businessArea: 'er_area',
  sido: 'er_sido',
  sigungu: 'er_sigungu',
  sponsorName: 'er_sponsor',
  mainTitle: 'er_main',
  title: 'er_title',
  textbookName: 'er_book',
  institutionName: 'er_org',
  ips: 'er_ips',
  educationType: 'er_etype',
} as const

const EMPTY_PENDING: EducationRecordPendingFilters = {
  year: '',
  quarter: 'ALL',
  businessArea: '',
  sido: '',
  sigungu: '',
  sponsorName: '',
  mainTitle: '',
  title: '',
  textbookName: '',
  institutionName: '',
  ips: '',
  educationType: '',
}

function parseQuarter(raw: string | null): 'ALL' | EducationRecordQuarter {
  const n = Number(raw)
  if (n === 1 || n === 2 || n === 3 || n === 4) return n
  return 'ALL'
}

function parseYear(raw: string | null): string {
  if (!raw) return ''
  if (!/^\d{4}$/.test(raw)) return ''
  return raw
}

function readFilters(searchParams: URLSearchParams): EducationRecordPendingFilters {
  return {
    year: parseYear(searchParams.get(PARAM_KEYS.year)),
    quarter: parseQuarter(searchParams.get(PARAM_KEYS.quarter)),
    businessArea: searchParams.get(PARAM_KEYS.businessArea) ?? '',
    sido: searchParams.get(PARAM_KEYS.sido) ?? '',
    sigungu: searchParams.get(PARAM_KEYS.sigungu) ?? '',
    sponsorName: searchParams.get(PARAM_KEYS.sponsorName) ?? '',
    mainTitle: searchParams.get(PARAM_KEYS.mainTitle) ?? '',
    title: searchParams.get(PARAM_KEYS.title) ?? '',
    textbookName: searchParams.get(PARAM_KEYS.textbookName) ?? '',
    institutionName: searchParams.get(PARAM_KEYS.institutionName) ?? '',
    ips: searchParams.get(PARAM_KEYS.ips) ?? '',
    educationType: searchParams.get(PARAM_KEYS.educationType) ?? '',
  }
}

function isSamePending(
  a: EducationRecordPendingFilters,
  b: EducationRecordPendingFilters
): boolean {
  return (
    a.year === b.year &&
    a.quarter === b.quarter &&
    a.businessArea === b.businessArea &&
    a.sido === b.sido &&
    a.sigungu === b.sigungu &&
    a.sponsorName === b.sponsorName &&
    a.mainTitle === b.mainTitle &&
    a.title === b.title &&
    a.textbookName === b.textbookName &&
    a.institutionName === b.institutionName &&
    a.ips === b.ips &&
    a.educationType === b.educationType
  )
}

function hasAppliedFilters(filters: EducationRecordPendingFilters): boolean {
  if (filters.year) return true
  if (filters.quarter !== 'ALL') return true
  if (filters.businessArea.trim()) return true
  if (filters.sido.trim()) return true
  if (filters.sigungu.trim()) return true
  if (filters.sponsorName.trim()) return true
  if (filters.mainTitle.trim()) return true
  if (filters.title.trim()) return true
  if (filters.textbookName.trim()) return true
  if (filters.institutionName.trim()) return true
  if (filters.ips.trim()) return true
  if (filters.educationType.trim()) return true
  return false
}

function filterRows(data: EducationRecordRow[], searchParams: URLSearchParams): EducationRecordRow[] {
  const filters = readFilters(searchParams)
  return data.filter(row => matchesEducationRecordFilter(row, filters))
}

const tanstackColumns: ColumnDef<EducationRecordRow>[] = [{ accessorKey: 'id', header: 'id' }]

function textParam(
  filterKey: keyof EducationRecordPendingFilters,
  paramKey: string
): TableSearchParamRule<EducationRecordPendingFilters> {
  return {
    kind: 'param',
    filterKey,
    paramKey,
    condition: f => String(f[filterKey] ?? '').trim().length > 0,
    transform: v => String(v).trim(),
  }
}

const searchSyncRules: readonly TableSearchParamRule<EducationRecordPendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'year',
    paramKey: PARAM_KEYS.year,
    condition: f => !!f.year,
    transform: v => String(v),
  },
  {
    kind: 'param',
    filterKey: 'quarter',
    paramKey: PARAM_KEYS.quarter,
    condition: f => f.quarter !== 'ALL',
    transform: v => String(v),
  },
  textParam('businessArea', PARAM_KEYS.businessArea),
  textParam('sido', PARAM_KEYS.sido),
  textParam('sigungu', PARAM_KEYS.sigungu),
  textParam('sponsorName', PARAM_KEYS.sponsorName),
  textParam('mainTitle', PARAM_KEYS.mainTitle),
  textParam('title', PARAM_KEYS.title),
  textParam('textbookName', PARAM_KEYS.textbookName),
  textParam('institutionName', PARAM_KEYS.institutionName),
  textParam('ips', PARAM_KEYS.ips),
  textParam('educationType', PARAM_KEYS.educationType),
]

function handleEducationRecordFilterChange(args: {
  prev: EducationRecordPendingFilters
  key: string
  value: unknown
}): EducationRecordPendingFilters {
  const { prev, key, value } = args
  const next: EducationRecordPendingFilters = {
    ...prev,
    [key]: value ?? ('' as never),
  } as EducationRecordPendingFilters

  if (key === 'sido' && prev.sido !== (value ?? '')) {
    next.sigungu = ''
  }

  if (key === 'quarter') {
    next.quarter = value == null || value === '' ? 'ALL' : (Number(value) as EducationRecordQuarter)
  }

  if (key === 'year') {
    next.year = value == null ? '' : String(value)
  }

  return next
}

export const educationRecordTablePageConfig: TablePageConfig<
  EducationRecordRow,
  EducationRecordPendingFilters,
  EducationRecordTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<EducationRecordRow> => createEducationRecordColumns(),
  },

  filters: {
    initialPending: { ...EMPTY_PENDING },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const next = readFilters(searchParams)
      setPendingFilters(prev => (isSamePending(prev, next) ? prev : next))
    },

    hasActiveFilters: ({ searchParams }) => hasAppliedFilters(readFilters(searchParams)),

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: handleEducationRecordFilterChange,
  },

  filterFn: ({ data, searchParams }) => {
    const filtered = filterRows(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
