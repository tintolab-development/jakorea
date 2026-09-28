import type {
  ProgramIntroCategoryDocument,
  ProgramIntroImage,
  ProgramIntroItem,
} from '@/entities/education-program-intro/model/types'
import { getProgramImageSlotCount } from '@/features/education-program-intro/lib/image-slots'

function padImages(images: ProgramIntroImage[], count: number): ProgramIntroImage[] {
  const next = images.slice(0, count)
  while (next.length < count) next.push(null)
  return next
}

function cloneImage(image: ProgramIntroImage): ProgramIntroImage {
  if (!image) return null
  return {
    fileName: image.fileName,
    fileUrl: image.fileUrl,
    alt: image.alt,
    sortOrder: image.sortOrder,
    width: image.width,
    height: image.height,
    assetId: image.assetId,
    file: image.file,
  }
}

function cloneItem(item: ProgramIntroItem, programIndex: number): ProgramIntroItem {
  const count = getProgramImageSlotCount(programIndex)
  return {
    sectionKey: item.sectionKey,
    sortOrder: item.sortOrder,
    programType: item.programType,
    typeDescription: item.typeDescription,
    images: padImages(item.images.map(cloneImage), count),
    representativeProgram: item.representativeProgram,
    sponsorName: item.sponsorName,
    representativeDescription: item.representativeDescription,
  }
}

export function cloneProgramIntroDocument(
  doc: ProgramIntroCategoryDocument,
): ProgramIntroCategoryDocument {
  return {
    fieldCode: doc.fieldCode,
    mainText: doc.mainText,
    version: doc.version,
    sections: doc.sections.map((section, index) => cloneItem(section, index)),
    updatedAt: doc.updatedAt,
  }
}
