export type DigitalLiteracyProgramId = 'ai-literacy' | 'sw-ai'

export type DigitalLiteracyProgramGalleryVariant = 'split' | 'full'

export type DigitalLiteracyProgramImage = {
  src: string
  alt: string
  width: number
  height: number
  objectPosition?: string
}

export type DigitalLiteracyProgramSection = {
  id: DigitalLiteracyProgramId
  title: string
  description: string
  galleryVariant: DigitalLiteracyProgramGalleryVariant
  images: DigitalLiteracyProgramImage[]
  programName: string
  partnerName: string
  programDescription: string
}
