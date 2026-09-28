import type { DirectionsInfo } from '@/entities/directions/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { mapDirectionsResponseToDomain, toDirectionsUpdateRequest } from './mappers'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

export async function getDirectionsService(): Promise<DirectionsInfo> {
  // Orval: admin GET /directions → get3
  const response = await jaKoreaApi().get3()
  return mapDirectionsResponseToDomain(response)
}

export async function saveDirectionsService(data: DirectionsInfo): Promise<DirectionsInfo> {
  // Orval: admin PUT /directions → update9
  const updated = await jaKoreaApi().update9(toDirectionsUpdateRequest(data))
  return mapDirectionsResponseToDomain(updated)
}
