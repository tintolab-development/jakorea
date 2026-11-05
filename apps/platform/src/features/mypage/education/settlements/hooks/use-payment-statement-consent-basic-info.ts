import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import { fetchPortalConsentDocument } from '@/features/mypage/settings/api/consents'
import { useSettingsConsents } from '@/features/mypage/settings/hooks/use-settings-consents'
import { pickPaymentStatementConsentDocumentId } from '@/features/mypage/settings/lib/payment-statement-consent-status'
import { readPaymentBasicInfoFromConsentDetail } from '@/features/mypage/settings/lib/parse-consent-document-draft'
import { pickReceiptPreConsentDocumentId } from '../lib/receipt-consent-status'
import type { SettlementDocumentKind } from '../lib/settlement-status-ui'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

export function useSettlementConsentSidecar(
  kind: SettlementDocumentKind | null,
): {
  isLoading: boolean
  sidecar: Partial<PaymentStatementBasicInfoValues> | undefined
} {
  const enabled = kind != null
  const consents = useSettingsConsents()
  const documentId = enabled
    ? kind === 'receipt'
      ? pickReceiptPreConsentDocumentId(consents.documentItems)
      : pickPaymentStatementConsentDocumentId(consents.documentItems)
    : null
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.consentDocument(documentId ?? 0),
    queryFn: ({ signal }) => fetchPortalConsentDocument(documentId!, signal),
    enabled: enabled && documentId != null,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const sidecar = useMemo(
    () => readPaymentBasicInfoFromConsentDetail(query.data),
    [query.data],
  )

  return {
    isLoading: Boolean(
      enabled && (consents.isLoading || (documentId != null && query.isPending && !query.data)),
    ),
    sidecar,
  }
}
