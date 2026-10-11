/** 데이터 관리 목록 공통 페이지네이션 */

export const DATA_MANAGEMENT_LIST_PAGE_SIZE = 20

export type DataManagementListPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}
