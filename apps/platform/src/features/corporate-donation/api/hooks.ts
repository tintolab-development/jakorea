import { useMutation, queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { HOME_PARTNER_LOGO_ROWS, type HomePartnerLogo } from '@/features/home'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  HERO_DESCRIPTION_LINES,
  HERO_TITLE_LINES,
} from '../lib/constants'
import { HERO_IMAGE_URL } from '../lib/hero-image'
import {
  buildCorporateSponsorshipView,
  mapCorporateSponsorRows,
  type CorporateSponsorshipView,
} from '../lib/overlay'
import {
  createPublicCorporateConsultation,
  fetchPublicCorporateSponsorship,
  fetchPublicCorporateSponsors,
  uploadPublicCorporateConsultationAttachment,
  uploadPublicCorporateConsultationAttachments,
} from './client'
import type { PublicCorporateConsultationCreateRequest } from './types'

const CORPORATE_STALE_MS = 2 * 60_000
const CORPORATE_GC_MS = 15 * 60_000
const SPONSORS_STALE_MS = 30_000
const SPONSORS_GC_MS = 15 * 60_000

export function publicCorporateSponsorshipQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.sponsorship.corporate(),
    queryFn: ({ signal }) => fetchPublicCorporateSponsorship(signal),
    staleTime: CORPORATE_STALE_MS,
    gcTime: CORPORATE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function publicCorporateSponsorsQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.sponsorship.corporateSponsors(),
    queryFn: ({ signal }) => fetchPublicCorporateSponsors(signal),
    staleTime: SPONSORS_STALE_MS,
    gcTime: SPONSORS_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function usePublicCorporateSponsorshipView(): CorporateSponsorshipView & {
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicCorporateSponsorshipQueryOptions(),
    enabled: remote,
  })

  const view = useMemo(() => {
    if (!remote || query.isError || !query.data) {
      return buildCorporateSponsorshipView(undefined, {
        fallbackTitleLines: HERO_TITLE_LINES,
        fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
        fallbackHeroImageUrl: HERO_IMAGE_URL,
      })
    }
    return buildCorporateSponsorshipView(query.data, {
      fallbackTitleLines: HERO_TITLE_LINES,
      fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
      fallbackHeroImageUrl: HERO_IMAGE_URL,
    })
  }, [query.data, query.isError, remote])

  return {
    ...view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function usePublicCorporatePartnerRows(): {
  rows: readonly (readonly HomePartnerLogo[])[]
  isPending: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicCorporateSponsorsQueryOptions(),
    enabled: remote,
  })

  const rows = useMemo(() => {
    if (!remote || query.isError) return HOME_PARTNER_LOGO_ROWS
    if (!query.data) return HOME_PARTNER_LOGO_ROWS
    return mapCorporateSponsorRows(query.data, HOME_PARTNER_LOGO_ROWS)
  }, [query.data, query.isError, remote])

  return {
    rows,
    isPending: remote && query.isPending,
  }
}

export function useCreatePublicCorporateConsultation() {
  return useMutation({
    mutationFn: async (body: PublicCorporateConsultationCreateRequest) => {
      if (!isHomepageApiConfigured()) {
        throw new Error('문의 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      return createPublicCorporateConsultation(body)
    },
    retry: false,
  })
}

export function useUploadPublicCorporateConsultationAttachment() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!isHomepageApiConfigured()) {
        throw new Error('파일 업로드 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      return uploadPublicCorporateConsultationAttachment(file)
    },
    retry: false,
  })
}

export function useUploadPublicCorporateConsultationAttachments() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      if (!isHomepageApiConfigured()) {
        throw new Error('파일 업로드 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      return uploadPublicCorporateConsultationAttachments(files)
    },
    retry: false,
  })
}
