/**
 * SITE_OG_IMAGE / SITE_FAVICON asset prepare → binary upload → confirm
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import type { UploadPrepareRequestPurpose } from '@/shared/api/generated/assets/schemas/uploadPrepareRequestPurpose'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

type SiteAssetPurpose = Extract<
  UploadPrepareRequestPurpose,
  'SITE_OG_IMAGE' | 'SITE_FAVICON'
>

async function uploadSiteAsset(file: File, purpose: SiteAssetPurpose): Promise<number> {
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose,
    originalName: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })) as PrepareRuntime

  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('이미지 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = {
    ...(prepared.requiredHeaders ?? {}),
  }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = file.type || 'application/octet-stream'
  }

  const uploadRes = await fetch(uploadUrl, {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`이미지 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  const uploadToken = prepared.uploadToken ?? ''
  await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken,
  })

  return assetId
}

export function uploadSiteOgImageAsset(file: File): Promise<number> {
  return uploadSiteAsset(file, 'SITE_OG_IMAGE')
}

export function uploadSiteFaviconAsset(file: File): Promise<number> {
  return uploadSiteAsset(file, 'SITE_FAVICON')
}
