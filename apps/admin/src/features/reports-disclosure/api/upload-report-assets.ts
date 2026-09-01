/**
 * JA_REPORT_THUMBNAIL_IMAGE / JA_REPORT_PDF asset upload
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

type ReportAssetPurpose = 'JA_REPORT_THUMBNAIL_IMAGE' | 'JA_REPORT_PDF'

async function uploadReportAsset(file: File, purpose: ReportAssetPurpose): Promise<number> {
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
    throw new Error('파일 업로드 준비에 실패했습니다.')
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
    throw new Error(`파일 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken: prepared.uploadToken ?? '',
  })

  return assetId
}

export function uploadReportThumbnailAsset(file: File): Promise<number> {
  return uploadReportAsset(file, 'JA_REPORT_THUMBNAIL_IMAGE')
}

export function uploadReportPdfAsset(file: File): Promise<number> {
  return uploadReportAsset(file, 'JA_REPORT_PDF')
}
