export type LinkedProgram = {
  id: string
  title: string
  publishedAt: string
}

export type ImpactStoryOption = {
  id: string
  title: string
  publishedAt: string
}

export type EducationProgramContent = {
  title: string
}

export type ImpactStoryContent = {
  title: string
  youtubeUrl: string
  featuredStoryId: string | null
}

export type PerformanceContent = {
  title: string
  networkCount: number
  partnerCount: number
  volunteerCount: number
  beneficiaryCount: number
  bottomText: string
}

export type DonationContent = {
  title: string
  cta1Label: string
  cta1Url: string
  cta2Label: string
  cta2Url: string
}

export type MainContentState = {
  education: EducationProgramContent
  impact: ImpactStoryContent
  performance: PerformanceContent
  donation: DonationContent
}
