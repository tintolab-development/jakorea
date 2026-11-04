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
import { isOptimisticLockConflictError } from '@/shared/lib/api-error-message'
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

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function fetchRemoteContents(): Promise<MainContents> {
  const response = await mainApi().get13()
  return mapAdminContentToDomain(response)
}

async function resolveRemoteContents(cached?: MainContents): Promise<MainContents> {
  if (cached) return cached
  return fetchRemoteContents()
}

async function putWithLockRetry(
  firstVersion: number,
  put: (prev: MainContents, version: number) => Promise<MainContents>,
  readFreshVersion: (fresh: MainContents) => number,
  cached?: MainContents,
): Promise<MainContents> {
  try {
    return await put(await resolveRemoteContents(cached), firstVersion)
  } catch (error) {
    if (!isOptimisticLockConflictError(error)) throw error
    const fresh = await fetchRemoteContents()
    return put(fresh, readFreshVersion(fresh))
  }
}

export async function getMainContentsService(): Promise<MainContents> {
  return fetchRemoteContents()
}

export async function listImpactStoryOptionsService(): Promise<ImpactStoryOption[]> {
  const contents = await fetchRemoteContents()
  return contents.impactStoryOptions ?? []
}

export async function saveEducationSectionService(
  section: EducationSection,
  cached?: MainContents,
): Promise<MainContents> {
  return putWithLockRetry(
    section.version,
    async (prev, version) => {
      const updated = await mainApi().updateEducation(
        toEducationUpdateRequest({ ...section, version }),
      )
      return mergeEducationResponse(prev, updated as EducationResponse)
    },
    fresh => fresh.education.version,
    cached,
  )
}

export async function saveImpactStorySectionService(
  section: ImpactStorySection,
  cached?: MainContents,
): Promise<MainContents> {
  return putWithLockRetry(
    section.version,
    async (prev, version) => {
      const updated = await mainApi().updateImpact(
        toImpactUpdateRequest({ ...section, version }),
      )
      return mergeImpactResponse(prev, updated as ImpactResponse)
    },
    fresh => fresh.impactStory.version,
    cached,
  )
}

export async function savePerformanceSectionService(
  section: PerformanceSection,
  cached?: MainContents,
): Promise<MainContents> {
  return putWithLockRetry(
    section.version,
    async (prev, version) => {
      const updated = await mainApi().updatePerformance(
        toPerformanceUpdateRequest({ ...section, version }),
      )
      return mergePerformanceResponse(prev, updated as PerformanceResponse)
    },
    fresh => fresh.performance.version,
    cached,
  )
}

export async function saveDonationSectionService(
  section: DonationSection,
  cached?: MainContents,
): Promise<MainContents> {
  return putWithLockRetry(
    section.version,
    async (prev, version) => {
      const updated = await mainApi().updateDonation(
        toDonationUpdateRequest({ ...section, version }),
      )
      return mergeDonationResponse(prev, updated as DonationResponse)
    },
    fresh => fresh.donation.version,
    cached,
  )
}
