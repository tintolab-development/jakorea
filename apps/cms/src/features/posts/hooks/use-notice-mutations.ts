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
import { discardDeletedDetailQuery } from '@/features/posts/lib/leave-deleted-detail'
import {
  applyCreatedNoticeToLists,
  applyDeletedNoticeToLists,
  applyUpdatedNoticeToLists,
  invalidateNoticeLists,
} from '@/features/posts/lib/notice-query-cache'

export function useNoticeMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: async created => {
      if (!created.id) {
        await invalidateNoticeLists(queryClient)
        return
      }
      queryClient.setQueryData(postsQueryKeys.notices.detail(created.id), created)
      applyCreatedNoticeToLists(queryClient, created)
    },
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
    onSuccess: async updated => {
      if (!updated.id) {
        await invalidateNoticeLists(queryClient)
        return
      }
      queryClient.setQueryData(postsQueryKeys.notices.detail(updated.id), updated)
      applyUpdatedNoticeToLists(queryClient, updated)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: (_data, id) => {
      discardDeletedDetailQuery(queryClient, postsQueryKeys.notices.detail(id))
      applyDeletedNoticeToLists(queryClient, id)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteNotices,
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        discardDeletedDetailQuery(queryClient, postsQueryKeys.notices.detail(id))
        applyDeletedNoticeToLists(queryClient, id)
      }
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
  }
}
