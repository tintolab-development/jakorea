import type { CareersFeaturedStory, ThriveValue } from './types'

export type CareersHeroView = {
  label: string
  titleLines: readonly string[]
  descriptionKo: readonly string[]
  descriptionEn: string
  imageUrl: string
  /** 원격 URL이 깨질 때 쓸 번들 이미지 */
  imageFallbackUrl: string
  imageAlt: string
}

export type CareersGuideView = {
  hero: CareersHeroView
  thriveValues: readonly ThriveValue[]
  featuredStories: readonly CareersFeaturedStory[]
}
