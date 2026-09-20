export type CareerProgramId = 'explore' | 'experience' | 'strengthen'

export type CareerProgramGalleryVariant = CareerProgramId

export type CareerProgramImage = {
  src: string
  alt: string
  width: number
  height: number
  objectPosition?: string
}

export type CareerProgramSection = {
  id: CareerProgramId
  title: string
  description: string
  galleryVariant: CareerProgramGalleryVariant
  images: CareerProgramImage[]
  programName: string
  partnerName: string
  programDescription: string
}
