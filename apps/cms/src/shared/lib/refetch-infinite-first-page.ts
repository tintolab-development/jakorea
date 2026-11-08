import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * 무한 스크롤 목록을 첫 페이지만 다시 받는다.
 *
 * `refetch()`나 `invalidateQueries()`는 지금까지 불러온 모든 페이지를 순서대로 다시 받는다.
 * 삭제·가져오기처럼 목록 전체가 바뀌는 변경 뒤에는 첫 페이지만 남기고 무효화해
 * 스크롤하면 이어서 받도록 한다. 기존 행은 응답이 올 때까지 첫 페이지만 보인다.
 */
export async function refetchInfiniteQueryFirstPage(
  queryClient: QueryClient,
  queryKey: QueryKey
): Promise<void> {
  queryClient.setQueriesData<InfiniteData<unknown, unknown>>({ queryKey }, data =>
    data && data.pages.length > 1
      ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
      : data
  )
  await queryClient.invalidateQueries({ queryKey })
}
