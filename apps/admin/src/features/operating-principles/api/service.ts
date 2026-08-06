import type {
  OperatingPrinciplesDoc,
  OperatingPrinciplesSavePayload,
} from '@/entities/operating-principles/model/types'
import { shouldUseOperatingPrinciplesRemoteApi } from './capabilities'
import {
  readOperatingPrinciples,
  reorderOperatingPrinciples as reorderLocal,
  saveOperatingPrinciplesContent as saveLocal,
  setPrincipleActive as setActiveLocal,
} from './store'

export async function getOperatingPrinciplesService(): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    throw new Error('Operating principles remote API is not implemented yet')
  }
  return readOperatingPrinciples()
}

export async function reorderOperatingPrinciplesService(
  orderedIds: string[]
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    throw new Error('Operating principles remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setPrincipleActiveService(
  id: string,
  isActive: boolean
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    throw new Error('Operating principles remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}

export async function saveOperatingPrinciplesService(
  payload: OperatingPrinciplesSavePayload
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    throw new Error('Operating principles remote API is not implemented yet')
  }
  return saveLocal(payload)
}
