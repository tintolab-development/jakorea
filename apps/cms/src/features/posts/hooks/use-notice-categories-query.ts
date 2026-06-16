import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNoticeCategory,
  deleteNoticeCategory,
  getNoticeCategories,
  updateNoticeCategory,
} from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import { usePostsRemoteEnabled } from '@/features/posts/hooks/use-posts-remote-enabled'

export function useNoticeCategoriesQuery(enabled = true) {
  const remoteEnabled = usePostsRemoteEnabled('notices', enabled)

  return useQuery({
    queryKey: postsQueryKeys.notices.categories(),
    queryFn: getNoticeCategories,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useNoticeCategoryMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: postsQueryKeys.notices.categories() })
  }

  const createMutation = useMutation({
    mutationFn: createNoticeCategory,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateNoticeCategory(id, name),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNoticeCategory,
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, deleteMutation }
}
