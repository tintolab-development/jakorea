import type { ProgramCategory, ProgramSort, ProgramsListParams } from '../model/types'
import type { PortalApplicationType } from '../api/application-types'
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

function parseOperatingPeriodFilter(value: string | null): string {
  if (!value || value === 'all') {
    return DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod
  }
  if (
    /^\d{4}-\d{2}-\d{2}~\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{4}$/.test(value)
  ) {
    return value
  }
  return DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod
}

/** 기간 기반 3단 모집현황 필터 */
const VALID_RECRUITMENT_STATUS = new Set(['recruiting', 'closed', 'scheduled', 'all'])
const VALID_PROGRAM_TYPES = new Set(['all', 'UJAT'])
const VALID_APPLICATION_TYPES = new Set(['INDIVIDUAL', 'ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'])

function parseProgramTypeFilter(value: string | null): string {
  const normalized = value?.trim().toUpperCase()
  return normalized && VALID_PROGRAM_TYPES.has(normalized)
    ? normalized
    : DEFAULT_PROGRAMS_LIST_PARAMS.programType
}

function parseApplicationTypeFilter(value: string | null): PortalApplicationType | undefined {
  const normalized = value?.trim().toUpperCase()
  return normalized && VALID_APPLICATION_TYPES.has(normalized)
    ? (normalized as PortalApplicationType)
    : undefined
}

function parseRecruitmentStatusFilter(value: string | null): string {
  if (!value || value === 'all') {
    return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus
  }
  if (VALID_RECRUITMENT_STATUS.has(value)) {
    return value
  }
  return DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus
}

const VALID_EDUCATION_FORMS = new Set(['all', 'online', 'offline', 'hybrid', 'participant_choice'])

function parseEducationFormFilter(value: string | null): string {
  return value && VALID_EDUCATION_FORMS.has(value)
    ? value
    : DEFAULT_PROGRAMS_LIST_PARAMS.educationForm
}

function readRepeatedFilter(
  params: URLSearchParams,
  key: string,
  parse: (value: string | null) => string,
  defaultValue: string,
): { value: string; values?: string[] } {
  const values = [...new Set(params.getAll(key).map(item => parse(item)).filter(item => item !== defaultValue))]
  if (values.length > 1) {
    return { value: values[0], values }
  }
  return { value: values[0] ?? defaultValue }
}

function appendFilterValues(
  params: URLSearchParams,
  key: string,
  scalar: string,
  values: readonly string[] | undefined,
  defaultValue: string,
) {
  const selected = values && values.length > 0 ? values : [scalar]
  for (const value of [...new Set(selected)]) {
    if (value && value !== defaultValue) params.append(key, value)
  }
}

export function readProgramsListParams(search = window.location.search): ProgramsListParams {
  const params = new URLSearchParams(search)
  const applicationType = parseApplicationTypeFilter(params.get('applicationType'))
  const programType = readRepeatedFilter(
    params,
    'programType',
    parseProgramTypeFilter,
    DEFAULT_PROGRAMS_LIST_PARAMS.programType,
  )
  const recruitmentTarget = readRepeatedFilter(
    params,
    'recruitmentTarget',
    parseEducationTargetFilter,
    DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget,
  )
  const recruitmentStatus = readRepeatedFilter(
    params,
    'recruitmentStatus',
    parseRecruitmentStatusFilter,
    DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus,
  )
  const educationTarget = readRepeatedFilter(
    params,
    'educationTarget',
    parseEducationTargetFilter,
    DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget,
  )
  const educationForm = readRepeatedFilter(
    params,
    'educationForm',
    parseEducationFormFilter,
    DEFAULT_PROGRAMS_LIST_PARAMS.educationForm,
  )

  return {
    category: parseCategory(params.get('category')),
    q: params.get('q') ?? DEFAULT_PROGRAMS_LIST_PARAMS.q,
    ...(applicationType ? { applicationType } : {}),
    programType: programType.value,
    ...(programType.values ? { programTypeValues: programType.values } : {}),
    recruitmentTarget: recruitmentTarget.value,
    ...(recruitmentTarget.values ? { recruitmentTargetValues: recruitmentTarget.values } : {}),
    recruitmentStatus: recruitmentStatus.value,
    ...(recruitmentStatus.values ? { recruitmentStatusValues: recruitmentStatus.values } : {}),
    operatingPeriod: parseOperatingPeriodFilter(params.get('operatingPeriod')),
    educationTarget: educationTarget.value,
    ...(educationTarget.values ? { educationTargetValues: educationTarget.values } : {}),
    educationForm: educationForm.value,
    ...(educationForm.values ? { educationFormValues: educationForm.values } : {}),
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
  if (params.applicationType) {
    searchParams.set('applicationType', params.applicationType)
  }
  appendFilterValues(
    searchParams,
    'programType',
    params.programType,
    params.programTypeValues,
    DEFAULT_PROGRAMS_LIST_PARAMS.programType,
  )
  appendFilterValues(
    searchParams,
    'recruitmentTarget',
    params.recruitmentTarget,
    params.recruitmentTargetValues,
    DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentTarget,
  )
  appendFilterValues(
    searchParams,
    'recruitmentStatus',
    params.recruitmentStatus,
    params.recruitmentStatusValues,
    DEFAULT_PROGRAMS_LIST_PARAMS.recruitmentStatus,
  )
  if (params.operatingPeriod !== DEFAULT_PROGRAMS_LIST_PARAMS.operatingPeriod) {
    searchParams.set('operatingPeriod', params.operatingPeriod)
  }
  appendFilterValues(
    searchParams,
    'educationTarget',
    params.educationTarget,
    params.educationTargetValues,
    DEFAULT_PROGRAMS_LIST_PARAMS.educationTarget,
  )
  appendFilterValues(
    searchParams,
    'educationForm',
    params.educationForm,
    params.educationFormValues,
    DEFAULT_PROGRAMS_LIST_PARAMS.educationForm,
  )
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
