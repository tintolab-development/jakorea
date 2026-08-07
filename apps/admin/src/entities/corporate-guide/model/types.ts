/**
 * 기업후원 안내 관리 — 홈페이지 기업후원 화면 노출 콘텐츠
 */

export type MetricItemId = 'global_scale' | 'transparency' | 'proven_impact'

export type PartnershipStepNumber = 1 | 2 | 3 | 4 | 5 | 6

export type CorporateGuideBanner = {
  imageUrl: string
  imageFileName?: string
  mainText: string
  subText: string
}

export type MetricItem = {
  id: MetricItemId
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  title: string
  description: string
}

export type PartnershipStep = {
  step: PartnershipStepNumber
  title: string
  description: string
}

export type CorporateGuideData = {
  banner: CorporateGuideBanner
  metrics: MetricItem[]
  partnershipSteps: PartnershipStep[]
  updatedAt: string
}

export type BannerSaveInput = {
  imageUrl: string
  imageFileName?: string
  mainText: string
  subText: string
}

export type MetricSaveItem = {
  id: MetricItemId
  title: string
  description: string
}

export type PartnershipSaveItem = {
  step: PartnershipStepNumber
  title: string
  description: string
}
