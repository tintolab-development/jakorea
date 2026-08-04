import type { ProgramCategory, ProgramSort, ProgramsListParams } from '../model/types'

export const PROGRAMS_PATH = '/programs'

export const PROGRAM_CATEGORY_ITEMS: { key: ProgramCategory; label: string }[] = [
  { key: 'all', label: '전체 프로그램' },
  { key: 'youth', label: '청소년·청년 프로그램' },
  { key: 'institution', label: '기관 프로그램' },
  { key: 'instructor', label: '강사 프로그램' },
]

export const PROGRAM_SORT_OPTIONS: { key: ProgramSort; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'name', label: '이름순' },
  { key: 'closing-soon', label: '마감일 가까운순' },
]

export const DEFAULT_PROGRAMS_LIST_PARAMS = {
  category: 'all',
  q: '',
  recruitmentTarget: 'all',
  recruitmentStatus: 'all',
  operatingPeriod: 'all',
  educationTarget: 'all',
  educationForm: 'all',
  sort: 'latest',
  page: 1,
} as const

/** 운영기간 필터 — 연 단위 (mock/API 공통 value = YYYY) */
export const OPERATING_PERIOD_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '2026', label: '2026년' },
  { value: '2025', label: '2025년' },
] as const

export const PROGRAM_FILTER_KEYS = [
  'recruitmentTarget',
  'recruitmentStatus',
  'operatingPeriod',
  'educationTarget',
  'educationForm',
] as const satisfies readonly (keyof ProgramsListParams)[]

export const programDetailPath = (id: string, from?: string) => {
  const base = `/programs/${id}`
  return from ? `${base}?from=${encodeURIComponent(from)}` : base
}

export const programApplyPath = (id: string) => `/programs/${id}/apply`

export const programApplyCompletePath = (id: string) => `/programs/${id}/apply/complete`

export const programApplyRequiredPath = (id: string) =>
  `/auth/required?redirect=${encodeURIComponent(programApplyPath(id))}`
