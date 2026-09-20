import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchPublicProgramIntro } from './client'
import type { PublicProgramIntroFieldCode } from './types'
import { heroTitleLinesFromIntro, overlayProgramIntroSections } from '../lib/overlay'

const INTRO_STALE_MS = 2 * 60_000
const INTRO_GC_MS = 15 * 60_000

export function educationProgramIntroQueryOptions(fieldCode: PublicProgramIntroFieldCode) {
  return queryOptions({
    queryKey: platformQueryKeys.education.programIntro(fieldCode),
    queryFn: ({ signal }) => fetchPublicProgramIntro(fieldCode, signal),
    staleTime: INTRO_STALE_MS,
    gcTime: INTRO_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

type OverlaySection = {
  id: string
  title: string
  description: string
  images: Array<{ src: string; alt: string; width: number; height: number }>
  programName?: string
  partnerName?: string
  programDescription?: string
}

export function useEducationProgramIntroView<T extends OverlaySection>(options: {
  fieldCode: PublicProgramIntroFieldCode
  fallbackTitleLines: readonly string[]
  fallbackPrograms: readonly T[]
}): {
  titleLines: string[]
  programs: T[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...educationProgramIntroQueryOptions(options.fieldCode),
    enabled: remote,
  })

  const titleLines = useMemo(() => {
    if (!remote || query.isError || !query.data) {
      return [...options.fallbackTitleLines]
    }
    return heroTitleLinesFromIntro(query.data.heroText, options.fallbackTitleLines)
  }, [options.fallbackTitleLines, query.data, query.isError, remote])

  const programs = useMemo(() => {
    if (!remote || query.isError || !query.data) {
      return overlayProgramIntroSections(options.fallbackPrograms, undefined)
    }
    return overlayProgramIntroSections(options.fallbackPrograms, query.data)
  }, [options.fallbackPrograms, query.data, query.isError, remote])

  return {
    titleLines,
    programs,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}
