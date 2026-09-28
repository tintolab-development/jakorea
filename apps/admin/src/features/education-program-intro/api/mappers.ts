/**
 * 프로그램 소개 — OpenAPI ProgramIntro* ↔ 도메인
 */

import type {
  ProgramIntroCategoryDocument,
  ProgramIntroFieldCode,
  ProgramIntroImage,
  ProgramIntroItem,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { PROGRAM_INTRO_FIELD_CODES } from '@/entities/education-program-intro/model/types'
import type { ProgramIntroImageWrite } from '@/shared/api/generated/education/schemas/programIntroImageWrite'
import type { ProgramIntroResponse } from '@/shared/api/generated/education/schemas/programIntroResponse'
import type { ProgramIntroSectionWrite } from '@/shared/api/generated/education/schemas/programIntroSectionWrite'
import type { ProgramIntroUpdateRequest } from '@/shared/api/generated/education/schemas/programIntroUpdateRequest'
import { getProgramImageSlotCount } from '@/features/education-program-intro/lib/image-slots'

export function isProgramIntroFieldCode(value: string): value is ProgramIntroFieldCode {
  return (PROGRAM_INTRO_FIELD_CODES as readonly string[]).includes(value)
}

function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url, 'http://localhost').pathname
    const last = path.split('/').filter(Boolean).at(-1)
    return last ? decodeURIComponent(last) : fallback
  } catch {
    return fallback
  }
}

function mapImage(
  raw: {
    sortOrder?: number
    alt?: string
    width?: number
    height?: number
    publicUrl?: string
    assetId?: number | null
  },
  index: number,
): ProgramIntroImage {
  const sortOrder = raw.sortOrder && raw.sortOrder > 0 ? raw.sortOrder : index + 1
  const alt = raw.alt?.trim() ?? ''
  const fileUrl = raw.publicUrl?.trim() ?? ''
  const assetId = raw.assetId != null && raw.assetId > 0 ? raw.assetId : undefined
  if (!fileUrl && assetId == null) return null
  return {
    fileName: fileUrl ? fileNameFromUrl(fileUrl, alt || `image-${sortOrder}`) : alt || `image-${sortOrder}`,
    fileUrl,
    alt,
    sortOrder,
    width: raw.width,
    height: raw.height,
    assetId,
  }
}

function padImages(images: ProgramIntroImage[], count: number): ProgramIntroImage[] {
  const next = images.slice(0, count)
  while (next.length < count) next.push(null)
  return next
}

export function mapProgramIntroResponseToDomain(
  row: ProgramIntroResponse,
  fallbackField: ProgramIntroFieldCode,
): ProgramIntroCategoryDocument {
  const fieldCode = isProgramIntroFieldCode(row.fieldCode ?? '')
    ? (row.fieldCode as ProgramIntroFieldCode)
    : fallbackField
  const sectionsRaw = [...(row.sections ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
  const sections: ProgramIntroItem[] = sectionsRaw.map((section, index) => {
    const sortOrder = section.sortOrder && section.sortOrder > 0 ? section.sortOrder : index + 1
    const slotCount = getProgramImageSlotCount(index)
    const imagesRaw = [...(section.images ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((img, imageIndex) => mapImage(img, imageIndex))
    return {
      sectionKey: section.sectionKey?.trim() || `section-${sortOrder}`,
      sortOrder,
      programType: section.programType ?? '',
      typeDescription: section.typeDescription ?? '',
      images: padImages(imagesRaw, slotCount),
      representativeProgram: section.representativeProgram ?? '',
      sponsorName: section.sponsorName ?? '',
      representativeDescription: section.representativeDescription ?? '',
    }
  })
  return {
    fieldCode,
    mainText: row.heroText ?? '',
    version: row.version ?? 0,
    sections,
    updatedAt: row.updatedAt ?? '',
  }
}

function requireAssetId(image: Exclude<ProgramIntroImage, null>): number {
  if (image.assetId != null && image.assetId > 0) return image.assetId
  throw new Error('각 섹션 이미지를 등록해 주세요.')
}

export function toProgramIntroUpdateRequest(
  input: ProgramIntroSaveInput,
): ProgramIntroUpdateRequest {
  const sections: ProgramIntroSectionWrite[] = input.sections.map((section, index) => {
    const images: ProgramIntroImageWrite[] = section.images
      .map((image, imageIndex) => {
        if (!image) return null
        const write: ProgramIntroImageWrite = {
          sortOrder: image.sortOrder > 0 ? image.sortOrder : imageIndex + 1,
          alt: image.alt.trim() || image.fileName,
          assetId: requireAssetId(image),
        }
        if (image.width != null) write.width = image.width
        if (image.height != null) write.height = image.height
        return write
      })
      .filter((row): row is ProgramIntroImageWrite => row != null)
    if (images.length === 0) {
      throw new Error('각 프로그램 유형에 이미지를 1장 이상 등록해 주세요.')
    }
    return {
      sectionKey: section.sectionKey,
      sortOrder: section.sortOrder > 0 ? section.sortOrder : index + 1,
      programType: section.programType,
      typeDescription: section.typeDescription,
      representativeProgram: section.representativeProgram,
      sponsorName: section.sponsorName,
      representativeDescription: section.representativeDescription,
      images,
    }
  })
  return {
    heroText: input.mainText,
    version: input.version,
    sections,
  }
}
