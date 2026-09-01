/**
 * 기업후원 안내 관리 — 홈페이지 기업후원 화면 노출 콘텐츠
 */

export type MetricItemId = 'global_scale' | 'transparency' | 'proven_impact'

export type PartnershipStepNumber = 1 | 2 | 3 | 4 | 5 | 6

export type CorporateGuideBanner = {
  imageUrl: string
  imageFileName?: string
  imageAssetId?: number
  mainText: string
  subText: string
  version: number
}

export type MetricItem = {
  id: MetricItemId
  apiId: number
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  title: string
  description: string
  version: number
}

export type PartnershipStep = {
  step: PartnershipStepNumber
  apiId: number
  title: string
  description: string
  version: number
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
  imageFile?: File | null
  imageAssetId?: number
  mainText: string
  subText: string
  version: number
}

export type MetricSaveItem = {
  id: MetricItemId
  apiId: number
  title: string
  description: string
  version: number
}

export type PartnershipSaveItem = {
  step: PartnershipStepNumber
  apiId: number
  title: string
  description: string
  version: number
}
