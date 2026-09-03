import type {
  GetPerformanceSummaryParams,
  ListRecordsParams,
} from '@/shared/api/generated/performance/schemas'
import type {
  EducationRecordPendingFilters,
  EducationRecordQuarter,
} from '@/features/education-record/model/education-record-types'

export const PERFORMANCE_LIST_PAGE = 0
export const PERFORMANCE_LIST_SIZE = 50

export const EDUCATION_RECORD_PARAM_KEYS = {
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

export function educationRecordFiltersFromSearchParams(
  searchParams: URLSearchParams
): EducationRecordPendingFilters {
  return {
    year: parseYear(searchParams.get(EDUCATION_RECORD_PARAM_KEYS.year)),
    quarter: parseQuarter(searchParams.get(EDUCATION_RECORD_PARAM_KEYS.quarter)),
    businessArea: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.businessArea) ?? '',
    sido: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.sido) ?? '',
    sigungu: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.sigungu) ?? '',
    sponsorName: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.sponsorName) ?? '',
    mainTitle: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.mainTitle) ?? '',
    title: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.title) ?? '',
    textbookName: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.textbookName) ?? '',
    institutionName: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.institutionName) ?? '',
    ips: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.ips) ?? '',
    educationType: searchParams.get(EDUCATION_RECORD_PARAM_KEYS.educationType) ?? '',
  }
}

/** 목록·합계·엑셀이 공유하는 솔팅 키. `tab` 등 UI 전용 쿼리는 제외. */
export function performanceFilterSearchKey(searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  for (const key of Object.values(EDUCATION_RECORD_PARAM_KEYS)) {
    const value = searchParams.get(key)?.trim()
    if (value) next.set(key, value)
  }
  return next.toString()
}

export function performanceRecordsParamsFromFilters(
  filters: EducationRecordPendingFilters
): GetPerformanceSummaryParams {
  const params: GetPerformanceSummaryParams = {}
  if (filters.year) params.year = Number(filters.year)
  if (filters.quarter !== 'ALL') params.quarter = filters.quarter
  const businessArea = filters.businessArea.trim()
  if (businessArea) params.businessArea = businessArea
  const sponsorNameKo = filters.sponsorName.trim()
  if (sponsorNameKo) params.sponsorNameKo = sponsorNameKo
  const mainTitle = filters.mainTitle.trim()
  if (mainTitle) params.mainTitle = mainTitle
  const title = filters.title.trim()
  if (title) params.title = title
  const textbookName = filters.textbookName.trim()
  if (textbookName) params.textbookName = textbookName
  const institutionName = filters.institutionName.trim()
  if (institutionName) params.institutionName = institutionName
  const sido = filters.sido.trim()
  if (sido) params.sido = sido
  const sigungu = filters.sigungu.trim()
  if (sigungu) params.sigungu = sigungu
  const ips = filters.ips.trim()
  if (ips) params.ips = ips
  const educationType = filters.educationType.trim()
  if (educationType) params.educationType = educationType
  return params
}

export function performanceRecordsParamsFromSearchParams(
  searchParams: URLSearchParams
): GetPerformanceSummaryParams {
  return performanceRecordsParamsFromFilters(educationRecordFiltersFromSearchParams(searchParams))
}

export function performanceListParamsFromSearchParams(
  searchParams: URLSearchParams
): ListRecordsParams {
  return {
    ...performanceRecordsParamsFromSearchParams(searchParams),
    page: PERFORMANCE_LIST_PAGE,
    size: PERFORMANCE_LIST_SIZE,
  }
}
