/**
 * GET /api/public/ja-korea/organization
 * 공개 기관소개 싱글톤 (무토큰)
 */

export type PublicIntroductionResponse = {
  section1Title?: string
  section1Subtitle?: string
  section2TitleEn?: string
  section2SubtitleKo?: string
  content1Title?: string
  content1Description?: string
  content2Title?: string
  content2Description?: string
  globalVisionSubtitleEn?: string
  globalVisionTextKo?: string
  globalMissionSubtitleEn?: string
  globalMissionTextKo?: string
}

export type PublicGlobalValueResponse = {
  id?: number
  itemCode?: string
  iconCode?: string
  mainText?: string
  subText?: string
  displayOrder?: number
}

export type PublicWorldwideLinkResponse = {
  id?: number
  linkCode?: string
  displayName?: string
  externalUrl?: string
}

export type PublicWorldwideResponse = {
  guidanceText?: string
  links?: PublicWorldwideLinkResponse[]
}

export type PublicHistoryResponse = {
  id?: number
  year?: number
  month?: number
  content?: string
}

export type PublicAwardResponse = {
  id?: number
  awardedDate?: string
  awardName?: string
  awardingInstitution?: string
}

export type PublicCertificationResponse = {
  id?: number
  certifiedDate?: string
  content?: string
  certificationInstitution?: string
}

export type PublicBiResponse = {
  title?: string
  mainText?: string
  subText?: string
}

export type PublicOrganizationResponse = {
  introduction?: PublicIntroductionResponse
  globalValues?: PublicGlobalValueResponse[]
  worldwide?: PublicWorldwideResponse
  history?: PublicHistoryResponse[]
  awards?: PublicAwardResponse[]
  certifications?: PublicCertificationResponse[]
  bi?: PublicBiResponse
}
