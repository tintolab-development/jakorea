import type {
  BannerSaveInput,
  CorporateGuideData,
  MetricSaveItem,
  PartnershipSaveItem,
} from '@/entities/corporate-guide/model/types'
import { shouldUseCorporateGuideRemoteApi } from './capabilities'
import {
  readCorporateGuide,
  saveBanner as saveBannerLocal,
  saveMetrics as saveMetricsLocal,
  savePartnership as savePartnershipLocal,
} from './store'

const remoteError = 'Corporate guide remote API is not implemented yet'

export async function getCorporateGuideService(): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    throw new Error(remoteError)
  }
  return readCorporateGuide()
}

export async function saveBannerService(
  input: BannerSaveInput
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    throw new Error(remoteError)
  }
  return saveBannerLocal(input)
}

export async function saveMetricsService(
  items: MetricSaveItem[]
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    throw new Error(remoteError)
  }
  return saveMetricsLocal(items)
}

export async function savePartnershipService(
  items: PartnershipSaveItem[]
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    throw new Error(remoteError)
  }
  return savePartnershipLocal(items)
}
