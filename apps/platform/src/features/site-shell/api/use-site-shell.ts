import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchPublicSiteFooter, fetchPublicSiteGnb, fetchPublicSiteSettings } from './client'
import { mapPublicFooter, SITE_FOOTER_FALLBACK, type SiteFooterView } from '../lib/map-public-footer'
import { mapPublicGnb, SITE_GNB_FALLBACK, type SiteGnbView } from '../lib/map-public-gnb'
import {
  mapPublicSettings,
  SITE_SETTINGS_FALLBACK,
  type SiteSettingsView,
} from '../lib/map-public-settings'

function shouldRetrySiteShell(failureCount: number, error: unknown): boolean {
  if (!shouldRetryQuery(failureCount, error)) return false
  return failureCount < 1
}

const siteShellQueryDefaults = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetrySiteShell,
  retryDelay: 400,
  placeholderData: keepPreviousData,
} as const

export const siteSettingsQueryOptions = queryOptions({
  ...siteShellQueryDefaults,
  queryKey: platformQueryKeys.site.settings(),
  queryFn: ({ signal }) => fetchPublicSiteSettings(signal),
})

export const siteGnbQueryOptions = queryOptions({
  ...siteShellQueryDefaults,
  queryKey: platformQueryKeys.site.gnb(),
  queryFn: ({ signal }) => fetchPublicSiteGnb(signal),
})

export const siteFooterQueryOptions = queryOptions({
  ...siteShellQueryDefaults,
  queryKey: platformQueryKeys.site.footer(),
  queryFn: ({ signal }) => fetchPublicSiteFooter(signal),
})

function useSiteShellErrorLog(scope: string, isError: boolean, error: unknown) {
  const logged = useRef(false)
  useEffect(() => {
    if (!isError || logged.current) return
    logged.current = true
    console.error(`[site-shell] ${scope}`, error)
  }, [error, isError, scope])
}

export function useSiteSettings(): SiteSettingsView {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...siteSettingsQueryOptions,
    enabled: remote,
  })
  useSiteShellErrorLog('settings', query.isError, query.error)

  return useMemo(() => {
    if (!remote) return SITE_SETTINGS_FALLBACK
    if (query.data !== undefined) {
      return mapPublicSettings(query.data) ?? SITE_SETTINGS_FALLBACK
    }
    return SITE_SETTINGS_FALLBACK
  }, [query.data, remote])
}

export function useSiteGnb(): SiteGnbView {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...siteGnbQueryOptions,
    enabled: remote,
  })
  useSiteShellErrorLog('gnb', query.isError, query.error)

  return useMemo(() => {
    if (!remote) return SITE_GNB_FALLBACK
    if (query.data !== undefined) {
      return mapPublicGnb(query.data) ?? SITE_GNB_FALLBACK
    }
    return SITE_GNB_FALLBACK
  }, [query.data, remote])
}

export function useSiteFooter(): SiteFooterView {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...siteFooterQueryOptions,
    enabled: remote,
  })
  useSiteShellErrorLog('footer', query.isError, query.error)

  return useMemo(() => {
    if (!remote) return SITE_FOOTER_FALLBACK
    if (query.data !== undefined) {
      return mapPublicFooter(query.data) ?? SITE_FOOTER_FALLBACK
    }
    return SITE_FOOTER_FALLBACK
  }, [query.data, remote])
}
