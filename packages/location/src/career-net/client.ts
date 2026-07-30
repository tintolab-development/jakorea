import {
  CAREER_NET_GUBUN_UNIVERSITY,
  CAREER_NET_OPEN_API_URL,
} from './constants'
import { resolveCareerNetRegionCode } from './region-code-map'
import type {
  CareerNetSchoolRow,
  CareerNetUniversityItem,
  SearchCareerNetUniversitiesOptions,
  SearchCareerNetUniversitiesResult,
} from './types'

const DEFAULT_MISSING_KEY_MESSAGE = '커리어넷 API 키가 설정되지 않았습니다.'

function normalizePageIndex(page: number | undefined): number {
  const normalized = Number(page)
  if (!Number.isInteger(normalized) || normalized < 1) {
    return 1
  }
  return normalized
}

function normalizePageSize(pageSize: number | undefined): number {
  const normalized = Number(pageSize)
  if (!Number.isInteger(normalized) || normalized < 1) {
    return 100
  }
  return normalized
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeCollegeInfoUrl(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') return ''
  return trimmed
}

function mapRowToItem(row: CareerNetSchoolRow): CareerNetUniversityItem {
  return {
    seq: row.seq ?? '',
    schoolName: row.schoolName ?? '',
    schoolGubun: row.schoolGubun ?? '',
    schoolType: row.schoolType ?? '',
    estType: row.estType ?? '',
    region: row.region ?? '',
    address: row.adres ?? '',
    campusName: row.campusName ?? '',
    link: row.link ?? '',
    collegeInfoUrl: normalizeCollegeInfoUrl(row.collegeinfourl),
  }
}

type CareerNetErrorContent = {
  code?: string
  message?: string
}

type CareerNetJsonResponse = {
  dataSearch?: {
    content?: CareerNetSchoolRow | CareerNetSchoolRow[]
  }
  result?: {
    content?: CareerNetErrorContent | CareerNetErrorContent[]
  }
}

function extractErrorMessage(data: CareerNetJsonResponse): string | null {
  const errors = asArray(data.result?.content)
  const first = errors.find(item => item?.code && item.code !== '0')
  if (!first) return null
  return first.message ?? first.code ?? 'API 오류'
}

function parseSearchResponse(data: CareerNetJsonResponse): SearchCareerNetUniversitiesResult {
  const errorMessage = extractErrorMessage(data)
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  const rows = asArray(data.dataSearch?.content)
  const universities = rows
    .map(mapRowToItem)
    .filter(item => Boolean(item.schoolName))

  const totalFromRow = Number(rows[0]?.totalCount)
  const totalCount =
    Number.isFinite(totalFromRow) && totalFromRow >= 0 ? totalFromRow : universities.length

  return { universities, totalCount }
}

/**
 * 커리어넷 학교정보 OpenAPI로 대학교를 검색한다.
 * @see https://www.career.go.kr/cnet/front/openapi/openApiSchoolCenter.do
 * @see https://www.data.go.kr/data/15057878/openapi.do (커리어넷 계열 — 학과 API와 동일 인증키)
 */
export async function searchCareerNetUniversities(
  options: SearchCareerNetUniversitiesOptions,
): Promise<SearchCareerNetUniversitiesResult> {
  const {
    apiKey,
    keyword,
    regionSido,
    regionCode,
    sch1,
    page,
    pageSize,
    missingKeyMessage = DEFAULT_MISSING_KEY_MESSAGE,
  } = options

  const trimmed = keyword.trim()
  if (!trimmed) {
    return { universities: [], totalCount: 0 }
  }

  if (!apiKey.trim()) {
    throw new Error(missingKeyMessage)
  }

  const resolvedRegion =
    regionCode?.trim() ||
    (regionSido?.trim() ? resolveCareerNetRegionCode(regionSido) : undefined)

  const params = new URLSearchParams({
    apiKey: apiKey.trim(),
    svcType: 'api',
    svcCode: 'SCHOOL',
    contentType: 'json',
    gubun: CAREER_NET_GUBUN_UNIVERSITY,
    searchSchulNm: trimmed,
    thisPage: String(normalizePageIndex(page)),
    perPage: String(normalizePageSize(pageSize)),
  })

  if (resolvedRegion) {
    params.set('region', resolvedRegion)
  }
  if (sch1?.trim()) {
    params.set('sch1', sch1.trim())
  }

  const res = await fetch(`${CAREER_NET_OPEN_API_URL}?${params.toString()}`)
  const data = (await res.json()) as CareerNetJsonResponse

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return parseSearchResponse(data)
}

/** 키워드 검색 결과 전 페이지를 순차 조회한다 (클라이언트 페이지네이션·지역 필터용). */
export async function searchAllCareerNetUniversities(
  options: Omit<SearchCareerNetUniversitiesOptions, 'page'>,
): Promise<SearchCareerNetUniversitiesResult> {
  const pageSize = normalizePageSize(options.pageSize)
  const first = await searchCareerNetUniversities({ ...options, page: 1, pageSize })

  if (first.totalCount <= first.universities.length) {
    return first
  }

  const all = [...first.universities]
  const totalPages = Math.ceil(first.totalCount / pageSize)

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await searchCareerNetUniversities({ ...options, page, pageSize })
    all.push(...result.universities)
    if (result.universities.length === 0) {
      break
    }
  }

  return {
    universities: all,
    totalCount: first.totalCount,
  }
}
