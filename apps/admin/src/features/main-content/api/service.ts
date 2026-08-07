import type {
  DonationSection,
  EducationSection,
  ImpactStoryOption,
  ImpactStorySection,
  MainContents,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import { shouldUseMainContentRemoteApi } from './capabilities'
import {
  readImpactStoryOptions,
  readMainContents,
  saveDonationSection as saveDonationLocal,
  saveEducationSection as saveEducationLocal,
  saveImpactStorySection as saveImpactLocal,
  savePerformanceSection as savePerformanceLocal,
} from './store'

export async function getMainContentsService(): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return readMainContents()
}

export async function listImpactStoryOptionsService(): Promise<ImpactStoryOption[]> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return readImpactStoryOptions()
}

export async function saveEducationSectionService(
  section: EducationSection
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return saveEducationLocal(section)
}

export async function saveImpactStorySectionService(
  section: ImpactStorySection
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return saveImpactLocal(section)
}

export async function savePerformanceSectionService(
  section: PerformanceSection
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return savePerformanceLocal(section)
}

export async function saveDonationSectionService(
  section: DonationSection
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    throw new Error('Main content remote API is not implemented yet')
  }
  return saveDonationLocal(section)
}
