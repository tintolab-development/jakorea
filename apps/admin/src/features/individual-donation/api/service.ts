import type {
  BannerSaveInput,
  DonateCtaSaveInput,
  IndividualDonationData,
  UsageGuideSaveItem,
} from '@/entities/individual-donation/model/types'
import { shouldUseIndividualDonationRemoteApi } from './capabilities'
import {
  readIndividualDonation,
  saveBanner as saveBannerLocal,
  saveDonateCta as saveDonateCtaLocal,
  saveUsageGuide as saveUsageGuideLocal,
} from './store'

const remoteError = 'Individual donation remote API is not implemented yet'

export async function getIndividualDonationService(): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    throw new Error(remoteError)
  }
  return readIndividualDonation()
}

export async function saveBannerService(
  input: BannerSaveInput
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    throw new Error(remoteError)
  }
  return saveBannerLocal(input)
}

export async function saveUsageGuideService(
  items: UsageGuideSaveItem[]
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    throw new Error(remoteError)
  }
  return saveUsageGuideLocal(items)
}

export async function saveDonateCtaService(
  input: DonateCtaSaveInput
): Promise<IndividualDonationData> {
  if (shouldUseIndividualDonationRemoteApi()) {
    throw new Error(remoteError)
  }
  return saveDonateCtaLocal(input)
}
