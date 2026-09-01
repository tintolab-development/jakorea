import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFaqCategory,
  deleteFaqCategory,
  getFaqCategories,
  updateFaqCategory,
} from '@/features/posts/api/faqs/admin-faqs-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import {
  applyCreatedCategoryList,
  applyDeletedCategoryList,
  applyRenamedCategoryList,
} from '@/features/posts/lib/category-query-cache'

/** Class A/B 참조 데이터 — 목록 패치 가능하면 GET refetch 생략 */
const FAQ_CATEGORIES_STALE_TIME_MS = 15 * 60_000
const FAQ_CATEGORIES_GC_TIME_MS = 60 * 60_000

export function faqCategoriesQueryOptions() {
  return queryOptions({
    queryKey: postsQueryKeys.faqs.categories(),
    queryFn: getFaqCategories,
    staleTime: FAQ_CATEGORIES_STALE_TIME_MS,
    gcTime: FAQ_CATEGORIES_GC_TIME_MS,
    retry: false,
  })
}

export function useFaqCategoriesQuery(enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('faqs', enabled)

  return useQuery({
    ...faqCategoriesQueryOptions(),
    enabled: remoteEnabled,
  })
}

export function useFaqCategoryMutations() {
  const queryClient = useQueryClient()
  const categoriesKey = postsQueryKeys.faqs.categories()

  const createMutation = useMutation({
    mutationFn: createFaqCategory,
    retry: false,
    onSuccess: created => applyCreatedCategoryList(queryClient, categoriesKey, created),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFaqCategory(id, name),
    retry: false,
    onSuccess: (_data, { id, name }) =>
      applyRenamedCategoryList(queryClient, categoriesKey, id, name),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaqCategory,
    retry: false,
    onSuccess: (_data, id) => applyDeletedCategoryList(queryClient, categoriesKey, id),
  })

  return { createMutation, updateMutation, deleteMutation }
}
