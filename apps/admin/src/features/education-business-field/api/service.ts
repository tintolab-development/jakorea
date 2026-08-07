import type {
  EducationBusinessField,
  EducationBusinessFieldDocument,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'
import { shouldUseEducationBusinessFieldRemoteApi } from './capabilities'
import {
  readEducationBusinessFieldDocument,
  readEducationBusinessFields,
  reorderEducationBusinessFields as reorderLocal,
  saveEducationBusinessFieldDocument as saveLocal,
  setEducationBusinessFieldActive as setActiveLocal,
} from './store'

export async function listEducationBusinessFieldsService(): Promise<EducationBusinessField[]> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    throw new Error('Education business field remote API is not implemented yet')
  }
  return readEducationBusinessFields()
}

export async function getEducationBusinessFieldDocumentService(): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    throw new Error('Education business field remote API is not implemented yet')
  }
  return readEducationBusinessFieldDocument()
}

export async function reorderEducationBusinessFieldsService(
  orderedIds: string[]
): Promise<EducationBusinessField[]> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    throw new Error('Education business field remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setEducationBusinessFieldActiveService(
  id: string,
  isActive: boolean
): Promise<EducationBusinessField> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    throw new Error('Education business field remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}

export async function saveEducationBusinessFieldDocumentService(input: {
  mainText: string
  patches: EducationBusinessFieldTextPatch[]
}): Promise<EducationBusinessFieldDocument> {
  if (shouldUseEducationBusinessFieldRemoteApi()) {
    throw new Error('Education business field remote API is not implemented yet')
  }
  return saveLocal(input)
}
