import type {
  DonationSection,
  EducationSection,
  ImpactStoryOption,
  ImpactStorySection,
  MainContents,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import type { DonationResponse } from '@/shared/api/generated/main/schemas/donationResponse'
import type { EducationResponse } from '@/shared/api/generated/main/schemas/educationResponse'
import type { ImpactResponse } from '@/shared/api/generated/main/schemas/impactResponse'
import type { PerformanceResponse } from '@/shared/api/generated/main/schemas/performanceResponse'
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
  const response = await mainApi().get10()
  return mapAdminContentToDomain(response)
}

async function resolveRemoteContents(cached?: MainContents): Promise<MainContents> {
  if (cached) return cached
  return fetchRemoteContents()
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
  cached?: MainContents,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await resolveRemoteContents(cached)
    const updated = await mainApi().updateEducation(
      toEducationUpdateRequest({ ...section, version: section.version ?? prev.education.version }),
    )
    return mergeEducationResponse(prev, updated as EducationResponse)
  }
  return saveEducationLocal(section)
}

export async function saveImpactStorySectionService(
  section: ImpactStorySection,
  cached?: MainContents,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await resolveRemoteContents(cached)
    const updated = await mainApi().updateImpact(
      toImpactUpdateRequest({
        ...section,
        version: section.version ?? prev.impactStory.version,
      }),
    )
    return mergeImpactResponse(prev, updated as ImpactResponse)
  }
  return saveImpactLocal(section)
}

export async function savePerformanceSectionService(
  section: PerformanceSection,
  cached?: MainContents,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await resolveRemoteContents(cached)
    const updated = await mainApi().updatePerformance(
      toPerformanceUpdateRequest({
        ...section,
        version: section.version ?? prev.performance.version,
      }),
    )
    return mergePerformanceResponse(prev, updated as PerformanceResponse)
  }
  return savePerformanceLocal(section)
}

export async function saveDonationSectionService(
  section: DonationSection,
  cached?: MainContents,
): Promise<MainContents> {
  if (shouldUseMainContentRemoteApi()) {
    const prev = await resolveRemoteContents(cached)
    const updated = await mainApi().updateDonation(
      toDonationUpdateRequest({
        ...section,
        version: section.version ?? prev.donation.version,
      }),
    )
    return mergeDonationResponse(prev, updated as DonationResponse)
  }
  return saveDonationLocal(section)
}
