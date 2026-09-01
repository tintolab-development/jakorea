import type {
  BannerSaveInput,
  CorporateGuideData,
  MetricSaveItem,
  PartnershipSaveItem,
} from '@/entities/corporate-guide/model/types'
import { uploadSponsorshipBannerAsset } from '@/features/individual-donation/api/upload-banner-image'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { shouldUseCorporateGuideRemoteApi } from './capabilities'
import {
  mapCorporateAdminToDomain,
  mergeBannerIntoCorporateGuide,
  mergeMetricsIntoCorporateGuide,
  mergeStepsIntoCorporateGuide,
  toCorporateBannerUpdateRequest,
  toMetricsUpdateRequest,
  toStepsUpdateRequest,
} from './mappers'
import {
  readCorporateGuide,
  saveBanner as saveBannerLocal,
  saveMetrics as saveMetricsLocal,
  savePartnership as savePartnershipLocal,
} from './store'

function sponsorshipApi() {
  return getJAKoreaHomepageAdminAPISponsorshipSubset()
}

async function fetchRemoteDetail(): Promise<CorporateGuideData> {
  return mapCorporateAdminToDomain(await sponsorshipApi().corporate1())
}

async function resolvePrev(cached?: CorporateGuideData): Promise<CorporateGuideData> {
  return cached ?? (await fetchRemoteDetail())
}

export async function getCorporateGuideService(): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    return fetchRemoteDetail()
  }
  return readCorporateGuide()
}

export async function saveBannerService(
  input: BannerSaveInput,
  cached?: CorporateGuideData,
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    let assetId = input.imageAssetId
    if (input.imageFile) {
      assetId = await uploadSponsorshipBannerAsset(input.imageFile)
    }
    if (assetId == null) throw new Error('BANNER_IMAGE_REQUIRED')
    const mainText = input.mainText.trimEnd()
    const subText = input.subText.trimEnd()
    if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
    if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')
    const prev = await resolvePrev(cached)
    const banner = await sponsorshipApi().updateCorporateBanner(
      toCorporateBannerUpdateRequest(assetId, mainText, subText, input.version),
    )
    return mergeBannerIntoCorporateGuide(prev, banner, assetId)
  }
  return saveBannerLocal(input)
}

export async function saveMetricsService(
  items: MetricSaveItem[],
  cached?: CorporateGuideData,
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    for (const item of items) {
      if (!item.title.trim()) throw new Error('METRIC_TITLE_REQUIRED')
      if (!item.description.trim()) throw new Error('METRIC_DESCRIPTION_REQUIRED')
    }
    const prev = await resolvePrev(cached)
    const rows = await sponsorshipApi().updateCorporateMetrics(toMetricsUpdateRequest(items))
    return mergeMetricsIntoCorporateGuide(prev, rows ?? [])
  }
  return saveMetricsLocal(items)
}

export async function savePartnershipService(
  items: PartnershipSaveItem[],
  cached?: CorporateGuideData,
): Promise<CorporateGuideData> {
  if (shouldUseCorporateGuideRemoteApi()) {
    for (const item of items) {
      if (!item.title.trim()) throw new Error('PARTNERSHIP_TITLE_REQUIRED')
      if (!item.description.trim()) throw new Error('PARTNERSHIP_DESCRIPTION_REQUIRED')
    }
    const prev = await resolvePrev(cached)
    const rows = await sponsorshipApi().updateCorporateSteps(toStepsUpdateRequest(items))
    return mergeStepsIntoCorporateGuide(prev, rows ?? [])
  }
  return savePartnershipLocal(items)
}
