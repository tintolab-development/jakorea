import type {
  DonationSection,
  EducationSection,
  ImpactStoryOption,
  ImpactStorySection,
  MainContents,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import { shouldUseMainContentRemoteApi } from './capabilities'
import {
  mapAdminContentToDomain,
  mergeDonationResponse,
  mergeEducationResponse,
  mergeImpactResponse,
  mergePerformanceResponse,
  toDonationUpdateRequest,
  toEducationUpdateRequest,
  toImpactUpdateRequest,
  toPerformanceUpdateRequest,
} from './mappers'
import {
  readImpactStoryOptions,
  readMainContents,
  saveDonationSection as saveDonationLocal,
  saveEducationSection as saveEducationLocal,
  saveImpactStorySection as saveImpactLocal,
  savePerformanceSection as savePerformanceLocal,
} from './store'

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function fetchRemoteContents(): Promise<MainContents> {
  const response = await mainApi().get9()
  return mapAdminContentToDomain(response)
}

export async function getMainContentsService(): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    return fetchRemoteContents()
  }
  return readMainContents()
}

export async function listImpactStoryOptionsService(): Promise<ImpactStoryOption[]> {
  if (shouldUseMainContentRemoteApi()) {
    const contents = await fetchRemoteContents()
    return contents.impactStoryOptions ?? []
  }
  return readImpactStoryOptions()
}

export async function saveEducationSectionService(
  section: EducationSection,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await fetchRemoteContents()
    const updated = await mainApi().updateEducation(
      toEducationUpdateRequest({ ...section, version: section.version ?? prev.education.version }),
    )
    return mergeEducationResponse(prev, updated)
  }
  return saveEducationLocal(section)
}

export async function saveImpactStorySectionService(
  section: ImpactStorySection,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await fetchRemoteContents()
    const updated = await mainApi().updateImpact(
      toImpactUpdateRequest({
        ...section,
        version: section.version ?? prev.impactStory.version,
      }),
    )
    return mergeImpactResponse(prev, updated)
  }
  return saveImpactLocal(section)
}

export async function savePerformanceSectionService(
  section: PerformanceSection,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await fetchRemoteContents()
    const updated = await mainApi().updatePerformance(
      toPerformanceUpdateRequest({
        ...section,
        version: section.version ?? prev.performance.version,
      }),
    )
    return mergePerformanceResponse(prev, updated)
  }
  return savePerformanceLocal(section)
}

export async function saveDonationSectionService(
  section: DonationSection,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await fetchRemoteContents()
    const updated = await mainApi().updateDonation(
      toDonationUpdateRequest({
        ...section,
        version: section.version ?? prev.donation.version,
      }),
    )
    return mergeDonationResponse(prev, updated)
  }
  return saveDonationLocal(section)
}
