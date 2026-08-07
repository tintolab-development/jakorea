import type {
  ImpactStory,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import { shouldUseImpactStoriesRemoteApi } from './capabilities'
import {
  countPinnedStories as countPinnedLocal,
  createStory as createLocal,
  getStoryById,
  readCategories,
  readStories,
  removeStories as removeLocal,
  saveCategories as saveCategoriesLocal,
  setStoryPublic as setPublicLocal,
  updateStory as updateLocal,
} from './store'

export async function listCategoriesService(): Promise<ImpactStoryCategory[]> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return readCategories()
}

export async function saveCategoriesService(
  items: ImpactStoryCategory[]
): Promise<ImpactStoryCategory[]> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return saveCategoriesLocal(items)
}

export async function listStoriesService(
  filter?: ImpactStoryListFilter
): Promise<ImpactStory[]> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return readStories(filter)
}

export async function getStoryService(id: string): Promise<ImpactStory | null> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return getStoryById(id)
}

export async function createStoryService(
  input: ImpactStoryCreateInput
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return createLocal(input)
}

export async function updateStoryService(
  input: ImpactStoryUpdateInput
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return updateLocal(input)
}

export async function removeStoriesService(ids: string[]): Promise<void> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function setStoryPublicService(
  id: string,
  isPublic: boolean
): Promise<ImpactStory> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return setPublicLocal(id, isPublic)
}

export async function countPinnedStoriesService(excludeId?: string): Promise<number> {
  if (shouldUseImpactStoriesRemoteApi()) {
    throw new Error('Impact stories remote API is not implemented yet')
  }
  return countPinnedLocal(excludeId)
}
