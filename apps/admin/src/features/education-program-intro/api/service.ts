import type {
  ProgramIntroCategoryDocument,
  ProgramIntroFieldCode,
  ProgramIntroImage,
  ProgramIntroItem,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import { mapProgramIntroResponseToDomain, toProgramIntroUpdateRequest } from './mappers'
import { uploadEducationProgramIntroImage } from './upload-intro-image'

function educationApi() {
  return getJAKoreaHomepageAdminAPIEducationSubset()
}

async function resolveImage(image: ProgramIntroImage): Promise<ProgramIntroImage> {
  if (!image) return null
  if (image.file instanceof File) {
    const assetId = await uploadEducationProgramIntroImage(image.file)
    return {
      fileName: image.fileName,
      fileUrl: image.fileUrl,
      alt: image.alt,
      sortOrder: image.sortOrder,
      width: image.width,
      height: image.height,
      assetId,
    }
  }
  return {
    fileName: image.fileName,
    fileUrl: image.fileUrl,
    alt: image.alt,
    sortOrder: image.sortOrder,
    width: image.width,
    height: image.height,
    assetId: image.assetId,
  }
}

async function resolveSections(sections: ProgramIntroItem[]): Promise<ProgramIntroItem[]> {
  return Promise.all(
    sections.map(async section => ({
      ...section,
      images: await Promise.all(section.images.map(resolveImage)),
    })),
  )
}

export async function getProgramIntroCategoryService(
  fieldCode: ProgramIntroFieldCode,
): Promise<ProgramIntroCategoryDocument> {
  const row = await educationApi().get4(fieldCode)
  return mapProgramIntroResponseToDomain(row, fieldCode)
}

export async function saveProgramIntroCategoryService(
  input: ProgramIntroSaveInput,
): Promise<ProgramIntroCategoryDocument> {
  const sections = await resolveSections(input.sections)
  const body = toProgramIntroUpdateRequest({ ...input, sections })
  const row = await educationApi().update13(input.fieldCode, body)
  return mapProgramIntroResponseToDomain(row, input.fieldCode)
}
