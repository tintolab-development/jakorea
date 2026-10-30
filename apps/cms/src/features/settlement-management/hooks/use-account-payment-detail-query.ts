import { useEffect } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { getAccountPaymentDetailRemote } from '@/features/settlement-management/api/account-payments/admin-account-payments-service'
import { discardAccountPaymentPlaintextCache } from '@/features/settlement-management/api/clear-settlement-query-cache'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementRemoteEnabled } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { queryClient } from '@/shared/lib/query-client'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

export function accountPaymentDetailQueryOptions(row: AccountPaymentRow) {
  return queryOptions({
    queryKey: settlementQueryKeys.accountPayments.detail(row.id),
    queryFn: () => getAccountPaymentDetailRemote(row),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useAccountPaymentDetailQuery(row: AccountPaymentRow | null, open: boolean) {
  const userId = useAuthStore(state => state.user?.id ?? '')
  const roleCode = useAuthStore(state => state.user?.roleCode ?? '')
  const remoteEnabled = useSettlementRemoteEnabled(
    'accountPayments',
    open && row != null && row.accountPaymentId != null
  )
  const queryKey = [
    ...settlementQueryKeys.accountPayments.detail(row?.id ?? ''),
    userId,
    roleCode,
  ] as const
  const queryKeyId = `${row?.id ?? ''}\0${userId}\0${roleCode}`

  useEffect(() => {
    if (!open) {
      discardAccountPaymentPlaintextCache()
      return
    }
    const key = queryKey
    return () => {
      void queryClient.cancelQueries({ queryKey: key })
      queryClient.removeQueries({ queryKey: key })
    }
    // queryKey 내용은 queryKeyId와 같다. 배열 참조를 의존성에 넣으면 매 렌더마다 요청이 취소된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, queryKeyId])

  return useQuery({
    queryKey,
    queryFn: () => {
      if (!row) throw new Error('계좌 지급 상세 행이 없습니다.')
      return getAccountPaymentDetailRemote(row)
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    enabled: remoteEnabled,
  })
}
