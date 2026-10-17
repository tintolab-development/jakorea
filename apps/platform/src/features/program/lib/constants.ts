import type { ProgramCategory, ProgramSort, ProgramTab, ProgramsListParams } from '../model/types'
import {
  writePortalRecruitmentFocus,
  type PortalRecruitmentFocus,
} from './portal-recruitment.ts'

export const PROGRAMS_PATH = '/programs'

/** 카드·상세 탭 배지. 목록 탭 메뉴 문구(`PROGRAM_CATEGORY_ITEMS`)와 다르다. */
export const PROGRAM_TAB_LABEL: Record<ProgramTab, string> = {
  youth: '청소년 · 청년',
  institution: '기관',
  instructor: '강사',
}

/** API `portalCategories` 코드 오름차순과 같다. */
const PROGRAM_TAB_ORDER: readonly ProgramTab[] = ['instructor', 'institution', 'youth']

export function programTabLabels(tabs: readonly ProgramTab[]): string {
  return [...tabs]
    .sort((a, b) => PROGRAM_TAB_ORDER.indexOf(a) - PROGRAM_TAB_ORDER.indexOf(b))
    .map(tab => PROGRAM_TAB_LABEL[tab])
    .join(' · ')
}

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
  programType: 'all',
  recruitmentTarget: 'all',
  recruitmentStatus: 'all',
  operatingPeriod: 'all',
  educationTarget: 'all',
  educationForm: 'all',
  sort: 'latest',
  page: 1,
} as const

/** 운영기간 필터 — 레거시 연 단위 옵션 (날짜 필터로 전환됨) */
export const OPERATING_PERIOD_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '2026', label: '2026년' },
  { value: '2025', label: '2025년' },
] as const

export const PROGRAM_FILTER_KEYS = [
  'programType',
  'recruitmentTarget',
  'recruitmentStatus',
  'operatingPeriod',
  'educationTarget',
  'educationForm',
] as const satisfies readonly (keyof ProgramsListParams)[]

function withRecruitmentFocus(path: string, focus?: PortalRecruitmentFocus | null, from?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  writePortalRecruitmentFocus(params, focus)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export const programDetailPath = (
  id: string,
  from?: string,
  focus?: PortalRecruitmentFocus | null,
) => withRecruitmentFocus(`/programs/${id}`, focus, from)

export const programApplyPath = (
  id: string,
  focus?: PortalRecruitmentFocus | null,
  from?: string,
) => withRecruitmentFocus(`/programs/${id}/apply`, focus, from)

export const programApplyCompletePath = (
  id: string,
  focus?: PortalRecruitmentFocus | null,
  from?: string,
) => withRecruitmentFocus(`/programs/${id}/apply/complete`, focus, from)

export const programApplyRequiredPath = (
  id: string,
  focus?: PortalRecruitmentFocus | null,
  from?: string,
) => `/auth/required?redirect=${encodeURIComponent(programApplyPath(id, focus, from))}`
