/**
 * GET /api/public/main 계약 (Admin PublicMainResponse와 동일, Platform 로컬 타입)
 */

export type PublicHeroResponse = {
  id?: number
  displayOrder?: number
  imageUrl?: string
  topText?: string
  mainTitle?: string
  bottomText?: string
  linkUrl?: string
}

export type PublicSocialResponse = {
  channelCode?: string
  channelName?: string
  externalUrl?: string
  displayOrder?: number
}

/** GET /api/public/main education.programs — Admin `ProgramSummary` */
export type PublicProgramSummary = {
  id?: number
  uuid?: string
  programCode?: string
  programType?: string
  periodStatus?: string
  nameKo?: string
  nameEn?: string
  summary?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  createdAt?: string
  updatedAt?: string
}

export type PublicEducationResponse = {
  title?: string
  programs?: PublicProgramSummary[]
}

export type PublicFeaturedStory = {
  id?: number
  title?: string
  categoryName?: string
  publishAt?: string
  imageUrl?: string
}

export type PublicImpactResponse = {
  title?: string
  youtubeUrl?: string
  featuredStory?: PublicFeaturedStory
}

export type PublicPerformanceResponse = {
  title?: string
  networkDistributionCount?: number
  partnerOrganizationCount?: number
  educatorCount?: number
  youthBeneficiaryCount?: number
  bottomText?: string
}

export type PublicDonationResponse = {
  title?: string
  cta1Label?: string
  cta1Url?: string
  cta2Label?: string
  cta2Url?: string
}

export type PublicSponsorResponse = {
  id?: number
  companyName?: string
  logoUrl?: string
  displayOrder?: number
}

/** Admin 메인 팝업 관리 공개 계약. 홈 팝업 오버레이가 소비한다. */
export type PublicPopupResponse = {
  id?: number
  displayOrder?: number
  imageUrl?: string
  altText?: string
  linkUrl?: string
  displayStartDate?: string
  displayEndDate?: string
}

export type PublicStripResponse = {
  id?: number
  displayOrder?: number
  bannerText?: string
  linkUrl?: string
  displayStartDate?: string
  displayEndDate?: string
}

export type PublicMainResponse = {
  heroes?: PublicHeroResponse[]
  socialLinks?: PublicSocialResponse[]
  education?: PublicEducationResponse
  impact?: PublicImpactResponse
  performance?: PublicPerformanceResponse
  donation?: PublicDonationResponse
  sponsors?: PublicSponsorResponse[]
  popups?: PublicPopupResponse[]
  stripBanners?: PublicStripResponse[]
}
