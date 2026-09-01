import type {
  BannerSaveInput,
  DonateCtaSaveInput,
  IndividualDonationData,
  UsageGuideSaveItem,
} from '@/entities/individual-donation/model/types'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { shouldUseIndividualDonationRemoteApi } from './capabilities'
import {
  mapPersonalAdminToDomain,
  mergeBannerIntoPersonal,
  mergeDonateCtaIntoPersonal,
  mergeUsageIntoPersonal,
  toBannerUpdateRequest,
  toDonationUrlUpdateRequest,
  toUsageUpdateRequest,
  usageGuideApiId,
} from './mappers'
import {
  readIndividualDonation,
  saveBanner as saveBannerLocal,
  saveDonateCta as saveDonateCtaLocal,
  saveUsageGuide as saveUsageGuideLocal,
} from './store'
import { uploadSponsorshipBannerAsset } from './upload-banner-image'

function sponsorshipApi() {
  return getJAKoreaHomepageAdminAPISponsorshipSubset()
}

async function fetchRemoteDetail(): Promise<IndividualDonationData> {
  return mapPersonalAdminToDomain(await sponsorshipApi().personal1())
}

async function resolvePrev(cached?: IndividualDonationData): Promise<IndividualDonationData> {
  return cached ?? (await fetchRemoteDetail())
}

export async function getIndividualDonationService(): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    return fetchRemoteDetail()
  }
  return readIndividualDonation()
}

export async function saveBannerService(
  input: BannerSaveInput,
  cached?: IndividualDonationData,
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    let assetId = input.imageAssetId
    if (input.imageFile) {
      assetId = await uploadSponsorshipBannerAsset(input.imageFile)
    }
    if (assetId == null) {
      throw new Error('BANNER_IMAGE_REQUIRED')
    }
    const mainText = input.mainText.trimEnd()
    const subText = input.subText.trimEnd()
    if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
    if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')

    const prev = await resolvePrev(cached)
    const banner = await sponsorshipApi().updatePersonalBanner(
      toBannerUpdateRequest(assetId, mainText, subText, input.version),
    )
    return mergeBannerIntoPersonal(prev, banner, assetId)
  }
  return saveBannerLocal(input)
}

export async function saveUsageGuideService(
  items: UsageGuideSaveItem[],
  cached?: IndividualDonationData,
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    const payload = items.map(item => ({
      ...item,
      apiId: item.apiId || usageGuideApiId(item.id),
    }))
    for (const item of payload) {
      if (!item.mainText.trim()) throw new Error('USAGE_MAIN_TEXT_REQUIRED')
      if (!item.subText.trim()) throw new Error('USAGE_SUB_TEXT_REQUIRED')
    }
    const prev = await resolvePrev(cached)
    const rows = await sponsorshipApi().updatePersonalUsage(toUsageUpdateRequest(payload))
    return mergeUsageIntoPersonal(prev, rows ?? [])
  }
  return saveUsageGuideLocal(items)
}

export async function saveDonateCtaService(
  input: DonateCtaSaveInput,
  cached?: IndividualDonationData,
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    const linkUrl = input.linkUrl.trim()
    if (!linkUrl) throw new Error('DONATE_LINK_REQUIRED')
    const prev = await resolvePrev(cached)
    const button = await sponsorshipApi().updateDonationUrl(toDonationUrlUpdateRequest(input))
    return mergeDonateCtaIntoPersonal(prev, button)
  }
  return saveDonateCtaLocal(input)
}
