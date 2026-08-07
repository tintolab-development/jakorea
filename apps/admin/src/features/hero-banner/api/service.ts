import type {
  HeroBanner,
  HeroBannerCreateInput,
  HeroBannerUpdateInput,
} from '@/entities/hero-banner/model/types'
import { shouldUseHeroBannerRemoteApi } from './capabilities'
import {
  createHeroBanner as createLocal,
  readHeroBanners,
  removeHeroBanners as removeLocal,
  reorderHeroBanners as reorderLocal,
  setHeroBannerActive as setActiveLocal,
  updateHeroBanner as updateLocal,
} from './store'

export async function listHeroBannersService(): Promise<HeroBanner[]> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  return readHeroBanners()
}

export async function createHeroBannerService(
  input: HeroBannerCreateInput
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updateHeroBannerService(
  id: string,
  patch: HeroBannerUpdateInput
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  return updateLocal(id, patch)
}

export async function removeHeroBannersService(ids: string[]): Promise<void> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function reorderHeroBannersService(orderedIds: string[]): Promise<HeroBanner[]> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setHeroBannerActiveService(
  id: string,
  isActive: boolean
): Promise<HeroBanner> {
  if (shouldUseHeroBannerRemoteApi()) {
    throw new Error('Hero banner remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}
