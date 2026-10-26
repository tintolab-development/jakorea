import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPortalConsentDocument } from '@/features/mypage/settings/api/consents'
import { useSettingsConsents } from '@/features/mypage/settings/hooks/use-settings-consents'
import { pickPaymentStatementConsentDocumentId } from '@/features/mypage/settings/lib/payment-statement-consent-status'
import { readPaymentBasicInfoFromConsentDetail } from '@/features/mypage/settings/lib/parse-consent-document-draft'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  mapPaymentStatementBasicInfoToSettlementBasic,
  type SettlementBasicInfo,
} from '../lib/map-payment-statement-basic-info'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

export function usePaymentStatementConsentBasicInfo(enabled: boolean): {
  isLoading: boolean
  basic: Partial<SettlementBasicInfo>
} {
  const consents = useSettingsConsents()
  const documentId = enabled ? pickPaymentStatementConsentDocumentId(consents.documentItems) : null
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

  const basic = useMemo(
    () => mapPaymentStatementBasicInfoToSettlementBasic(readPaymentBasicInfoFromConsentDetail(query.data)),
    [query.data],
  )

  return {
    isLoading: Boolean(
      enabled && (consents.isLoading || (documentId != null && query.isPending && !query.data)),
    ),
    basic,
  }
}
