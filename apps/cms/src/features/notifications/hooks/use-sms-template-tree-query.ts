import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSmsCategory,
  createSmsTemplate,
  deleteSmsCategory,
  deleteSmsTemplate,
  getSmsCategoryTree,
  getSmsTemplateDetail,
  getSmsTemplatePreview,
  moveSmsCategory,
  moveSmsTemplate,
  syncSmsCatalog,
  updateSmsCategory,
  updateSmsTemplate,
} from '@/features/notifications/api/sms-template-service'
import type { SmsCategoryTreeMapped } from '@/features/notifications/api/adapters/sms-template-adapters'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { useNotificationsRemoteEnabled } from '@/features/notifications/hooks/use-notifications-remote-enabled'
import {
  applySmsFiltersToSearchParams,
  pendingFiltersFromSearchParams,
} from '@/features/notifications/model/sms-template/filter-url'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'

function smsTreeSearchParamsKey(searchParams: URLSearchParams): string {
  return applySmsFiltersToSearchParams(
    new URLSearchParams(),
    pendingFiltersFromSearchParams(searchParams)
  ).toString()
}

export function useSmsCategoryTreeQuery(searchParams: URLSearchParams, enabled = true) {
  const searchParamsKey = smsTreeSearchParamsKey(searchParams)
  return useQuery({
    queryKey: notificationsQueryKeys.smsTemplates.tree(searchParamsKey),
    queryFn: () => getSmsCategoryTree(new URLSearchParams(searchParamsKey)),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useSmsTemplateDetailQuery(templateId: string | null, enabled = true) {
  const remoteEnabled = useNotificationsRemoteEnabled(enabled && Boolean(templateId))
  return useQuery({
    queryKey: notificationsQueryKeys.smsTemplates.detail(templateId ?? ''),
    queryFn: () => getSmsTemplateDetail(templateId!),
    enabled: remoteEnabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useSmsTemplatePreviewQuery(
  templateId: string | null,
  fallback: SmsTemplateItem | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: notificationsQueryKeys.smsTemplates.preview(templateId ?? ''),
    queryFn: () => getSmsTemplatePreview(templateId!, fallback),
    enabled: enabled && Boolean(templateId),
    staleTime: 30_000,
    retry: false,
  })
}

function applyMutationTreeToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tree: SmsCategoryTreeMapped
) {
  queryClient.setQueryData(notificationsQueryKeys.smsTemplates.tree(''), tree)
  void queryClient.invalidateQueries({
    queryKey: [...notificationsQueryKeys.smsTemplates.all(), 'tree'],
    predicate: query => {
      const key = query.queryKey
      const paramsKey = key[key.length - 1]
      return typeof paramsKey === 'string' && paramsKey !== ''
    },
  })
}

function removeTemplateDetailCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  templateId: string
) {
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.smsTemplates.detail(templateId),
  })
  queryClient.removeQueries({
    queryKey: notificationsQueryKeys.smsTemplates.preview(templateId),
  })
}

async function invalidateSmsTemplateCaches(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    queryKey: notificationsQueryKeys.smsTemplates.all(),
  })
}

export function useSmsTemplateTreeMutations() {
  const queryClient = useQueryClient()

  const createCategory = useMutation({
    mutationFn: createSmsCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const updateCategory = useMutation({
    mutationFn: updateSmsCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteCategory = useMutation({
    mutationFn: deleteSmsCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const deleteTemplate = useMutation({
    mutationFn: deleteSmsTemplate,
    onSuccess: (tree, templateId) => {
      applyMutationTreeToCache(queryClient, tree)
      removeTemplateDetailCaches(queryClient, templateId)
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.smsTemplates.picker(),
      })
    },
  })
  const moveCategory = useMutation({
    mutationFn: moveSmsCategory,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const moveTemplate = useMutation({
    mutationFn: moveSmsTemplate,
    onSuccess: tree => applyMutationTreeToCache(queryClient, tree),
  })
  const createTemplate = useMutation({
    mutationFn: createSmsTemplate,
    onSuccess: async result => {
      await invalidateSmsTemplateCaches(queryClient)
      removeTemplateDetailCaches(queryClient, result.templateId)
    },
  })
  const updateTemplate = useMutation({
    mutationFn: updateSmsTemplate,
    onSuccess: async result => {
      await invalidateSmsTemplateCaches(queryClient)
      removeTemplateDetailCaches(queryClient, result.templateId)
    },
  })
  const syncCatalog = useMutation({
    mutationFn: syncSmsCatalog,
    onSuccess: async () => {
      await invalidateSmsTemplateCaches(queryClient)
      await queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.smsSend.senderProfiles(),
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
    createTemplate,
    updateTemplate,
    syncCatalog,
  }
}
