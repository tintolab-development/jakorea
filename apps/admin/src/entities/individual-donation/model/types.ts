/**
 * 개인후원 관리 — 홈페이지 개인후원 화면 노출 콘텐츠
 */

/** 고정 후원금 사용 안내 항목 id */
export type UsageGuideItemId = 'future_capability' | 'education_access'

export type IndividualDonationBanner = {
  imageUrl: string
  imageFileName?: string
  mainText: string
  subText: string
}

export type UsageGuideItem = {
  id: UsageGuideItemId
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  mainText: string
  subText: string
}

export type DonateCta = {
  /** 고정값 — 항상 '후원하기' */
  buttonLabel: '후원하기'
  linkUrl: string
}

export type IndividualDonationData = {
  banner: IndividualDonationBanner
  usageGuideItems: UsageGuideItem[]
  donateCta: DonateCta
  updatedAt: string
}

export type BannerSaveInput = {
  imageUrl: string
  imageFileName?: string
  mainText: string
  subText: string
}

/** 저장 시 항목명·id 는 서버/스토어가 seed 고정값을 유지 */
export type UsageGuideSaveItem = {
  id: UsageGuideItemId
  mainText: string
  subText: string
}

export type DonateCtaSaveInput = {
  linkUrl: string
}
