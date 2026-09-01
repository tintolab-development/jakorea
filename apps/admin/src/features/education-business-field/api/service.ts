import type {
  EducationBusinessField,
  EducationBusinessFieldDocument,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import { shouldUseEducationBusinessFieldRemoteApi } from './capabilities'
import {
  mapBusinessCatalogToDocument,
  toBusinessCatalogUpdateRequest,
} from './mappers'
import {
  readEducationBusinessFieldDocument,
  readEducationBusinessFields,
  reorderEducationBusinessFields as reorderLocal,
  saveEducationBusinessFieldDocument as saveLocal,
  setEducationBusinessFieldActive as setActiveLocal,
} from './store'

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
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    return (await getRemoteDocument()).fields
  }
  return readEducationBusinessFields()
}

export async function getEducationBusinessFieldDocumentService(): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    return getRemoteDocument()
  }
  return readEducationBusinessFieldDocument()
}

export async function reorderEducationBusinessFieldsService(
  orderedIds: string[],
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    const doc = cached ?? (await getRemoteDocument())
    return putRemoteDocument(doc, { orderedIds })
  }
  const fields = reorderLocal(orderedIds)
  const local = readEducationBusinessFieldDocument()
  return { intro: local.intro, fields }
}

export async function setEducationBusinessFieldActiveService(
  id: string,
  isActive: boolean,
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    const doc = cached ?? (await getRemoteDocument())
    return putRemoteDocument(doc, { activePatch: { id, isActive } })
  }
  setActiveLocal(id, isActive)
  return readEducationBusinessFieldDocument()
}

export async function saveEducationBusinessFieldDocumentService(
  input: {
    mainText: string
    patches: EducationBusinessFieldTextPatch[]
  },
  cached?: EducationBusinessFieldDocument | null,
): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    const doc = cached ?? (await getRemoteDocument())
    return putRemoteDocument(doc, input)
  }
  return saveLocal(input)
}
