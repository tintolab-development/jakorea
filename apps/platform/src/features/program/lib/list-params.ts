import type { ProgramCategory, ProgramSort, ProgramsListParams } from '../model/types'
import { DEFAULT_PROGRAMS_LIST_PARAMS, PROGRAMS_PATH } from './constants'

const PROGRAM_CATEGORY_VALUES = new Set<ProgramCategory>([
  'all',
  'youth',
  'institution',
  'instructor',
])
const PROGRAM_SORTS = new Set<ProgramSort>(['latest', 'name', 'closing-soon'])

/** 레거시 URL (탭 값) 이 모집대상에 남아 있으면 무시 */
const LEGACY_AUDIENCE_AS_TARGET = new Set(['youth', 'institution', 'instructor'])

const EDUCATION_TARGET_VALUES = new Set([
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
])

function parseCategory(value: string | null): ProgramCategory {
  if (value && PROGRAM_CATEGORY_VALUES.has(value as ProgramCategory)) {
    return value as ProgramCategory
  }

  return DEFAULT_PROGRAMS_LIST_PARAMS.category
}

/** 모집대상·교육대상 공통 age key */
export function parseEducationTargetFilter(value: string | null): string {
  if (!value || value === 'all') {
    return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget
  }
  if (LEGACY_AUDIENCE_AS_TARGET.has(value)) {
    return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget
  }
  if (EDUCATION_TARGET_VALUES.has(value)) {
    return value
  }
  return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget
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

/** 기간 기반 3단 모집현황 필터 */
const VALID_RECRUITMENT_STATUS = new Set(['recruiting', 'closed', 'scheduled', 'all'])

function parseRecruitmentStatusFilter(value: string | null): string {
  if (!value || value === 'all') {
    return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus
  }
  if (VALID_RECRUITMENT_STATUS.has(value)) {
    return value
  }
  return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus
}

export function readProgramsListParams(search = window.location.search): ProgramsListParams {
  const params = new URLSearchParams(search)

  return {
    category: parseCategory(params.get('category')),
    q: params.get('q') ?? DEFAULT_PROGRAMS_LIST_PARAMS.q,
    recruitmentTarget: parseEducationTargetFilter(params.get('recruitmentTarget')),
    recruitmentStatus: parseRecruitmentStatusFilter(params.get('recruitmentStatus')),
    operatingPeriod: params.get('operatingPeriod') ?? DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod,
    educationTarget: parseEducationTargetFilter(params.get('educationTarget')),
    educationForm: params.get('educationForm') ?? DEFAULT_PROGRAMS_LIST_PARAMS.educationForm,
    sort: parseSort(params.get('sort')),
    page: parsePositiveInt(params.get('page'), DEFAULT_PROGRAMS_LIST_PARAMS.page),
  }
}

export function buildProgramsListPath(params: ProgramsListParams) {
  const searchParams = new URLSearchParams()

  if (params.category !== DEFAULT_PROGRAMS_LIST_PARAMS.category) {
    searchParams.set('category', params.category)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.recruitmentTarget !== DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget) {
    searchParams.set('recruitmentTarget', params.recruitmentTarget)
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
