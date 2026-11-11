/**
 * CAREERS_POSTING_ATTACHMENT — prepare → PUT → confirm
 * `/api/admin/assets` · JA_NOTICE_ATTACHMENT · uploadToken 사용 금지
 *
 * 본문 인라인 이미지도 같은 채용공고 전용 업로드를 쓴다 — 서버에 채용공고 인라인 이미지 용도가 없고,
 * 본문 HTML 정책은 https 공개 주소 img 를 허용한다.
 */

import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import type { AssetResponse } from '@/shared/api/generated/careers/schemas/assetResponse'
import type { ConfirmRequest } from '@/shared/api/generated/careers/schemas/confirmRequest'
import { contentTypeForAttachmentUpload, isGeneralAttachmentFile } from '@/shared/lib/attachment-policy'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
}

/** OpenAPI ConfirmRequest 는 공개 첨부용 uploadToken 필수지만, Admin 전용 confirm 은 version만 받는다. */
type PostingConfirmBody = Pick<ConfirmRequest, 'version'>

function resolveContentType(file: File): string {
  if (!isGeneralAttachmentFile(file) && !(file.type && file.type !== 'application/octet-stream')) {
    throw new Error('등록할 수 없는 파일 형식입니다.')
  }
  return contentTypeForAttachmentUpload(file)
}

/** 본문 이미지 — 서버 일반 첨부 정책에서 허용하는 이미지 형식 */
const INLINE_IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png'])

async function uploadRecruitPostingAsset(
  file: File
): Promise<{ assetId: number; asset: AssetResponse }> {
  const api = getJAKoreaHomepageAdminAPICareersSubset()
  const prepared = (await api.prepare3({
    originalName: file.name,
    contentType: resolveContentType(file),
    sizeBytes: file.size,
  })) as PrepareRuntime

  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('첨부 파일 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = {
    ...(prepared.requiredHeaders ?? {}),
  }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = resolveContentType(file)
  }

  const uploadRes = await fetch(resolvePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`첨부 파일 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  const asset = await api.confirm3(assetId, { version } as PostingConfirmBody as ConfirmRequest)
  return { assetId, asset }
}

export async function uploadRecruitPostingAttachmentAsset(file: File): Promise<number> {
  const { assetId } = await uploadRecruitPostingAsset(file)
  return assetId
}

export async function uploadRecruitPostingInlineImage(file: File): Promise<string> {
  if (!INLINE_IMAGE_CONTENT_TYPES.has(file.type)) {
    throw new Error('본문 이미지는 JPG, PNG 파일만 등록할 수 있습니다.')
  }
  const { asset } = await uploadRecruitPostingAsset(file)
  const url = asset.publicUrl?.trim()
  if (!url) {
    throw new Error('이미지 주소를 받지 못했습니다.')
  }
  return url
}
