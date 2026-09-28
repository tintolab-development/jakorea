import type {
  AchievementRecordItem,
  HistoryYearData,
} from '../lib/achievement-data'
import type { GlobalValueItem } from '../lib/global-value-data'
import type { JaWorldwideRegion } from '../lib/ja-worldwide-layout'

/** Hero Motion 1·2 카피 — 줄바꿈은 화면용 lines */
export type IntroductionHeroContent = {
  introLines: readonly string[]
  introMobile: string
  messageLines: readonly string[]
  inspiringTitleLines: readonly string[]
  inspiringDescriptionLines: readonly string[]
  networkTitleLines: readonly string[]
  networkDescriptionLines: readonly string[]
  experienceTitleLines: readonly string[]
  experienceDescriptionLines: readonly string[]
  visionEyebrowLines: readonly string[]
  visionBodyLines: readonly string[]
  missionEyebrowLines: readonly string[]
  missionBodyLines: readonly string[]
}

export type IntroductionWorldwideContent = {
  description: string
  globalLinkHref: string
  regions: readonly JaWorldwideRegion[]
}

export type IntroductionBiContent = {
  title: string
  lead: string
  description: string
}

export type IntroductionPageContent = {
  hero: IntroductionHeroContent
  globalValues: readonly GlobalValueItem[]
  worldwide: IntroductionWorldwideContent
  historyByYear: Readonly<Record<number, HistoryYearData>>
  awards: readonly AchievementRecordItem[]
  certifications: readonly AchievementRecordItem[]
  bi: IntroductionBiContent
}
