export type EntrepreneurshipProgramId = 'startup' | 'contest' | 'elementary'

export type EntrepreneurshipProgramGalleryVariant = 'split' | 'full' | 'stack'

export type EntrepreneurshipProgramImage = {
  src: string
  alt: string
  width: number
  height: number
  objectPosition?: string
}

export type EntrepreneurshipProgramSection = {
  id: EntrepreneurshipProgramId
  title: string
  description: string
  galleryVariant: EntrepreneurshipProgramGalleryVariant
  images: EntrepreneurshipProgramImage[]
  programName?: string
  partnerName?: string
  programDescription?: string
}
