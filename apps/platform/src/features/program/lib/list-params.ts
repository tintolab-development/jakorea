import type { ProgramCategory, ProgramSort, ProgramsListParams } from '../model/types'
import { DEFAULT_PROGRAMS_LIST_PARAMS, PROGRAMS_PATH } from './constants'

/** 상단 탭(category) · 모집대상 필터(recruitmentTarget) 공통 값 */
const PROGRAM_AUDIENCE_VALUES = new Set<ProgramCategory>([
  'all',
  'youth',
  'institution',
  'instructor',
])
const PROGRAM_SORTS = new Set<ProgramSort>(['latest', 'name', 'closing-soon'])

function parseAudience(value: string | null): ProgramCategory {
  if (value && PROGRAM_AUDIENCE_VALUES.has(value as ProgramCategory)) {
    return value as ProgramCategory
  }

  return DEFAULT_PROGRAMS_LIST_PARAMS.category
}

/**
 * 상단 탭 ↔ 모집대상 필터 동기화.
 * - 한쪽만 지정되면 그 값을 공유
 * - 둘 다 지정되었으면 동일해야 함. 충돌 시 category(탭) 우선
 */
export function syncCategoryAndRecruitmentTarget(
  category: ProgramCategory,
  recruitmentTarget: ProgramCategory
): Pick<ProgramsListParams, 'category' | 'recruitmentTarget'> {
  if (category === recruitmentTarget) {
    return { category, recruitmentTarget }
  }

  if (category !== 'all' && recruitmentTarget === 'all') {
    return { category, recruitmentTarget: category }
  }

  if (category === 'all' && recruitmentTarget !== 'all') {
    return { category: recruitmentTarget, recruitmentTarget }
  }

  return { category, recruitmentTarget: category }
}

/** 탭/필터 변경 시 category·recruitmentTarget를 같은 상태로 맞춘 partial patch */
export function withSyncedAudience(
  audience: ProgramCategory
): Pick<ProgramsListParams, 'category' | 'recruitmentTarget'> {
  return { category: audience, recruitmentTarget: audience }
}

function parseSort(value: string | null): ProgramSort {
  if (value && PROGRAM_SORTS.has(value as ProgramSort)) {
    return value as ProgramSort
  }

  return DEFAULT_PROGRAMS_LIST_PARAMS.sort
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readProgramsListParams(search = window.location.search): ProgramsListParams {
  const params = new URLSearchParams(search)
  const audience = syncCategoryAndRecruitmentTarget(
    parseAudience(params.get('category')),
    parseAudience(params.get('recruitmentTarget'))
  )

  return {
    ...audience,
    q: params.get('q') ?? DEFAULT_PROGRAMS_LIST_PARAMS.q,
    recruitmentStatus: params.get('recruitmentStatus') ?? DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus,
    operatingPeriod: params.get('operatingPeriod') ?? DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod,
    educationTarget: params.get('educationTarget') ?? DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget,
    educationForm: params.get('educationForm') ?? DEFAULT_PROGRAMS_LIST_PARAMS.educationForm,
    sort: parseSort(params.get('sort')),
    page: parsePositiveInt(params.get('page'), DEFAULT_PROGRAMS_LIST_PARAMS.page),
  }
}

export function buildProgramsListPath(params: ProgramsListParams) {
  const searchParams = new URLSearchParams()
  const audience = syncCategoryAndRecruitmentTarget(
    parseAudience(params.category),
    parseAudience(params.recruitmentTarget)
  )

  if (audience.category !== DEFAULT_PROGRAMS_LIST_PARAMS.category) {
    searchParams.set('category', audience.category)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (audience.recruitmentTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget) {
    searchParams.set('recruitmentTarget', audience.recruitmentTarget)
  }
  if (params.recruitmentStatus !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus) {
    searchParams.set('recruitmentStatus', params.recruitmentStatus)
  }
  if (params.operatingPeriod !== DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod) {
    searchParams.set('operatingPeriod', params.operatingPeriod)
  }
  if (params.educationTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget) {
    searchParams.set('educationTarget', params.educationTarget)
  }
  if (params.educationForm !== DEFAULT_PROGRAMS_LIST_PARAMS.educationForm) {
    searchParams.set('educationForm', params.educationForm)
  }
  if (params.sort !== DEFAULT_PROGRAMS_LIST_PARAMS.sort) {
    searchParams.set('sort', params.sort)
  }
  if (params.page !== DEFAULT_PROGRAMS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${PROGRAMS_PATH}?${query}` : PROGRAMS_PATH
}

export function getProgramsListReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}
