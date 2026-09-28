import type { GnbMenuDoc } from '@/entities/gnb-menu/model/types'
import { getJAKoreaHomepageAdminAPISiteSubset } from '@/shared/api/generated/site/site-api'
import { mapGnbGroupsToDomain, toGnbUpdateRequest } from './mappers'

function siteApi() {
  return getJAKoreaHomepageAdminAPISiteSubset()
}

export async function getGnbMenuService(): Promise<GnbMenuDoc> {
  return mapGnbGroupsToDomain(await siteApi().get2())
}

export async function saveGnbMenuService(doc: GnbMenuDoc): Promise<GnbMenuDoc> {
  const updated = await siteApi().update2(toGnbUpdateRequest(doc))
  return mapGnbGroupsToDomain(updated)
}
