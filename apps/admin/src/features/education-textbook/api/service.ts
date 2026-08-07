import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { shouldUseEducationTextbookRemoteApi } from './capabilities'
import {
  createEducationTextbook as createLocal,
  getEducationTextbook as getLocal,
  readEducationTextbooks,
  removeEducationTextbooks as removeLocal,
  setEducationTextbookActive as setActiveLocal,
  updateEducationTextbook as updateLocal,
} from './store'

export async function listEducationTextbooksService(
  filter: EducationTextbookListFilter = {}
): Promise<EducationTextbook[]> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  return readEducationTextbooks(filter)
}

export async function getEducationTextbookService(
  id: string
): Promise<EducationTextbook | null> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  return getLocal(id)
}

export async function createEducationTextbookService(
  input: EducationTextbookCreateInput
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updateEducationTextbookService(
  input: EducationTextbookUpdateInput
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  return updateLocal(input)
}

export async function removeEducationTextbooksService(ids: string[]): Promise<void> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function setEducationTextbookActiveService(
  id: string,
  isActive: boolean
): Promise<EducationTextbook> {
  if (shouldUseEducationTextbookRemoteApi()) {
    throw new Error('Education textbook remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}
