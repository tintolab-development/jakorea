import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { useMypageMember } from '../../hooks/use-mypage-member'
import { fetchPortalConsents } from '../api/consents'
import {
  BASIC_CONSENT_ITEMS,
  INSTRUCTOR_DOCUMENT_CONSENT_ITEMS,
  type SettingsConsentItem,
} from '../lib/consent-catalog'
import { mergeConsentItemsWithSummaries } from '../lib/map-consents'

const CONSENTS_STALE_MS = 30_000

export function useSettingsConsents(): {
  isRemoteSession: boolean
  isLoading: boolean
  isError: boolean
  basicItems: SettingsConsentItem[]
  instructorItems: SettingsConsentItem[]
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

  if (!member.isRemoteSession) {
    return {
      isRemoteSession: false,
      isLoading: false,
      isError: false,
      basicItems: BASIC_CONSENT_ITEMS,
      instructorItems: INSTRUCTOR_DOCUMENT_CONSENT_ITEMS,
    }
  }

  const summaries = query.data ?? []
  return {
    isRemoteSession: true,
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    basicItems: mergeConsentItemsWithSummaries(BASIC_CONSENT_ITEMS, summaries),
    instructorItems: mergeConsentItemsWithSummaries(INSTRUCTOR_DOCUMENT_CONSENT_ITEMS, summaries),
  }
}
