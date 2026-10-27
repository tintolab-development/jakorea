export type PublicBannerResponse = {
  imageUrl?: string | null
  mainText?: string
  subText?: string
}

export type PublicCorporateMetricResponse = {
  code?: string
  name?: string
  title?: string
  description?: string
  displayOrder?: number
}

export type PublicCorporateStepResponse = {
  stepNumber?: number
  title?: string
  description?: string
}

export type PublicCorporateSponsorshipResponse = {
  banner?: PublicBannerResponse
  metrics?: PublicCorporateMetricResponse[]
  steps?: PublicCorporateStepResponse[]
}

export type PublicCorporateSponsorResponse = {
  id?: number
  companyName?: string
  logoUrl?: string
  displayOrder?: number
}

export type PublicCorporateConsultationCreateRequest = {
  companyName: string
  contactName: string
  departmentTitle: string
  contactPhone: string
  consultationContent: string
  linkUrl?: string
  attachmentAssetId?: number
  attachmentUploadToken?: string
  privacyConsent: true
}

export type PublicCorporateConsultationCreateResponse = {
  id?: number
  status?: string
  createdAt?: string
}
