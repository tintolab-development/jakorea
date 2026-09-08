import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMailCategory,
  createMailTemplate,
  deleteMailCategory,
  deleteMailTemplate,
  getMailCategoryTree,
  getMailSendTemplatePicker,
  getMailTemplateDetail,
  getMailTemplatePreview,
  moveMailCategory,
  moveMailTemplate,
  updateMailCategory,
  updateMailTemplate,
} from '@/features/notifications/api/mail-template-service'
import type { MailCategoryTreeMapped } from '@/features/notifications/api/adapters/mail-template-adapters'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { useNotificationsRemoteEnabled } from '@/features/notifications/hooks/use-notifications-remote-enabled'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'

export function useMailCategoryTreeQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = searchParams.toString()
  return useQuery({
    queryKey: notificationsQueryKeys.mailTemplates.tree(searchParamsKey),
    queryFn: () => getMailCategoryTree(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useMailTemplateDetailQuery(templateId: string | null, enabled = true) {
  const remoteEnabled = useNotificationsRemoteEnabled(enabled && Boolean(templateId))
  return useQuery({
    queryKey: notificationsQueryKeys.mailTemplates.detail(templateId ?? ''),
    queryFn: () => getMailTemplateDetail(templateId!),
    enabled: remoteEnabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useMailTemplatePreviewQuery(
  templateId: string | null,
  fallback: MailTemplateItem | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: notificationsQueryKeys.mailTemplates.preview(templateId ?? ''),
    queryFn: () => getMailTemplatePreview(templateId!, fallback),
    enabled: enabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

function applyMutationTreeToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tree: MailCategoryTreeMapped
) {
  queryClient.setQueryData(notificationsQueryKeys.mailTemplates.tree(''), tree)
  queryClient.setQueriesData<MailCategoryTreeMapped>(
    { queryKey: [...notificationsQueryKeys.mailTemplates.all(), 'tree'] },
    tree
  )
}

function removeTemplateDetailCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  templateId: string
) {
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.mailTemplates.detail(templateId),
  })
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.mailTemplates.preview(templateId),
  })
}

async function invalidateMailTemplateCaches(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    queryKey: notificationsQueryKeys.mailTemplates.all(),
  })
}

export function useMailTemplateTreeMutations() {
  const queryClient = useQueryClient()

  const createCategory = useMutation({
    mutationFn: createMailCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const updateCategory = useMutation({
    mutationFn: updateMailCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteCategory = useMutation({
    mutationFn: deleteMailCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteTemplate = useMutation({
    mutationFn: deleteMailTemplate,
    onSuccess: (tree, templateId) => {
      applyMutationTreeToCache(queryClient, tree)
      removeTemplateDetailCaches(queryClient, templateId)
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.mailTemplates.picker(),
      })
    },
  })
  const moveCategory = useMutation({
    mutationFn: moveMailCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const moveTemplate = useMutation({
    mutationFn: moveMailTemplate,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const createTemplate = useMutation({
    mutationFn: createMailTemplate,
    onSuccess: async result => {
      await invalidateMailTemplateCaches(queryClient)
      removeTemplateDetailCaches(queryClient, result.templateId)
    },
  })
  const updateTemplate = useMutation({
    mutationFn: updateMailTemplate,
    onSuccess: async result => {
      await invalidateMailTemplateCaches(queryClient)
      removeTemplateDetailCaches(queryClient, result.templateId)
    },
  })

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    deleteTemplate,
    moveCategory,
    moveTemplate,
    createTemplate,
    updateTemplate,
  }
}

export function useMailSendTemplatePickerQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.mailTemplates.picker(),
    queryFn: () => getMailSendTemplatePicker(),
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
