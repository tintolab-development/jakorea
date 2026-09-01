import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SettlementItemSettingDetail } from '@/data/mock/settlement-item-setting-detail.mock'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import { getSettlementConfigRemote } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { buildSettlementConfigUpdateRequest } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-detail-to-upsert'
import {
  deleteSettlementConfigItemRemote,
  duplicateSettlementConfigItemRemote,
  updateCurrentSettlementConfigRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

const SETTLEMENT_CONFIG_ITEM_KIND_LOCKED = 'SETTLEMENT_CONFIG_ITEM_KIND_LOCKED'
export const SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE =
  '임금/공제 항목은 복제·삭제할 수 없습니다'

export function resolveSettlementConfigMutationError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      response?: { data?: { message?: string; error?: { code?: string; message?: string } } }
      message?: string
    }
    const code = err.response?.data?.error?.code
    const message =
      err.response?.data?.error?.message ??
      err.response?.data?.message ??
      err.message
    if (code === SETTLEMENT_CONFIG_ITEM_KIND_LOCKED) {
      return SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE
    }
    if (typeof message === 'string' && message.trim()) return message.trim()
  }
  return '요청을 처리하지 못했습니다.'
}

export function useUpdateSettlementConfigItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      config: SettlementConfigResponse
      item: SettlementItemSettingRow
      detail: SettlementItemSettingDetail
      meta: { title: string; description: string; emojiOverride?: string | null }
    }) => {
      const body = buildSettlementConfigUpdateRequest(
        input.config,
        input.item,
        input.detail,
        input.meta
      )
      return updateCurrentSettlementConfigRemote(body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settlementQueryKeys.settlementConfigs.current() })
    },
  })
}

export function useDuplicateSettlementConfigPaymentItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => duplicateSettlementConfigItemRemote('payment', itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settlementQueryKeys.settlementConfigs.current() })
    },
  })
}

export function useDeleteSettlementConfigPaymentItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => deleteSettlementConfigItemRemote('payment', itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settlementQueryKeys.settlementConfigs.current() })
    },
  })
}

export function usePrefetchSettlementConfigQuery() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.fetchQuery({
      queryKey: settlementQueryKeys.settlementConfigs.current(),
      queryFn: () => getSettlementConfigRemote(),
    })
}
