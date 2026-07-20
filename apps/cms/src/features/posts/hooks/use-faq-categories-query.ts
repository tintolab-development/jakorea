import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFaqCategory,
  deleteFaqCategory,
  getFaqCategories,
  updateFaqCategory,
} from '@/features/posts/api/faqs/admin-faqs-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useFaqCategoriesQuery(enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('faqs', enabled)

  return useQuery({
    queryKey: postsQueryKeys.faqs.categories(),
    queryFn: getFaqCategories,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useFaqCategoryMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: postsQueryKeys.faqs.categories() })
  }

  const createMutation = useMutation({
    mutationFn: createFaqCategory,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFaqCategory(id, name),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaqCategory,
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, deleteMutation }
}
