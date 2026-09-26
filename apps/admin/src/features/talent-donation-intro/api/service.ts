import type {
  BannerSaveInput,
  HowSaveItem,
  InterviewSaveInput,
  TalentDonationIntroData,
} from '@/entities/talent-donation-intro/model/types'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { uploadSponsorshipBannerAsset } from '@/features/individual-donation/api/upload-banner-image'
import { shouldUseTalentDonationIntroRemoteApi } from './capabilities'
import {
  mapTalentAdminToDomain,
  mergeBannerIntoTalentIntro,
  mergeHowItemsIntoTalentIntro,
  mergeInterviewIntoTalentIntro,
  toTalentBannerUpdateRequest,
  toTalentHowItemsUpdateRequest,
  toTalentInterviewUpdateRequest,
} from './mappers'
import {
  readTalentDonationIntro,
  saveBanner as saveBannerLocal,
  saveHowItems as saveHowItemsLocal,
  saveInterview as saveInterviewLocal,
} from './store'

function sponsorshipApi() {
  return getJAKoreaHomepageAdminAPISponsorshipSubset()
}

async function fetchRemoteDetail(): Promise<TalentDonationIntroData> {
  return mapTalentAdminToDomain(await sponsorshipApi().get11())
}

async function resolvePrev(cached?: TalentDonationIntroData): Promise<TalentDonationIntroData> {
  return cached ?? (await fetchRemoteDetail())
}

export async function getTalentDonationIntroService(): Promise<TalentDonationIntroData> {
  if (shouldUseTalentDonationIntroRemoteApi()) {
    return fetchRemoteDetail()
  }
  return readTalentDonationIntro()
}

export async function saveBannerService(
  input: BannerSaveInput,
  cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  if (shouldUseTalentDonationIntroRemoteApi()) {
    let assetId = input.imageAssetId ?? null
    let imageUrl = input.imageUrl.trim()
    let imageFileName = input.imageFileName
    if (input.imageFile) {
      assetId = await uploadSponsorshipBannerAsset(input.imageFile)
      imageUrl = input.imageUrl.trim() || imageUrl
      imageFileName = input.imageFile.name
    }
    if (assetId == null && !imageUrl) {
      throw new Error('BANNER_IMAGE_REQUIRED')
    }
    const mainText = input.mainText.trimEnd()
    const subText = input.subText.trimEnd()
    if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
    if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')

    const prev = await resolvePrev(cached)
    const banner = await sponsorshipApi().updateBanner(
      toTalentBannerUpdateRequest(assetId, mainText, subText, input.version),
    )
    return mergeBannerIntoTalentIntro(prev, banner, {
      imageUrl: imageUrl || prev.banner.imageUrl,
      imageFileName: imageFileName ?? prev.banner.imageFileName,
      imageAssetId: assetId,
    })
  }
  return saveBannerLocal(input)
}

export async function saveHowItemsService(
  items: HowSaveItem[],
  cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  if (shouldUseTalentDonationIntroRemoteApi()) {
    for (const item of items) {
      if (!item.title.trim()) throw new Error('HOW_TITLE_REQUIRED')
      if (!item.description.trim()) throw new Error('HOW_DESCRIPTION_REQUIRED')
    }
    const prev = await resolvePrev(cached)
    const rows = await sponsorshipApi().updateHowItems(toTalentHowItemsUpdateRequest(items))
    return mergeHowItemsIntoTalentIntro(prev, rows ?? [])
  }
  return saveHowItemsLocal(items)
}

export async function saveInterviewService(
  input: InterviewSaveInput,
  cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  if (shouldUseTalentDonationIntroRemoteApi()) {
    if (!input.mainText.trim()) throw new Error('INTERVIEW_MAIN_TEXT_REQUIRED')
    if (!input.subText.trim()) throw new Error('INTERVIEW_SUB_TEXT_REQUIRED')
    if (!input.buttonLabel.trim()) throw new Error('INTERVIEW_BUTTON_REQUIRED')
    const prev = await resolvePrev(cached)
    const row = await sponsorshipApi().updateInterview(
      input.id,
      toTalentInterviewUpdateRequest(input),
    )
    return mergeInterviewIntoTalentIntro(prev, row, {
      linkedStoryTitle: input.linkedStoryTitle,
      thumbnailUrl: input.thumbnailUrl,
    })
  }
  return saveInterviewLocal(input)
}
