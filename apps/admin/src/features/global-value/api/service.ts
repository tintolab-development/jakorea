import type { GlobalValue, GlobalValueTextPatch } from '@/entities/global-value/model/types'
import { shouldUseGlobalValueRemoteApi } from './capabilities'
import {
  readGlobalValues,
  reorderGlobalValues as reorderLocal,
  setGlobalValueActive as setActiveLocal,
  updateGlobalValueTexts as updateTextsLocal,
} from './store'

export async function listGlobalValuesService(): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    throw new Error('Global value remote API is not implemented yet')
  }
  return readGlobalValues()
}

export async function reorderGlobalValuesService(orderedIds: string[]): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    throw new Error('Global value remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setGlobalValueActiveService(
  id: string,
  isActive: boolean
): Promise<GlobalValue> {
  if (shouldUseGlobalValueRemoteApi()) {
    throw new Error('Global value remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}

export async function saveGlobalValuesService(
  patches: GlobalValueTextPatch[]
): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    throw new Error('Global value remote API is not implemented yet')
  }
  return updateTextsLocal(patches)
}
