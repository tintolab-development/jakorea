import type { CareersListParams } from '../model/types'

export const CAREERS_PATH = '/about/careers'

export const careerPostingDetailPath = (id: string) => `${CAREERS_PATH}/${id}`

export const CAREERS_PAGE_SIZE = 10

export const DEFAULT_CAREERS_LIST_PARAMS = {
  tab: 'openings',
  q: '',
  page: 1,
} as const satisfies CareersListParams

export const CAREERS_TAB_ITEMS = [
  { key: 'openings', label: '채용공고' },
  { key: 'talent', label: '인재채용' },
] as const
