import type {
  BannerSaveInput,
  HowSaveItem,
  InterviewSaveInput,
  TalentDonationIntroData,
} from '@/entities/talent-donation-intro/model/types'
import { shouldUseTalentDonationIntroRemoteApi } from './capabilities'
import {
  readTalentDonationIntro,
  saveBanner as saveBannerLocal,
  saveHowItems as saveHowItemsLocal,
  saveInterview as saveInterviewLocal,
} from './store'

export async function getTalentDonationIntroService(): Promise<TalentDonationIntroData> {
  if (shouldUseTalentDonationIntroRemoteApi()) {
    return readTalentDonationIntro()
  }
  return readTalentDonationIntro()
}

export async function saveBannerService(
  input: BannerSaveInput,
  _cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  void _cached
  return saveBannerLocal(input)
}

export async function saveHowItemsService(
  items: HowSaveItem[],
  _cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  void _cached
  return saveHowItemsLocal(items)
}

export async function saveInterviewService(
  input: InterviewSaveInput,
  _cached?: TalentDonationIntroData,
): Promise<TalentDonationIntroData> {
  void _cached
  return saveInterviewLocal(input)
}
