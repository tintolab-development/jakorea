import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseJaKoreaBiRemoteApi } from './capabilities'
import { mapBiResponseToDomain, toBiUpdateRequest } from './mappers'
import { readJaKoreaBi, saveJaKoreaBi as saveJaKoreaBiLocal } from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

export async function getJaKoreaBiService(): Promise<JaKoreaBi> {
  if (shouldUseJaKoreaBiRemoteApi()) {
    const response = await jaKoreaApi().bi()
    return mapBiResponseToDomain(response)
  }
  return readJaKoreaBi()
}

export async function saveJaKoreaBiService(data: JaKoreaBi): Promise<JaKoreaBi> {
  if (shouldUseJaKoreaBiRemoteApi()) {
    const updated = await jaKoreaApi().updateBi(toBiUpdateRequest(data))
    return mapBiResponseToDomain(updated)
  }
  return saveJaKoreaBiLocal(data)
}
