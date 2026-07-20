import type { ProgramCategory, ProgramSort, ProgramsListParams } from '../model/types'
import { DEFAULT_PROGRAMS_LIST_PARAMS, PROGRAMS_PATH } from './constants'

const PROGRAM_CATEGORIES = new Set<ProgramCategory>(['all', 'youth', 'institution', 'instructor'])
const PROGRAM_SORTS = new Set<ProgramSort>(['latest', 'name', 'closing-soon'])

function parseCategory(value: string | null): ProgramCategory {
  if (value && PROGRAM_CATEGORIES.has(value as ProgramCategory)) {
    return value as ProgramCategory
  }

  return DEFAULT_PROGRAMS_LIST_PARAMS.category
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

  return {
    category: parseCategory(params.get('category')),
    q: params.get('q') ?? DEFAULT_PROGRAMS_LIST_PARAMS.q,
    recruitmentTarget: params.get('recruitmentTarget') ?? DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget,
    recruitmentStatus: params.get('recruitmentStatus') ?? DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus,
    educationTarget: params.get('educationTarget') ?? DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget,
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
