import type {
  TextbookCategoryFilter,
  TextbookSort,
  TextbooksListParams,
} from '../model/types'

export const TEXTBOOKS_PATH = '/education/textbooks'

export const TEXTBOOK_THEME_ITEMS: {
  key: Exclude<TextbookCategoryFilter, 'all'>
  label: string
  tabLabel: string
}[] = [
  { key: 'career', label: '진로·취업', tabLabel: '진로·취업' },
  { key: 'economy', label: '경제·금융', tabLabel: '경제·금융' },
  { key: 'entrepreneurship', label: '기업가정신', tabLabel: '기업가 정신' },
  { key: 'digital', label: '디지털 리터러시', tabLabel: '디지털 리터러시' },
]

export const TEXTBOOK_CATEGORY_TAB_ITEMS: { key: TextbookCategoryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  ...TEXTBOOK_THEME_ITEMS.map(({ key, tabLabel }) => ({ key, label: tabLabel })),
]

export const TEXTBOOK_SORT_OPTIONS: { key: TextbookSort; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'name', label: '이름순' },
]

export const DEFAULT_TEXTBOOKS_LIST_PARAMS = {
  category: 'all',
  sort: 'latest',
  page: 1,
} as const satisfies TextbooksListParams

export const TEXTBOOKS_PAGE_SIZE = 10
