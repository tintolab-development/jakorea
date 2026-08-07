import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { shouldUseSiteInfoRemoteApi } from './capabilities'
import { readSiteInfo, saveSiteInfo as saveSiteInfoLocal } from './store'

const remoteError = 'Site info remote API is not implemented yet'

export async function getSiteInfoService(): Promise<SiteInfo> {
  if (shouldUseSiteInfoRemoteApi()) throw new Error(remoteError)
  return readSiteInfo()
}

export async function saveSiteInfoService(input: SiteInfoSaveInput): Promise<SiteInfo> {
  if (shouldUseSiteInfoRemoteApi()) throw new Error(remoteError)
  return saveSiteInfoLocal(input)
}
