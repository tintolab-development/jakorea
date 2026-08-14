import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import type { SiteSettingsResponse } from '@/shared/api/generated/site/schemas/siteSettingsResponse'
import type { SiteSettingsUpdateRequest } from '@/shared/api/generated/site/schemas/siteSettingsUpdateRequest'

export function mapSiteSettingsResponseToDomain(row: SiteSettingsResponse): SiteInfo {
  const og = row.ogImage
  const favicon = row.favicon
  return {
    siteName: row.siteName ?? '',
    siteDescription: row.seoMetaDescription ?? '',
    ogImageUrl: og?.publicUrl ?? '',
    ogImageFileName: og?.originalName,
    ogAssetId: og?.assetId,
    faviconUrl: favicon?.publicUrl ?? '',
    faviconFileName: favicon?.originalName,
    faviconAssetId: favicon?.assetId,
    updatedAt: '',
    version: row.version ?? 0,
  }
}

export function toSiteSettingsUpdateRequest(
  input: SiteInfoSaveInput,
  version: number,
  ogAssetId: number | undefined,
  faviconAssetId: number | undefined,
): SiteSettingsUpdateRequest {
  return {
    siteName: input.siteName.trim(),
    seoMetaDescription: input.siteDescription.trimEnd() || undefined,
    ogAssetId,
    faviconAssetId,
    version,
  }
}
