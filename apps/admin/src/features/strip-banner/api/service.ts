import type {
  StripBanner,
  StripBannerCreateInput,
  StripBannerListFilter,
  StripBannerUpdateInput,
} from '@/entities/strip-banner/model/types'
import { shouldUseStripBannerRemoteApi } from './capabilities'
import {
  createStripBanner as createLocal,
  readStripBanners,
  removeStripBanners as removeLocal,
  reorderStripBanners as reorderLocal,
  setStripBannerActive as setActiveLocal,
  updateStripBanner as updateLocal,
} from './store'

export async function listStripBannersService(
  filter?: StripBannerListFilter
): Promise<StripBanner[]> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  return readStripBanners(filter)
}

export async function createStripBannerService(
  input: StripBannerCreateInput
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updateStripBannerService(
  id: string,
  patch: StripBannerUpdateInput
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  return updateLocal(id, patch)
}

export async function removeStripBannersService(ids: string[]): Promise<void> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function reorderStripBannersService(
  orderedIds: string[]
): Promise<StripBanner[]> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setStripBannerActiveService(
  id: string,
  isActive: boolean
): Promise<StripBanner> {
  if (shouldUseStripBannerRemoteApi()) {
    throw new Error('Strip banner remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}
