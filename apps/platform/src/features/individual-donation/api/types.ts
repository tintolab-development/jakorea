export type PublicBannerResponse = {
  imageUrl?: string | null
  mainText?: string
  subText?: string
}

export type PublicPersonalUsageResponse = {
  code?: string
  name?: string
  mainText?: string
  subText?: string
  displayOrder?: number
}

export type PublicPersonalSponsorshipResponse = {
  banner?: PublicBannerResponse
  usageItems?: PublicPersonalUsageResponse[]
  donationButtonLabel?: string
  donationUrl?: string
}
