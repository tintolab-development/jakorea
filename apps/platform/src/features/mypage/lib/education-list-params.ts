import type {
  EducationApplicationListParams,
  EducationApplicationTab,
} from '../model/education-application-types'
import { MYPAGE_EDUCATION_PATH } from './constants'

export const DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS: EducationApplicationListParams = {
  tab: 'all',
  page: 1,
}

const VALID_TABS = new Set<EducationApplicationTab>(['all', 'applied', 'in_progress', 'completed'])

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseTab(value: string | null): EducationApplicationTab {
  if (value && VALID_TABS.has(value as EducationApplicationTab)) {
    return value as EducationApplicationTab
  }

  return DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.tab
}

export function readEducationApplicationListParams(
  search = window.location.search,
): EducationApplicationListParams {
  const params = new URLSearchParams(search)

  return {
    tab: parseTab(params.get('tab')),
    page: parsePositiveInt(params.get('page'), DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.page),
  }
}

export function buildEducationApplicationListPath(params: EducationApplicationListParams) {
  const searchParams = new URLSearchParams()

  if (params.tab !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.tab) {
    searchParams.set('tab', params.tab)
  }
  if (params.page !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${MYPAGE_EDUCATION_PATH}?${query}` : MYPAGE_EDUCATION_PATH
}
