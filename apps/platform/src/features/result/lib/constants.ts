import type { ResultSort, ResultsListParams } from '../model/types'

export const RESULTS_PATH = '/results'

export const RESULT_SORT_OPTIONS: { key: ResultSort; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'title', label: '제목순' },
]

export const DEFAULT_RESULTS_LIST_PARAMS = {
  category: 'all',
  q: '',
  sort: 'latest',
  page: 1,
} as const satisfies ResultsListParams

export const RESULT_FILTER_KEYS = ['category'] as const satisfies readonly (keyof ResultsListParams)[]

export const resultDetailPath = (id: string) => `${RESULTS_PATH}/${id}`
