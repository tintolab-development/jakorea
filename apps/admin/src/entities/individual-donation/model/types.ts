/**
 * 개인후원 관리 — 홈페이지 개인후원 화면 노출 콘텐츠
 */

/** 고정 후원금 사용 안내 항목 id */
export type UsageGuideItemId = 'future_capability' | 'education_access'

export type IndividualDonationBanner = {
  imageUrl: string
  imageFileName?: string
  /** Homepage asset id (remote) */
  imageAssetId?: number
  mainText: string
  subText: string
  /** setting.version — banner·donation URL 공유 */
  version: number
}

export type UsageGuideItem = {
  id: UsageGuideItemId
  /** API numeric id (1–2). mock은 매핑으로 부여 */
  apiId: number
  /** 고정 노출 — 수정 불가 */
  itemLabel: string
  mainText: string
  subText: string
  version: number
}

export type DonateCta = {
  /** 고정값 — 항상 '후원하기' */
  buttonLabel: '후원하기'
  linkUrl: string
  /** setting.version — banner와 공유 */
  version: number
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
  imageFile?: File | null
  imageAssetId?: number
  mainText: string
  subText: string
  version: number
}

/** 저장 시 항목명·id 는 서버/스토어가 seed 고정값을 유지 */
export type UsageGuideSaveItem = {
  id: UsageGuideItemId
  apiId: number
  mainText: string
  subText: string
  version: number
}

export type DonateCtaSaveInput = {
  linkUrl: string
  version: number
}
