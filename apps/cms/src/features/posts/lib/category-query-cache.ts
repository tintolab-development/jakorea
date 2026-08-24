import type { QueryClient, QueryKey } from '@tanstack/react-query'
import {
  withCreatedCategory,
  withoutCategory,
  withRenamedCategory,
  type CategoryRow,
} from '@/features/posts/api/shared/category-adapters'

/**
 * 카테고리 목록은 필터/페이지가 없는 단일 캐시이므로,
 * mutation 결과로 패치할 수 있으면 GET을 다시 치지 않는다.
 */
async function refetchCategoryList(queryClient: QueryClient, queryKey: QueryKey) {
  await queryClient.invalidateQueries({ queryKey })
}

export async function applyCreatedCategoryList(
  queryClient: QueryClient,
  queryKey: QueryKey,
  created: CategoryRow | null
): Promise<void> {
  await queryClient.cancelQueries({ queryKey })
  if (created) {
    queryClient.setQueryData<CategoryRow[]>(queryKey, old => withCreatedCategory(old, created))
    return
  }
  await refetchCategoryList(queryClient, queryKey)
}

export async function applyRenamedCategoryList(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
  name: string
): Promise<void> {
  await queryClient.cancelQueries({ queryKey })
  const current = queryClient.getQueryData<CategoryRow[]>(queryKey)
  const next = withRenamedCategory(current, id, name)
  if (next) {
    queryClient.setQueryData<CategoryRow[]>(queryKey, next)
    return
  }
  await refetchCategoryList(queryClient, queryKey)
}

export async function applyDeletedCategoryList(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string
): Promise<void> {
  await queryClient.cancelQueries({ queryKey })
  const current = queryClient.getQueryData<CategoryRow[]>(queryKey)
  const next = withoutCategory(current, id)
  if (next) {
    queryClient.setQueryData<CategoryRow[]>(queryKey, next)
    return
  }
  await refetchCategoryList(queryClient, queryKey)
}
