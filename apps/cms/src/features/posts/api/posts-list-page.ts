/** 게시글 목록 공통 페이지네이션 — BE `PageResponse`와 동일 */

export const POSTS_LIST_PAGE_SIZE = 20

export type PostsListPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}
