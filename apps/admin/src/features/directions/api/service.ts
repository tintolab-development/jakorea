import type { DirectionsInfo } from '@/entities/directions/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseDirectionsRemoteApi } from './capabilities'
import { mapDirectionsResponseToDomain, toDirectionsUpdateRequest } from './mappers'
import { readDirections, saveDirections as saveDirectionsLocal } from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

export async function getDirectionsService(): Promise<DirectionsInfo> {
  if (shouldUseDirectionsRemoteApi()) {
    // Orval: admin GET /directions → get3
    const response = await jaKoreaApi().get3()
    return mapDirectionsResponseToDomain(response)
  }
  return readDirections()
}

export async function saveDirectionsService(data: DirectionsInfo): Promise<DirectionsInfo> {
  if (shouldUseDirectionsRemoteApi()) {
    // Orval: admin PUT /directions → update9
    const updated = await jaKoreaApi().update9(toDirectionsUpdateRequest(data))
    return mapDirectionsResponseToDomain(updated)
  }
  return saveDirectionsLocal(data)
}
