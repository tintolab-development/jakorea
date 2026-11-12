/**
 * 에디터 본문 인라인 이미지 업로드 — 일반 자산 API(prepare → PUT → confirm) 후 공개 주소를 돌려준다.
 * 본문 HTML 정책은 https 공개 주소 img 만 받고 data: 이미지는 거절한다.
 * 교재 단원 소개(EDUCATION_TEXTBOOK_INLINE_IMAGE)·채용공고 본문(CAREERS_POSTING_INLINE_IMAGE)이 쓴다.
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import type { UploadPrepareRequestPurpose } from '@/shared/api/generated/assets/schemas/uploadPrepareRequestPurpose'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

/** 서버 인라인 이미지 용도의 허용 형식(IMPACT_STORY_INLINE_IMAGE 와 동일) */
export const ADMIN_INLINE_IMAGE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

export async function uploadAdminInlineImage(
  file: File,
  purpose: UploadPrepareRequestPurpose
): Promise<string> {
  const contentType = file.type
  if (!ADMIN_INLINE_IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('본문 이미지는 JPG, PNG, GIF, WEBP 파일만 등록할 수 있습니다.')
  }

  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose,
    originalName: file.name,
    contentType,
    sizeBytes: file.size,
  })) as PrepareRuntime

  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('이미지 업로드 준비에 실패했습니다.')
  }

  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = contentType
  }
  const uploadRes = await fetch(resolvePresignedUploadUrl(uploadUrl), {
    method: (prepared.method ?? 'PUT').toUpperCase(),
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`이미지 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  const confirmed = await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken: prepared.uploadToken ?? '',
  })
  const url =
    confirmed?.publicUrl?.trim() || (await assetsApi.getAsset(assetId)).publicUrl?.trim() || ''
  if (!url) {
    throw new Error('이미지 주소를 받지 못했습니다.')
  }
  return url
}
