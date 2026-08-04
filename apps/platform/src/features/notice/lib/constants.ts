import type { NoticesListParams } from '../model/types'

export const NOTICES_PATH = '/notices'

export const NOTICES_PAGE_SIZE = 10

export const DEFAULT_NOTICES_LIST_PARAMS = {
  q: '',
  page: 1,
} as const satisfies NoticesListParams

export const noticeDetailPath = (id: string) => `${NOTICES_PATH}/${id}`
