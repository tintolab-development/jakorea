import type {
  EducationBusinessField,
  EducationBusinessFieldDocument,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import {
  mapBusinessCatalogToDocument,
  toBusinessCatalogUpdateRequest,
} from './mappers'

function educationApi() {
  return getJAKoreaHomepageAdminAPIEducationSubset()
}

async function getRemoteDocument(): Promise<EducationBusinessFieldDocument> {
  const res = await educationApi().businessCatalog()
  return mapBusinessCatalogToDocument(res)
}

async function putRemoteDocument(
  cached: EducationBusinessFieldDocument,
  input: {
    mainText?: string
    patches?: EducationBusinessFieldTextPatch[]
    orderedIds?: string[]
    activePatch?: { id: string; isActive: boolean }
  },
): Promise<EducationBusinessFieldDocument> {
  const res = await educationApi().updateBusinessCatalog(
    toBusinessCatalogUpdateRequest(cached, input),
  )
  return mapBusinessCatalogToDocument(res)
}

export async function listEducationBusinessFieldsService(): Promise<EducationBusinessField[]> {
  return (await getRemoteDocument()).fields
}

export async function getEducationBusinessFieldDocumentService(): Promise<EducationBusinessFieldDocument> {
  return getRemoteDocument()
}

export async function reorderEducationBusinessFieldsService(
  orderedIds: string[],
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  const doc = cached ?? (await getRemoteDocument())
  return putRemoteDocument(doc, { orderedIds })
}

export async function setEducationBusinessFieldActiveService(
  id: string,
  isActive: boolean,
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  const doc = cached ?? (await getRemoteDocument())
  return putRemoteDocument(doc, { activePatch: { id, isActive } })
}

export async function saveEducationBusinessFieldDocumentService(
  input: {
    mainText: string
    patches: EducationBusinessFieldTextPatch[]
  },
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  const doc = cached ?? (await getRemoteDocument())
  return putRemoteDocument(doc, input)
}
