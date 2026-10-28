export type PublicTalentBanner = {
  mainText?: string
  subText?: string
  imageUrl?: string | null
  imageAssetId?: number | null
}

export type PublicTalentHowItem = {
  id?: number
  title?: string
  description?: string
}

export type PublicTalentInterview = {
  id?: string
  mainText?: string
  subText?: string
  buttonLabel?: string
  linkedStoryId?: string | number | null
}

export type PublicTalentIntroResponse = {
  banner?: PublicTalentBanner
  howItems?: PublicTalentHowItem[]
  interviews?: PublicTalentInterview[]
}

export type PublicTalentApplicationCreateRequest = {
  name: string
  birthDate: string
  gender: 'male' | 'female'
  phone: string
  email: string
  affiliation: string
  sido: string
  sigungu: string
  periodStart: string
  periodEnd: string
  bio: string
  talentIntro: string
  motivation: string
  jaParticipation: 'yes' | 'no'
  privacyAgreed: true
  attachmentAssetId?: number
  attachmentAssetIds?: number[]
}

export type PublicTalentApplicationCreateResponse = {
  id?: number
  status?: string
}
