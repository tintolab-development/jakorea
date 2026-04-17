/**
 * 실적 관리 목록 TablePageConfig
 * - URL 쿼리 `er_year / er_q / er_sido / er_sigungu / er_sponsor / er_main / er_title / er_book` 와 동기화
 * - 데이터 파이프라인: year → quarter → sido → sigungu → sponsorName → mainTitle → title → textbookName
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  buildProgramRegionMap,
  getProgramQuarter,
  getProgramYear,
  parseRegionTokens,
} from '../lib/education-record-region'
import { createEducationRecordColumns } from './education-record-columns'
import type {
  EducationRecordPendingFilters,
  EducationRecordQuarter,
  EducationRecordTableContext,
} from './education-record-types'

const PARAM_KEYS = {
  year: 'er_year',
  quarter: 'er_q',
  sido: 'er_sido',
  sigungu: 'er_sigungu',
  sponsorName: 'er_sponsor',
  mainTitle: 'er_main',
  title: 'er_title',
  textbookName: 'er_book',
} as const

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
    sido: searchParams.get(PARAM_KEYS.sido) ?? '',
    sigungu: searchParams.get(PARAM_KEYS.sigungu) ?? '',
    sponsorName: searchParams.get(PARAM_KEYS.sponsorName) ?? '',
    mainTitle: searchParams.get(PARAM_KEYS.mainTitle) ?? '',
    title: searchParams.get(PARAM_KEYS.title) ?? '',
    textbookName: searchParams.get(PARAM_KEYS.textbookName) ?? '',
  }
}

function includesIgnoreCase(source: string | null | undefined, query: string): boolean {
  if (!query) return true
  if (!source) return false
  return source.toLowerCase().includes(query.toLowerCase())
}

function filterPrograms(
  data: Program[],
  searchParams: URLSearchParams
): Program[] {
  const filters = readFilters(searchParams)
  const yearNum = filters.year ? Number(filters.year) : null
  const sponsorNameQ = filters.sponsorName.trim()
  const mainTitleQ = filters.mainTitle.trim()
  const titleQ = filters.title.trim()
  const textbookNameQ = filters.textbookName.trim()
  const sidoQ = filters.sido.trim()
  const sigunguQ = filters.sigungu.trim()

  const regionMap = buildProgramRegionMap()

  return data.filter(program => {
    if (yearNum != null) {
      const year = getProgramYear(program)
      if (year !== yearNum) return false
    }

    if (filters.quarter !== 'ALL') {
      const quarter = getProgramQuarter(program)
      if (quarter !== filters.quarter) return false
    }

    if (sidoQ || sigunguQ) {
      const info = regionMap.get(program.id)
      const tokens = info
        ? { si: info.si, gun: info.gun, gu: info.gu }
        : parseRegionTokens(program.district)
      const rowSido = info?.sido ?? ''

      if (sidoQ && rowSido !== sidoQ) return false
      if (
        sigunguQ &&
        tokens.si !== sigunguQ &&
        tokens.gun !== sigunguQ &&
        tokens.gu !== sigunguQ
      ) {
        return false
      }
    }

    if (sponsorNameQ) {
      const sponsorNameKo = program.sponsorId ? sponsorService.getNameById(program.sponsorId) : ''
      const sponsorNameEn =
        (program.sponsorId && sponsorService.getAllSync().find(s => s.id === program.sponsorId)?.nameEn) ||
        ''
      if (
        !includesIgnoreCase(sponsorNameKo, sponsorNameQ) &&
        !includesIgnoreCase(sponsorNameEn, sponsorNameQ)
      ) {
        return false
      }
    }

    if (mainTitleQ && !includesIgnoreCase(program.mainTitle, mainTitleQ)) return false
    if (titleQ && !includesIgnoreCase(program.title, titleQ)) return false

    if (textbookNameQ) {
      if (
        !includesIgnoreCase(program.textbookName, textbookNameQ) &&
        !includesIgnoreCase(program.textbookNameEn, textbookNameQ)
      ) {
        return false
      }
    }

    return true
  })
}

const tanstackColumns: ColumnDef<Program>[] = [{ accessorKey: 'id', header: 'id' }]

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
  {
    kind: 'param',
    filterKey: 'sido',
    paramKey: PARAM_KEYS.sido,
    condition: f => f.sido.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sigungu',
    paramKey: PARAM_KEYS.sigungu,
    condition: f => f.sigungu.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'sponsorName',
    paramKey: PARAM_KEYS.sponsorName,
    condition: f => f.sponsorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'mainTitle',
    paramKey: PARAM_KEYS.mainTitle,
    condition: f => f.mainTitle.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'title',
    paramKey: PARAM_KEYS.title,
    condition: f => f.title.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'textbookName',
    paramKey: PARAM_KEYS.textbookName,
    condition: f => f.textbookName.trim().length > 0,
    transform: v => String(v).trim(),
  },
]

/**
 * `onFilterChange` 커스텀:
 * 시/도가 바뀌면 시/군/구를 초기화한다(유효성 강제).
 */
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
  Program,
  EducationRecordPendingFilters,
  EducationRecordTableContext
> = {
  columns: {
    tanstack: tanstackColumns,
    filterKeys: [],
    resolveAntdColumns: (): ColumnsType<Program> => {
      const sponsors = sponsorService.getAllSync()
      const sponsorMap = new Map(sponsors.map(s => [s.id, s]))
      const programRegionMap = buildProgramRegionMap()
      return createEducationRecordColumns({ sponsors, sponsorMap, programRegionMap })
    },
  },

  filters: {
    initialPending: {
      year: '',
      quarter: 'ALL',
      sido: '',
      sigungu: '',
      sponsorName: '',
      mainTitle: '',
      title: '',
      textbookName: '',
    },

    syncPendingFromUrl: ({ searchParams, setPendingFilters }) => {
      const next = readFilters(searchParams)
      setPendingFilters(prev => {
        if (
          prev.year === next.year &&
          prev.quarter === next.quarter &&
          prev.sido === next.sido &&
          prev.sigungu === next.sigungu &&
          prev.sponsorName === next.sponsorName &&
          prev.mainTitle === next.mainTitle &&
          prev.title === next.title &&
          prev.textbookName === next.textbookName
        ) {
          return prev
        }
        return next
      })
    },

    hasActiveFilters: ({ searchParams }) => {
      const f = readFilters(searchParams)
      if (f.year) return true
      if (f.quarter !== 'ALL') return true
      if (f.sido.trim()) return true
      if (f.sigungu.trim()) return true
      if (f.sponsorName.trim()) return true
      if (f.mainTitle.trim()) return true
      if (f.title.trim()) return true
      if (f.textbookName.trim()) return true
      return false
    },

    getBaseCount: ({ filteredData }) => filteredData.length,

    onFilterChange: handleEducationRecordFilterChange,
  },

  filterFn: ({ data, searchParams }) => {
    const filtered = filterPrograms(data, searchParams)
    return { dataForTable: filtered, filteredData: filtered }
  },

  getSearchSync: () => ({
    paramConfig: searchSyncRules,
    tableConfig: {},
  }),
}
