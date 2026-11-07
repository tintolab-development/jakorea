import type { ProgramIntroCategoryDocument } from '@/entities/education-program-intro/model/types'
import { getProgramImageSlotCount } from './image-slots'

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function hasImage(image: ProgramIntroCategoryDocument['sections'][number]['images'][number]): boolean {
  if (!image) return false
  return Boolean(image.file || image.assetId || image.fileUrl.trim())
}

export function hasIncompleteRequiredProgramIntroFields(
  data: ProgramIntroCategoryDocument,
): boolean {
  if (isBlank(data.mainText)) return true
  return data.sections.some((section, index) => {
    if (
      isBlank(section.programType) ||
      isBlank(section.typeDescription) ||
      isBlank(section.representativeProgram) ||
      isBlank(section.sponsorName) ||
      isBlank(section.representativeDescription)
    ) {
      return true
    }
    const slotCount = getProgramImageSlotCount(index)
    for (let i = 0; i < slotCount; i += 1) {
      if (!hasImage(section.images[i] ?? null)) return true
    }
    return false
  })
}
