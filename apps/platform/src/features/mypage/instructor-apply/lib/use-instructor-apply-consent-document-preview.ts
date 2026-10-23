import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { InstructorConsentDocumentKey } from '@jakorea/domain/instructor/consent'
import {
  isInstructorApplyConsentKey,
  type InstructorApplyConsentKey,
} from '../consent/catalog'
import {
  loadSchemaConsentWriteState,
  type ConsentSignatureSidecar,
} from '../consent/schema-draft-persist'
import { fetchPortalConsents } from '../../settings/api/consents'
import type { SettingsConsentItem } from '../../settings/lib/consent-catalog'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  buildInstructorApplyConsentPreviewFallbackItem,
  mapPortalConsentsToInstructorApplyPreviewItems,
} from './map-portal-consents-to-apply'

const EMPTY_LOCAL_WRITE = {
  draft: { schemaVersion: 1 as const, formSettings: { titleNumbering: 'numeric' as const }, paragraphs: [] },
}

function readLocalSignatureImageSrc(
  signatures: ConsentSignatureSidecar | undefined,
): string | undefined {
  const raw = signatures?.final ?? signatures?.mid
  if (raw == null) return undefined
  if (typeof raw === 'string') return raw.trim() || undefined
  return raw.dataUrl?.trim() || undefined
}

export function useInstructorApplyConsentDocumentPreview() {
  const isRemoteSession = isRemoteApiConfigured() && Boolean(getAccessToken())
  const consentsQuery = useQuery({
    queryKey: platformQueryKeys.mypage.consents(),
    queryFn: ({ signal }) => fetchPortalConsents(signal),
    enabled: isRemoteSession,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
  const [previewKey, setPreviewKey] = useState<InstructorApplyConsentKey | null>(null)

  const itemsByKey = useMemo(
    () => mapPortalConsentsToInstructorApplyPreviewItems(consentsQuery.data ?? []),
    [consentsQuery.data],
  )

  const previewItem: SettingsConsentItem | null =
    previewKey == null
      ? null
      : (itemsByKey[previewKey] ?? buildInstructorApplyConsentPreviewFallbackItem(previewKey))

  const localWrite =
    previewKey == null ? null : loadSchemaConsentWriteState(previewKey, EMPTY_LOCAL_WRITE)
  const fallbackDraft =
    localWrite != null && localWrite.draft.paragraphs.length > 0 ? localWrite.draft : null

  return {
    previewItem,
    fallbackDraft,
    fallbackPaymentBasicInfo: localWrite?.paymentBasicInfo,
    fallbackSignatureImageSrc: readLocalSignatureImageSrc(localWrite?.signatures),
    isRemoteSession,
    openPreview: (key: InstructorConsentDocumentKey) => {
      if (isInstructorApplyConsentKey(key)) setPreviewKey(key)
    },
    closePreview: () => setPreviewKey(null),
  }
}
