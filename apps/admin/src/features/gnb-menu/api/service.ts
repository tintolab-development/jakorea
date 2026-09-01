import type { GnbMenuDoc } from '@/entities/gnb-menu/model/types'
import { getJAKoreaHomepageAdminAPISiteSubset } from '@/shared/api/generated/site/site-api'
import { shouldUseGnbMenuRemoteApi } from './capabilities'
import { mapGnbGroupsToDomain, toGnbUpdateRequest } from './mappers'
import { readGnbMenu, saveGnbMenu as saveLocal } from './store'

function siteApi() {
  return getJAKoreaHomepageAdminAPISiteSubset()
}

export async function getGnbMenuService(): Promise<GnbMenuDoc> {
  if (shouldUseGnbMenuRemoteApi()) {
    return mapGnbGroupsToDomain(await siteApi().get2())
  }
  return readGnbMenu()
}

export async function saveGnbMenuService(doc: GnbMenuDoc): Promise<GnbMenuDoc> {
  if (shouldUseGnbMenuRemoteApi()) {
    const updated = await siteApi().update2(toGnbUpdateRequest(doc))
    return mapGnbGroupsToDomain(updated)
  }
  return saveLocal(doc)
}
