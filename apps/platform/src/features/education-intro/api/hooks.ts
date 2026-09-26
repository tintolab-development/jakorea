import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { fetchPublicProgramIntro } from './client'
import type { PublicProgramIntroFieldCode } from './types'
import { heroTitleLinesFromIntro, mapProgramIntroSections } from '../lib/overlay'

/**
 * 공개 프로그램 소개.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * Remote API only — mock 본문 fallback 없음. 갤러리 크롭·object-position 만 레이아웃 템플릿.
 */
const INTRO_STALE_MS = 5 * 60_000
const INTRO_GC_MS = 30 * 60_000

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

type LayoutImage = {
  src: string
  alt: string
  width: number
  height: number
}

type LayoutSection = {
  id: string
  title: string
  description: string
  images: LayoutImage[]
  programName?: string
  partnerName?: string
  programDescription?: string
}

export function useEducationProgramIntroView<T extends LayoutSection>(options: {
  fieldCode: PublicProgramIntroFieldCode
  layoutTemplates: readonly T[]
}): {
  titleLines: string[]
  programs: T[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...educationProgramIntroQueryOptions(options.fieldCode),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }
    if (!remote) {
      return {
        titleLines: [],
        programs: [],
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    if (query.isPending) {
      return {
        titleLines: [],
        programs: [],
        isRemoteEnabled: true,
        isPending: true,
        isError: false,
        refetch,
      }
    }
    if (query.isError || !query.data) {
      return {
        titleLines: [],
        programs: [],
        isRemoteEnabled: true,
        isPending: false,
        isError: true,
        refetch,
      }
    }
    return {
      titleLines: heroTitleLinesFromIntro(query.data.heroText),
      programs: mapProgramIntroSections(options.layoutTemplates, query.data),
      isRemoteEnabled: true,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [options.fieldCode, options.layoutTemplates, query, remote])
}
