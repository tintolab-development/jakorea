import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  HERO_DESCRIPTION_LINES,
  HERO_TITLE_LINES,
  WHY_CARDS,
  CTA_SECTION_BUTTON_LABEL,
  CTA_SECTION_DONATION_URL,
} from '../lib/constants'
import { HERO_IMAGE_URL } from '../lib/hero-image'
import { readHttpDonationUrl } from '../lib/donation-url'
import { buildPersonalSponsorshipView, type PersonalSponsorshipView } from '../lib/overlay'
import { fetchPublicPersonalSponsorship } from './client'

const PERSONAL_STALE_MS = 2 * 60_000
const PERSONAL_GC_MS = 15 * 60_000

export function publicPersonalSponsorshipQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.sponsorship.personal(),
    queryFn: ({ signal }) => fetchPublicPersonalSponsorship(signal),
    staleTime: PERSONAL_STALE_MS,
    gcTime: PERSONAL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function usePublicPersonalSponsorshipView(): PersonalSponsorshipView & {
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicPersonalSponsorshipQueryOptions(),
    enabled: remote,
  })

  const view = useMemo(() => {
    if (!remote || query.isError || !query.data) {
      return buildPersonalSponsorshipView(undefined, {
        fallbackTitleLines: HERO_TITLE_LINES,
        fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
        fallbackHeroImageUrl: HERO_IMAGE_URL,
        fallbackWhyCards: WHY_CARDS,
      })
    }
    return buildPersonalSponsorshipView(query.data, {
      fallbackTitleLines: HERO_TITLE_LINES,
      fallbackDescriptionLines: HERO_DESCRIPTION_LINES,
      fallbackHeroImageUrl: HERO_IMAGE_URL,
      fallbackWhyCards: WHY_CARDS,
    })
  }, [query.data, query.isError, remote])

  return {
    ...view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function usePublicPersonalDonationCta(): {
  href: string | null
  label: string
  isPending: boolean
} {
  const view = usePublicPersonalSponsorshipView()
  return {
    href:
      readHttpDonationUrl(view.donationUrl) ??
      readHttpDonationUrl(CTA_SECTION_DONATION_URL),
    label: view.donationButtonLabel || CTA_SECTION_BUTTON_LABEL,
    isPending: view.isPending,
  }
}
