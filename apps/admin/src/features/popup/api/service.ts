import type {
  Popup,
  PopupCreateInput,
  PopupListFilter,
  PopupUpdateInput,
} from '@/entities/popup/model/types'
import { shouldUsePopupRemoteApi } from './capabilities'
import {
  createPopup as createLocal,
  readPopups,
  removePopups as removeLocal,
  reorderPopups as reorderLocal,
  setPopupActive as setActiveLocal,
  updatePopup as updateLocal,
} from './store'

export async function listPopupsService(filter?: PopupListFilter): Promise<Popup[]> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  return readPopups(filter)
}

export async function createPopupService(input: PopupCreateInput): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updatePopupService(
  id: string,
  patch: PopupUpdateInput
): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  return updateLocal(id, patch)
}

export async function removePopupsService(ids: string[]): Promise<void> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function reorderPopupsService(orderedIds: string[]): Promise<Popup[]> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setPopupActiveService(
  id: string,
  isActive: boolean
): Promise<Popup> {
  if (shouldUsePopupRemoteApi()) {
    throw new Error('Popup remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}
