import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNoticeCategory,
  deleteNoticeCategory,
  getNoticeCategories,
  updateNoticeCategory,
} from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import {
  applyCreatedCategoryList,
  applyDeletedCategoryList,
  applyRenamedCategoryList,
} from '@/features/posts/lib/category-query-cache'

/** Class A/B 참조 데이터 — 목록 패치 가능하면 GET refetch 생략 */
const NOTICE_CATEGORIES_STALE_TIME_MS = 15 * 60_000
const NOTICE_CATEGORIES_GC_TIME_MS = 60 * 60_000

export function noticeCategoriesQueryOptions() {
  return queryOptions({
    queryKey: postsQueryKeys.notices.categories(),
    queryFn: getNoticeCategories,
    staleTime: NOTICE_CATEGORIES_STALE_TIME_MS,
    gcTime: NOTICE_CATEGORIES_GC_TIME_MS,
    retry: false,
  })
}

export function useNoticeCategoriesQuery(enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('notices', enabled)

  return useQuery({
    ...noticeCategoriesQueryOptions(),
    enabled: remoteEnabled,
  })
}

export function useNoticeCategoryMutations() {
  const queryClient = useQueryClient()
  const categoriesKey = postsQueryKeys.notices.categories()

  const createMutation = useMutation({
    mutationFn: createNoticeCategory,
    retry: false,
    onSuccess: created => applyCreatedCategoryList(queryClient, categoriesKey, created),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateNoticeCategory(id, name),
    retry: false,
    onSuccess: (_data, { id, name }) =>
      applyRenamedCategoryList(queryClient, categoriesKey, id, name),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNoticeCategory,
    retry: false,
    onSuccess: (_data, id) => applyDeletedCategoryList(queryClient, categoriesKey, id),
  })

  return { createMutation, updateMutation, deleteMutation }
}
