export type {
  NoticeCategory,
  ResultAttachment,
  ResultDetail,
  ResultListItem,
  ResultsListParams,
} from './model/types'
export type { ResultSort as ResultSortKey } from './model/types'
export {
  DEFAULT_RESULTS_LIST_PARAMS,
  RESULT_FILTER_KEYS,
  RESULT_SORT_OPTIONS,
  RESULTS_PATH,
  resultDetailPath,
} from './lib/constants'
export {
  getNoticeCategoryFilterOptions,
  getResultCategoryTabItems,
  getMockNoticeCategories,
  resolveResultCategoryFilterId,
  useMockNoticeCategories,
} from './lib/mock-notice-categories'
export {
  getAdjacentResults,
  getMockResultById,
  getMockResultDetailById,
  getMockResults,
  useMockResultDetail,
  useMockResultsCatalog,
} from './lib/mock-results'
export type { AdjacentResults } from './lib/mock-results'
export { filterAndSortResults } from './lib/filter-results'
export {
  buildResultsListPath,
  getResultsListReturnPath,
  readResultsListParams,
} from './lib/list-params'
export {
  getResultIdFromPath,
  isResultsPath,
  parseResultRoute,
  type ParsedResultRoute,
  type ResultRouteName,
} from './lib/routes'
export { ResultListItemRow } from './ui/list-item'
export { ResultAdjacentNav } from './ui/adjacent-nav'
export { ResultSort } from './ui/result-sort'
