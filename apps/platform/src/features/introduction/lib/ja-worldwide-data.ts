/**
 * JA Worldwide 섹션 카피·지역 링크.
 * 지역 URL은 Platform footer / Admin BRANCH_SEED와 정합.
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
  /** 지도 CTA 라벨 (시안: "JA Asia Pacific 바로가기") */
  ctaLabel: string
  href: string
  /** map-wrap 기준 CTA 시각 중앙 (%) */
  linkX: string
  linkY: string
}

export const JA_WORLDWIDE_EYEBROW = 'JA Worldwide'

export const JA_WORLDWIDE_STAT = '15,140,800'

export const JA_WORLDWIDE_GLOBAL_LINK = {
  label: 'JA Worldwide 바로가기',
  href: 'https://www.jaworldwide.org/',
} as const

export const JA_WORLDWIDE_GUIDE =
  '각 지역에 마우스를 올려 각 세계 지부를 탐색해보세요.'

/** 시안 기준 하단 설명 문구 */
export const JA_WORLDWIDE_DESCRIPTION =
  'JA Worldwide는 100여년간 쌓아온 경험과 열정을 가진 세계에서 가장 영향력 있는 청소년 교육 NGO중 하나로서, 매년 약 100여 개국에서 50만 명 교육 진행자들과 함께 2,300만 명 이상의 청소년들을 교육하고 있습니다.'

export const JA_WORLDWIDE_REGIONS: readonly JaWorldwideRegion[] = [
  {
    id: 'americas',
    ctaLabel: 'JA Americas 바로가기',
    href: 'https://www.jaamericas.org/',
    linkX: '22%',
    linkY: '48%',
  },
  {
    id: 'usa',
    ctaLabel: 'JA USA 바로가기',
    href: 'https://jausa.ja.org/',
    linkX: '18%',
    linkY: '40%',
  },
  {
    id: 'europe',
    ctaLabel: 'JA Europe 바로가기',
    href: 'https://www.jaeurope.org/',
    linkX: '70%',
    linkY: '26%',
  },
  {
    id: 'africa',
    ctaLabel: 'JA Africa 바로가기',
    href: 'https://ja-africa.org/',
    linkX: '50%',
    linkY: '58%',
  },
  {
    id: 'mena',
    ctaLabel: 'INJAZ AL ARAB JA MENA 바로가기',
    href: 'https://injazalarab.org/',
    linkX: '58%',
    linkY: '42%',
  },
  {
    id: 'asia-pacific',
    ctaLabel: 'JA Asia Pacific 바로가기',
    href: 'https://www.jaasiapacific.org/',
    linkX: '72%',
    linkY: '48%',
  },
] as const
