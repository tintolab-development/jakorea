import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseJaKoreaIntroRemoteApi } from './capabilities'
import { mapIntroductionResponseToDomain, toIntroductionUpdateRequest } from './mappers'
import { readJaKoreaIntro, saveJaKoreaIntro as saveJaKoreaIntroLocal } from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

export async function getJaKoreaIntroService(): Promise<JaKoreaIntro> {
  if (shouldUseJaKoreaIntroRemoteApi()) {
    const response = await jaKoreaApi().introduction()
    return mapIntroductionResponseToDomain(response)
  }
  return readJaKoreaIntro()
}

export async function saveJaKoreaIntroService(data: JaKoreaIntro): Promise<JaKoreaIntro> {
  if (shouldUseJaKoreaIntroRemoteApi()) {
    const updated = await jaKoreaApi().updateIntroduction(toIntroductionUpdateRequest(data))
    return mapIntroductionResponseToDomain(updated)
  }
  return saveJaKoreaIntroLocal(data)
}
