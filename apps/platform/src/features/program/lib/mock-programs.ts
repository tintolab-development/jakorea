import programDetail01Url from '../image/illustration/program-detail-01.png'
import programDetail02Url from '../image/illustration/program-detail-02.png'
import programDetail03Url from '../image/illustration/program-detail-03.png'
import programThumbnail01Url from '../image/illustration/program-thumbnail-01.png'
import programThumbnail02Url from '../image/illustration/program-thumbnail-02.png'
import programThumbnail03Url from '../image/illustration/program-thumbnail-03.png'
import type { ProgramDetail, ProgramListItem } from '../model/types'
import { CMS_PLATFORM_PROGRAM_FIXTURES } from './cms-registration-fixtures'
import { mapCmsProgramsToPlatformDetails } from './map-from-cms'
import { mergeSeedAndCatalogPrograms } from './merge-seed-catalog'
import { fetchMockProgramCatalog } from './mock-program-catalog-client'

/**
 * mock 이미지 페어 — 동일 프로그램 비주얼을 해상도별로 분리.
 * - thumbnail: 목록용 저해상 (~160×220)
 * - detail: 상세 배너용 고해상
 */
const MOCK_IMAGE_PAIRS = [
  {
    thumbnailUrl: programThumbnail01Url,
    detailImageUrl: programDetail01Url,
  },
  {
    thumbnailUrl: programThumbnail02Url,
    detailImageUrl: programDetail02Url,
  },
  {
    thumbnailUrl: programThumbnail03Url,
    detailImageUrl: programDetail03Url,
  },
] as const

/** 프로그램별 안정적인 이미지 페어 (목록 썸네일 ↔ 상세 고해상 동일 비주얼 유지) */
function pickMockImagePair(programId: string): {
  thumbnailUrl: string
  detailImageUrl: string
} {
  let hash = 0
  for (let index = 0; index < programId.length; index += 1) {
    hash = (hash * 31 + programId.charCodeAt(index)) >>> 0
  }
  const pair = MOCK_IMAGE_PAIRS[hash % MOCK_IMAGE_PAIRS.length]
  return {
    thumbnailUrl: pair.thumbnailUrl,
    detailImageUrl: pair.detailImageUrl,
  }
}

/**
 * CMS 등록 케이스 fixture → Platform 상세.
 * 일반 16 + 1사1교 2 + 교육받은 교사 8 + Gemini 2 + UJAT 2
 */
const SEED_PROGRAMS: ProgramDetail[] = mapCmsProgramsToPlatformDetails(
  CMS_PLATFORM_PROGRAM_FIXTURES,
  pickMockImagePair
)

/** 시드 전용 동기 조회 (비로그인·초기 페인트) */
export function getMockPrograms(): ProgramListItem[] {
  return SEED_PROGRAMS
}

export function getMockProgramById(id: string): ProgramDetail | undefined {
  return SEED_PROGRAMS.find(program => program.id === id)
}

/**
 * mock 로그인 시 CMS catalog 를 merge 한 목록.
 * 비로그인·실패 시 시드만 반환.
 */
export async function loadMockPrograms(): Promise<ProgramDetail[]> {
  const catalogLike = await fetchMockProgramCatalog()
  if (catalogLike.length === 0) return [...SEED_PROGRAMS]

  const catalogDetails = mapCmsProgramsToPlatformDetails(catalogLike, pickMockImagePair)
  return mergeSeedAndCatalogPrograms(SEED_PROGRAMS, catalogDetails)
}

export async function loadMockProgramById(id: string): Promise<ProgramDetail | undefined> {
  const programs = await loadMockPrograms()
  return programs.find(program => program.id === id)
}

/** 프로그램 운영 기간이 선택한 연도(YYYY)와 겹치면 true */
export function programOverlapsOperatingYear(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  year: string
) {
  const selectedYear = Number.parseInt(year, 10)
  if (!Number.isFinite(selectedYear)) {
    return true
  }

  const startYear = Number.parseInt(program.operatingPeriodStart.slice(0, 4), 10)
  const endYear = Number.parseInt(program.operatingPeriodEnd.slice(0, 4), 10)
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return false
  }

  return startYear <= selectedYear && endYear >= selectedYear
}

/** 프로그램 운영 기간이 선택한 일자(YYYY-MM-DD)를 포함하면 true */
export function programIncludesOperatingDate(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  date: string
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return true
  }

  const start = program.operatingPeriodStart
  const end = program.operatingPeriodEnd
  if (!start || !end) {
    return false
  }

  return start <= date && end >= date
}

/** 프로그램 운영 기간이 선택한 구간과 겹치면 true */
export function programOverlapsOperatingDateRange(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  rangeStart: string,
  rangeEnd: string
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rangeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(rangeEnd)) {
    return true
  }

  const start = program.operatingPeriodStart
  const end = program.operatingPeriodEnd
  if (!start || !end) {
    return false
  }

  const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd
  const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart
  return start <= to && end >= from
}
