/**
 * MAIN_POPUP_IMAGE asset prepare → binary upload → confirm
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

export async function uploadPopupImageAsset(file: File): Promise<number> {
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose: 'MAIN_POPUP_IMAGE',
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
