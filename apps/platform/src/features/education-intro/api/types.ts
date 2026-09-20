export type PublicProgramIntroFieldCode =
  | 'CAREER_EMPLOYMENT'
  | 'ECONOMICS_FINANCE'
  | 'ENTREPRENEURSHIP'
  | 'DIGITAL_LITERACY'

export type PublicProgramIntroImage = {
  sortOrder?: number
  alt?: string
  width?: number
  height?: number
  publicUrl?: string | null
  assetId?: number | null
}

export type PublicProgramIntroSection = {
  sectionKey?: string
  sortOrder?: number
  programType?: string
  typeDescription?: string
  representativeProgram?: string
  sponsorName?: string
  representativeDescription?: string
  images?: PublicProgramIntroImage[]
}

export type PublicProgramIntroResponse = {
  fieldCode?: string
  heroText?: string
  version?: number | null
  updatedAt?: string
  sections?: PublicProgramIntroSection[]
}
