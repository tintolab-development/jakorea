import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { getJAKoreaHomepageAdminAPISiteSubset } from '@/shared/api/generated/site/site-api'
import { shouldUseSiteInfoRemoteApi } from './capabilities'
import { mapSiteSettingsResponseToDomain, toSiteSettingsUpdateRequest } from './mappers'
import { readSiteInfo, saveSiteInfo as saveSiteInfoLocal } from './store'
import { uploadSiteFaviconAsset, uploadSiteOgImageAsset } from './upload-site-assets'

function siteApi() {
  return getJAKoreaHomepageAdminAPISiteSubset()
}

async function resolveOgAssetId(
  current: SiteInfo,
  input: SiteInfoSaveInput,
): Promise<number | undefined> {
  if (input.ogImageFile) {
    return uploadSiteOgImageAsset(input.ogImageFile)
  }
  if (input.ogAssetId != null) {
    return input.ogAssetId
  }
  if (current.ogAssetId != null && input.ogImageUrl.trim()) {
    return current.ogAssetId
  }
  if (!input.ogImageUrl.trim()) {
    return undefined
  }
  throw new Error('링크 공유용 이미지 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

async function resolveFaviconAssetId(
  current: SiteInfo,
  input: SiteInfoSaveInput,
): Promise<number | undefined> {
  if (input.faviconFile) {
    return uploadSiteFaviconAsset(input.faviconFile)
  }
  if (input.faviconAssetId != null) {
    return input.faviconAssetId
  }
  if (current.faviconAssetId != null && input.faviconUrl.trim()) {
    return current.faviconAssetId
  }
  if (!input.faviconUrl.trim()) {
    return undefined
  }
  throw new Error('파비콘 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function getSiteInfoService(): Promise<SiteInfo> {
  if (shouldUseSiteInfoRemoteApi()) {
    return mapSiteSettingsResponseToDomain(await siteApi().get1())
  }
  return readSiteInfo()
}

export async function saveSiteInfoService(
  input: SiteInfoSaveInput,
  cached?: SiteInfo,
): Promise<SiteInfo> {
  if (shouldUseSiteInfoRemoteApi()) {
    const current = cached ?? mapSiteSettingsResponseToDomain(await siteApi().get1())
    const ogAssetId = await resolveOgAssetId(current, input)
    const faviconAssetId = await resolveFaviconAssetId(current, input)
    const updated = await siteApi().update1(
      toSiteSettingsUpdateRequest(input, current.version, ogAssetId, faviconAssetId),
    )
    return mapSiteSettingsResponseToDomain(updated)
  }
  return saveSiteInfoLocal(input)
}
