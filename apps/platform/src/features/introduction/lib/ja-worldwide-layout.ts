/**
 * JA Worldwide — 지도 CTA 좌표·라벨 (프론트 고정).
 * URL은 API links 가 우선, 없으면 fallbackHref.
 */

export type JaWorldwideRegionId =
  | 'americas'
  | 'usa'
  | 'europe'
  | 'africa'
  | 'mena'
  | 'asia-pacific'

export type JaWorldwideRegion = {
  id: JaWorldwideRegionId
  ctaLabel: string
  href: string
  linkX: string
  linkY: string
}

export const JA_WORLDWIDE_EYEBROW = 'JA Worldwide'

export const JA_WORLDWIDE_STAT = '15,140,800'

export const JA_WORLDWIDE_GLOBAL_LINK = {
  label: 'JA Worldwide 바로가기',
  href: 'https://www.jaworldwide.org/',
} as const

/** 지도 위 가이드 — Admin/DB 필드 없음, 프론트 고정 */
export const JA_WORLDWIDE_GUIDE =
  '각 지역에 마우스를 올려 각 세계 지부를 탐색해보세요.'

export const JA_WORLDWIDE_REGION_LAYOUT: readonly {
  id: JaWorldwideRegionId
  ctaLabel: string
  fallbackHref: string
  linkX: string
  linkY: string
}[] = [
  {
    id: 'americas',
    ctaLabel: 'JA Americas 바로가기',
    fallbackHref: 'https://www.jaamericas.org/',
    linkX: '22%',
    linkY: '48%',
  },
  {
    id: 'usa',
    ctaLabel: 'JA USA 바로가기',
    fallbackHref: 'https://jausa.ja.org/',
    linkX: '18%',
    linkY: '40%',
  },
  {
    id: 'europe',
    ctaLabel: 'JA Europe 바로가기',
    fallbackHref: 'https://www.jaeurope.org/',
    linkX: '70%',
    linkY: '26%',
  },
  {
    id: 'africa',
    ctaLabel: 'JA Africa 바로가기',
    fallbackHref: 'https://ja-africa.org/',
    linkX: '50%',
    linkY: '58%',
  },
  {
    id: 'mena',
    ctaLabel: 'INJAZ AL ARAB JA MENA 바로가기',
    fallbackHref: 'https://injazalarab.org/',
    linkX: '58%',
    linkY: '42%',
  },
  {
    id: 'asia-pacific',
    ctaLabel: 'JA Asia Pacific 바로가기',
    fallbackHref: 'https://www.jaasiapacific.org/',
    linkX: '72%',
    linkY: '48%',
  },
] as const
