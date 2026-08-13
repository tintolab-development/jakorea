/**
 * 메인 콘텐츠 관리 도메인 타입
 */

export type PerformanceMetricId =
  | 'network'
  | 'partners'
  | 'volunteers'
  | 'beneficiaries'

export type PerformanceMetric = {
  id: PerformanceMetricId
  /** 고정 라벨 */
  label: string
  /** 표시 숫자 문자열 (예: "200", "1,000") */
  value: string
  /** 단위 (예: "지역+") */
  unit: string
}

export type EducationSection = {
  title: string
  /** Optimistic locking — remote API 필수 */
  version: number
}

export type ImpactStorySection = {
  title: string
  youtubeUrl: string
  featuredContentId: string
  version: number
}

export type PerformanceSection = {
  title: string
  metrics: PerformanceMetric[]
  bottomText: string
  version: number
}

export type DonationCta = {
  label: string
  linkUrl: string
}

export type DonationSection = {
  title: string
  cta1: DonationCta
  cta2: DonationCta
  version: number
}

export type ImpactStoryOption = {
  id: string
  title: string
  createdAt: string
}

export type MainContents = {
  education: EducationSection
  impactStory: ImpactStorySection
  performance: PerformanceSection
  donation: DonationSection
  updatedAt: string
  /** remote GET 시 featuredStoryOptions 매핑 (local은 store 별도) */
  impactStoryOptions?: ImpactStoryOption[]
}
