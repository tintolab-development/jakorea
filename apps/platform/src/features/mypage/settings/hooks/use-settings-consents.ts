import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { useMypageMember } from '../../hooks/use-mypage-member'
import { fetchPortalConsents } from '../api/consents'
import {
  DOCUMENT_CONSENT_ITEMS,
  getBasicConsentItems,
  type SettingsConsentItem,
} from '../lib/consent-catalog'
import {
  filterBasicConsentItemsByAudience,
  isMinorSettingsMember,
  isTeacherSettingsProfile,
} from '../lib/consent-visibility'
import { buildConsentItemsFromSummaries } from '../lib/map-consents'
import { ensurePinnedPaymentStatementConsentItem } from '../lib/payment-statement-consent-status'

const CONSENTS_STALE_MS = 30_000

export function useSettingsConsents(): {
  isRemoteSession: boolean
  isLoading: boolean
  isError: boolean
  basicItems: SettingsConsentItem[]
  documentItems: SettingsConsentItem[]
} {
  const member = useMypageMember()
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.consents(),
    queryFn: ({ signal }) => fetchPortalConsents(signal),
    enabled: member.isRemoteSession,
    staleTime: CONSENTS_STALE_MS,
    refetchOnWindowFocus: false,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const audience = {
    isTeacher: isTeacherSettingsProfile(member.profile),
    isMinor: isMinorSettingsMember({
      under14: member.under14,
      ageGroup: member.ageGroup,
      birthDate: member.birthDate,
    }),
  }

  if (!member.isRemoteSession) {
    return {
      isRemoteSession: false,
      isLoading: false,
      isError: false,
      basicItems: getBasicConsentItems(audience),
      documentItems: ensurePinnedPaymentStatementConsentItem(DOCUMENT_CONSENT_ITEMS),
    }
  }

  const built = buildConsentItemsFromSummaries(query.data ?? [])

  return {
    isRemoteSession: true,
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    basicItems: filterBasicConsentItemsByAudience(built.basicItems, audience),
    documentItems: ensurePinnedPaymentStatementConsentItem(built.documentItems),
  }
}
