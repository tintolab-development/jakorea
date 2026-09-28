export type FinanceProgramId = 'ujat' | 'employee' | 'instructor'

export type FinanceProgramGalleryVariant = 'split' | 'full' | 'stack'

/** Figma clip: image layer size/offset inside the frame (px at 1x artboard). */
export type FinanceProgramImageLayer = {
  frameW: number
  frameH: number
  layerW: number
  layerH: number
  x: number
  y: number
}

export type FinanceProgramImage = {
  src: string
  alt: string
  width: number
  height: number
  layer: FinanceProgramImageLayer
}

export type FinanceProgramSection = {
  id: FinanceProgramId
  title: string
  description: string
  galleryVariant: FinanceProgramGalleryVariant
  images: FinanceProgramImage[]
  programName?: string
  partnerName?: string
  programDescription?: string
}
