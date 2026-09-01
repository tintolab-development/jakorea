import type { JaKoreaWorldwide } from '@/entities/ja-korea-worldwide/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseJaKoreaWorldwideRemoteApi } from './capabilities'
import { mapWorldwideResponseToDomain, toWorldwideUpdateRequest } from './mappers'
import {
  readJaKoreaWorldwide,
  saveJaKoreaWorldwide as saveJaKoreaWorldwideLocal,
} from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

export async function getJaKoreaWorldwideService(): Promise<JaKoreaWorldwide> {
  if (shouldUseJaKoreaWorldwideRemoteApi()) {
    const response = await jaKoreaApi().worldwide()
    return mapWorldwideResponseToDomain(response)
  }
  return readJaKoreaWorldwide()
}

export async function saveJaKoreaWorldwideService(
  data: JaKoreaWorldwide,
): Promise<JaKoreaWorldwide> {
  if (shouldUseJaKoreaWorldwideRemoteApi()) {
    const updated = await jaKoreaApi().updateWorldwide(toWorldwideUpdateRequest(data))
    return mapWorldwideResponseToDomain(updated)
  }
  return saveJaKoreaWorldwideLocal(data)
}
