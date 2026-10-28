import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  HERO_DESCRIPTION_LINES,
  HERO_TITLE_LINES,
} from '../lib/constants'
import { buildTalentSponsorshipView, type TalentSponsorshipView } from '../lib/overlay'
import {
  createPublicTalentApplication,
  fetchPublicTalentIntro,
  uploadTalentApplicationAttachments,
} from './client'
import type { PublicTalentApplicationCreateRequest } from './types'

const TALENT_STALE_MS = 2 * 60_000
const TALENT_GC_MS = 15 * 60_000

export function publicTalentIntroQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.sponsorship.talent(),
    queryFn: ({ signal }) => fetchPublicTalentIntro(signal),
    staleTime: TALENT_STALE_MS,
    gcTime: TALENT_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function usePublicTalentSponsorshipView(): TalentSponsorshipView & {
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTalentIntroQueryOptions(),
    enabled: remote,
  })

  const view = useMemo(() => {
    if (!remote || query.isError || !query.data) {
      return buildTalentSponsorshipView(undefined, {
        fallbackTitleLines: HERO_TITLE_LINES,
        fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
      })
    }
    return buildTalentSponsorshipView(query.data, {
      fallbackTitleLines: HERO_TITLE_LINES,
      fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
    })
  }, [query.data, query.isError, remote])

  return {
    ...view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function useCreatePublicTalentApplication() {
  return useMutation({
    mutationFn: async (input: {
      body: PublicTalentApplicationCreateRequest
      attachmentFiles?: File[]
    }) => {
      if (!isHomepageApiConfigured()) {
        throw new Error('신청 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      const uploadedIds = await uploadTalentApplicationAttachments(input.attachmentFiles ?? [])
      const attachmentAssetIds =
        uploadedIds.length > 0 ? uploadedIds : input.body.attachmentAssetIds
      const attachmentAssetId = attachmentAssetIds?.[0] ?? input.body.attachmentAssetId
      return createPublicTalentApplication({
        ...input.body,
        ...(attachmentAssetId != null ? { attachmentAssetId } : {}),
        ...(attachmentAssetIds && attachmentAssetIds.length > 0 ? { attachmentAssetIds } : {}),
        privacyAgreed: true,
      })
    },
    retry: false,
  })
}
