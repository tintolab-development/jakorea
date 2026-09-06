import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAlimtalkCategory,
  deleteAlimtalkCategory,
  deleteAlimtalkTemplate,
  getAlimtalkCategoryTree,
  getAlimtalkTemplateDetail,
  getAlimtalkTemplatePreview,
  moveAlimtalkCategory,
  moveAlimtalkTemplate,
  syncAlimtalkCatalogFromNhn,
  updateAlimtalkCategory,
} from '@/features/notifications/api/alimtalk-template-service'
import type { AlimtalkCategoryTreeMapped } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { useNotificationsRemoteEnabled } from '@/features/notifications/hooks/use-notifications-remote-enabled'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'

export function useAlimtalkCategoryTreeQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkTemplates.tree(searchParamsKey),
    queryFn: () => getAlimtalkCategoryTree(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAlimtalkTemplateDetailQuery(templateId: string | null, enabled = true) {
  const remoteEnabled = useNotificationsRemoteEnabled(enabled && Boolean(templateId))
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkTemplates.detail(templateId ?? ''),
    queryFn: () => getAlimtalkTemplateDetail(templateId!),
    enabled: remoteEnabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useAlimtalkTemplatePreviewQuery(
  templateId: string | null,
  fallback: AlimtalkTemplateItem | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkTemplates.preview(templateId ?? ''),
    queryFn: () => getAlimtalkTemplatePreview(templateId!, fallback),
    enabled: enabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

/** CRUD/move/delete 성공 시 응답 tree로 캐시 교체. 추가 GET/sync 금지. */
function applyMutationTreeToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tree: AlimtalkCategoryTreeMapped
) {
  queryClient.setQueryData(notificationsQueryKeys.alimtalkTemplates.tree(''), tree)
  queryClient.setQueriesData<AlimtalkCategoryTreeMapped>(
    { queryKey: [...notificationsQueryKeys.alimtalkTemplates.all(), 'tree'] },
    tree
  )
}

function removeTemplateDetailCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  templateId: string
) {
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.alimtalkTemplates.detail(templateId),
  })
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.alimtalkTemplates.preview(templateId),
  })
}

export function useAlimtalkTemplateTreeMutations() {
  const queryClient = useQueryClient()

  const createCategory = useMutation({
    mutationFn: createAlimtalkCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const updateCategory = useMutation({
    mutationFn: updateAlimtalkCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteCategory = useMutation({
    mutationFn: deleteAlimtalkCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteTemplate = useMutation({
    mutationFn: deleteAlimtalkTemplate,
    onSuccess: (tree, templateId) => {
      applyMutationTreeToCache(queryClient, tree)
      removeTemplateDetailCaches(queryClient, templateId)
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.alimtalkTemplates.picker(),
      })
    },
  })
  const moveCategory = useMutation({
    mutationFn: moveAlimtalkCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const moveTemplate = useMutation({
    mutationFn: moveAlimtalkTemplate,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const syncCatalog = useMutation({
    mutationFn: syncAlimtalkCatalogFromNhn,
    onSuccess: async () => {
      // sync 후에만 GET tree (호출측 refetch 또는 invalidate)
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.alimtalkTemplates.all(),
      })
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.alimtalkSend.senderProfiles(),
      })
    },
  })

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    deleteTemplate,
    moveCategory,
    moveTemplate,
    syncCatalog,
  }
}
