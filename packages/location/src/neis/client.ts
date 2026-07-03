import { NEIS_SCHOOL_INFO_URL } from './constants'
import type {
  NeisSchoolItem,
  NeisSchoolRow,
  SearchNeisSchoolsOptions,
  SearchNeisSchoolsResult,
} from './types'

const DEFAULT_MISSING_KEY_MESSAGE = 'NEIS API 키가 설정되지 않았습니다.'

type NeisApiResult = {
  CODE?: string
  MESSAGE?: string
}

type NeisSchoolInfoChunk = {
  head?: Array<{ list_total_count?: number; RESULT?: NeisApiResult }>
  row?: NeisSchoolRow[]
  RESULT?: NeisApiResult
}

function mapRowToItem(row: NeisSchoolRow): NeisSchoolItem {
  return {
    sdSchulCode: row.SD_SCHUL_CODE ?? '',
    schulNm: row.SCHUL_NM ?? '',
    schulKndScNm: row.SCHUL_KND_SC_NM ?? '',
    atptOfcdcScNm: row.ATPT_OFCDC_SC_NM ?? '',
    lctnScNm: row.LCTN_SC_NM ?? '',
    orgRdnma: row.ORG_RDNMA ?? '',
    orgTelno: row.ORG_TELNO ?? '',
    hmpgAdres: row.HMPG_ADRES ?? '',
    foasMemrd: row.FOAS_MEMRD ?? '',
  }
}

function extractRows(schoolInfo: NeisSchoolInfoChunk[]): NeisSchoolRow[] {
  const rows: NeisSchoolRow[] = []

  for (const chunk of schoolInfo) {
    if (Array.isArray(chunk.row)) {
      rows.push(...chunk.row)
    }
  }

  return rows
}

function extractHeadResult(schoolInfo: NeisSchoolInfoChunk[]): NeisApiResult | null {
  const head = schoolInfo[0]?.head
  if (!Array.isArray(head)) return null

  for (const item of head) {
    if (item?.RESULT?.CODE) {
      return item.RESULT
    }
  }

  return null
}

function extractTotalCount(schoolInfo: NeisSchoolInfoChunk[]): number {
  const head = schoolInfo[0]?.head
  if (!Array.isArray(head)) return 0

  for (const item of head) {
    const total = Number(item.list_total_count)
    if (Number.isFinite(total) && total >= 0) {
      return total
    }
  }

  return 0
}

function parseNeisSchoolResponse(data: {
  RESULT?: NeisApiResult
  schoolInfo?: NeisSchoolInfoChunk[]
}): SearchNeisSchoolsResult {
  if (data.RESULT?.CODE) {
    if (data.RESULT.CODE === 'INFO-200') {
      return { schools: [], totalCount: 0 }
    }
    throw new Error(data.RESULT.MESSAGE ?? data.RESULT.CODE ?? 'API 오류')
  }

  const schoolInfo = data.schoolInfo
  if (!Array.isArray(schoolInfo) || schoolInfo.length === 0) {
    return { schools: [], totalCount: 0 }
  }

  const headResult = extractHeadResult(schoolInfo)
  if (headResult?.CODE && headResult.CODE !== 'INFO-000') {
    if (headResult.CODE === 'INFO-200') {
      return { schools: [], totalCount: 0 }
    }
    throw new Error(headResult.MESSAGE ?? headResult.CODE ?? 'API 오류')
  }

  for (const chunk of schoolInfo) {
    if (chunk.RESULT?.CODE && chunk.RESULT.CODE !== 'INFO-000') {
      if (chunk.RESULT.CODE === 'INFO-200') {
        return { schools: [], totalCount: 0 }
      }
      throw new Error(chunk.RESULT.MESSAGE ?? chunk.RESULT.CODE ?? 'API 오류')
    }
  }

  const schools = extractRows(schoolInfo).map(mapRowToItem)
  const totalCount = extractTotalCount(schoolInfo) || schools.length

  return { schools, totalCount }
}

export async function searchNeisSchools(
  options: SearchNeisSchoolsOptions,
): Promise<SearchNeisSchoolsResult> {
  const {
    apiKey,
    keyword,
    page = 1,
    pageSize = 20,
    missingKeyMessage = DEFAULT_MISSING_KEY_MESSAGE,
  } = options

  const trimmed = keyword.trim()
  if (!trimmed) {
    return { schools: [], totalCount: 0 }
  }

  if (!apiKey) {
    throw new Error(missingKeyMessage)
  }

  const params = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: String(page),
    pSize: String(pageSize),
    SCHUL_NM: trimmed,
  })
  const res = await fetch(`${NEIS_SCHOOL_INFO_URL}?${params.toString()}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message ?? `HTTP ${res.status}`)
  }

  return parseNeisSchoolResponse(data)
}
