import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInquiryCategory,
  deleteInquiryCategory,
  getInquiryCategories,
  updateInquiryCategory,
} from '@/features/posts/api/inquiries/admin-inquiries-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'
import {
  applyCreatedCategoryList,
  applyDeletedCategoryList,
  applyRenamedCategoryList,
} from '@/features/posts/lib/category-query-cache'

/** Class A/B 참조 데이터 — 목록 패치 가능하면 GET refetch 생략 */
const INQUIRY_CATEGORIES_STALE_TIME_MS = 15 * 60_000
const INQUIRY_CATEGORIES_GC_TIME_MS = 60 * 60_000

export function inquiryCategoriesQueryOptions() {
  return queryOptions({
    queryKey: postsQueryKeys.inquiries.categories(),
    queryFn: getInquiryCategories,
    staleTime: INQUIRY_CATEGORIES_STALE_TIME_MS,
    gcTime: INQUIRY_CATEGORIES_GC_TIME_MS,
    retry: false,
  })
}

export function useInquiryCategoriesQuery(enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('inquiries', enabled)

  return useQuery({
    ...inquiryCategoriesQueryOptions(),
    enabled: remoteEnabled,
  })
}

export function useInquiryCategoryMutations() {
  const queryClient = useQueryClient()
  const categoriesKey = postsQueryKeys.inquiries.categories()

  const createMutation = useMutation({
    mutationFn: createInquiryCategory,
    retry: false,
    onSuccess: created => applyCreatedCategoryList(queryClient, categoriesKey, created),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateInquiryCategory(id, name),
    retry: false,
    onSuccess: (_data, { id, name }) =>
      applyRenamedCategoryList(queryClient, categoriesKey, id, name),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInquiryCategory,
    retry: false,
    onSuccess: (_data, id) => applyDeletedCategoryList(queryClient, categoriesKey, id),
  })

  return { createMutation, updateMutation, deleteMutation }
}
