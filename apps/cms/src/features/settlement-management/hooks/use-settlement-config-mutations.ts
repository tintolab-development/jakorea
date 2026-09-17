import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SettlementItemSettingDetail } from '@/data/mock/settlement-item-setting-detail.mock'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import {
  buildSettlementConfigQueryData,
  getSettlementConfigRemote,
} from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { resolveDuplicatedPaymentItem } from '@/features/settlement-management/api/settlement-configs/duplicate-response'
import { buildSettlementConfigUpdateRequest } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-detail-to-upsert'
import {
  deleteSettlementConfigPaymentItemRemote,
  duplicateSettlementConfigPaymentItemRemote,
  updateCurrentSettlementConfigRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

const SETTLEMENT_CONFIG_ITEM_KIND_LOCKED = 'SETTLEMENT_CONFIG_ITEM_KIND_LOCKED'
const SETTLEMENT_CONFIG_ITEM_NOT_FOUND = 'SETTLEMENT_CONFIG_ITEM_NOT_FOUND'
export const SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE = '임금/공제 항목은 복제·삭제할 수 없습니다'
const SETTLEMENT_CONFIG_ITEM_NOT_FOUND_MESSAGE =
  '현재 정산 설정에서 대상 지급 항목을 찾을 수 없습니다.'

export function resolveSettlementConfigMutationError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      response?: { data?: { message?: string; error?: { code?: string; message?: string } } }
      message?: string
    }
    const code = err.response?.data?.error?.code
    const message = err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message
    if (code === SETTLEMENT_CONFIG_ITEM_KIND_LOCKED) {
      return SETTLEMENT_CONFIG_ITEM_KIND_LOCKED_MESSAGE
    }
    if (code === SETTLEMENT_CONFIG_ITEM_NOT_FOUND) {
      return SETTLEMENT_CONFIG_ITEM_NOT_FOUND_MESSAGE
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
    onSuccess: async config => {
      queryClient.setQueryData(
        settlementQueryKeys.settlementConfigs.current(),
        buildSettlementConfigQueryData(config)
      )
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKeys.settlementConfigs.current(),
      })
    },
  })
}

export function useDuplicateSettlementConfigPaymentItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { itemId: number; currentConfig: SettlementConfigResponse }) => {
      const config = await duplicateSettlementConfigPaymentItemRemote(input.itemId)
      const duplicated = resolveDuplicatedPaymentItem(input.currentConfig, config, input.itemId)
      return { config, duplicatedItemId: duplicated.id }
    },
    onSuccess: async ({ config }) => {
      queryClient.setQueryData(
        settlementQueryKeys.settlementConfigs.current(),
        buildSettlementConfigQueryData(config)
      )
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKeys.settlementConfigs.current(),
      })
    },
  })
}

export function useDeleteSettlementConfigPaymentItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: number) => deleteSettlementConfigPaymentItemRemote(itemId),
    onSuccess: async config => {
      queryClient.setQueryData(
        settlementQueryKeys.settlementConfigs.current(),
        buildSettlementConfigQueryData(config)
      )
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKeys.settlementConfigs.current(),
      })
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
