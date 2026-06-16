import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createNotice,
  deleteNotice,
  deleteNotices,
  updateNotice,
} from '@/features/posts/api/notices/admin-notices-service'
import { postsQueryKeys } from '@/features/posts/api/posts-query-keys'
import type { Notice } from '@/data/mock/notices'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'

export function useNoticeMutations() {
  const queryClient = useQueryClient()

  const invalidateNotices = () => {
    void queryClient.invalidateQueries({ queryKey: postsQueryKeys.notices.all() })
  }

  const createMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: invalidateNotices,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      existing,
      params,
    }: {
      id: string
      existing: Notice
      params: BuildNoticeBodyParams
    }) => updateNotice(id, existing, params),
    onSuccess: (_data, variables) => {
      invalidateNotices()
      void queryClient.invalidateQueries({
        queryKey: postsQueryKeys.notices.detail(variables.id),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: invalidateNotices,
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteNotices,
    onSuccess: invalidateNotices,
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
  }
}
