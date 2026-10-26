/**
 * 채용공고 — OpenAPI ↔ 도메인 매핑
 */

import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingAttachmentMime,
  RecruitPostingCreateInput,
  RecruitPostingFormStatus,
  RecruitPostingStatus,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'
import {
  normalizeCareerPostingLinkFields,
  readCareerPostingLinkFields,
} from '../lib/link-fields.ts'
import type { AssetResponse } from '@/shared/api/generated/careers/schemas/assetResponse'
import type { CareerPostingAdminDetail } from '@/shared/api/generated/careers/schemas/careerPostingAdminDetail'
import type { CareerPostingAdminItem } from '@/shared/api/generated/careers/schemas/careerPostingAdminItem'
import type { CareerPostingAdminItemStatus } from '@/shared/api/generated/careers/schemas/careerPostingAdminItemStatus'
import type { CareerPostingCreateRequest } from '@/shared/api/generated/careers/schemas/careerPostingCreateRequest'
import type { CareerPostingCreateRequestStatus } from '@/shared/api/generated/careers/schemas/careerPostingCreateRequestStatus'
import type { CareerPostingUpdateRequest } from '@/shared/api/generated/careers/schemas/careerPostingUpdateRequest'
import type { CareerPostingUpdateRequestStatus } from '@/shared/api/generated/careers/schemas/careerPostingUpdateRequestStatus'

function mapStatus(
  status: CareerPostingAdminItemStatus | CareerPostingAdminDetail['status'] | undefined,
): RecruitPostingStatus | null {
  if (status === 'RECRUITING') return 'recruiting'
  if (status === 'RESULT') return 'result'
  if (status === 'CLOSED') return 'closed'
  return null
}

function text(value: string | null | undefined): string {
  return value ?? ''
}

/** API date / ISO → `YYYY-MM-DD` */
export function toYmd(value: string | undefined | null): string {
  if (!value) return ''
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  return match?.[1] ?? ''
}

function mapMime(contentType: string | undefined): RecruitPostingAttachmentMime {
  switch (contentType) {
    case 'image/jpeg':
    case 'image/png':
    case 'application/pdf':
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return contentType
    default:
      return 'application/octet-stream'
  }
}

function mapAttachment(asset: AssetResponse | undefined | null): RecruitPostingAttachment[] {
  if (!asset || asset.assetId == null) return []
  return [
    {
      id: String(asset.assetId),
      name: text(asset.originalName) || `attachment-${asset.assetId}`,
      mime: mapMime(asset.contentType),
      dataUrl: asset.publicUrl?.trim() || undefined,
      assetId: asset.assetId,
    },
  ]
}

function mapAdminFields(
  row: CareerPostingAdminItem | CareerPostingAdminDetail,
  link = readCareerPostingLinkFields(undefined),
): Omit<RecruitPosting, 'contentMarkdown' | 'attachments'> | null {
  if (row.id == null) return null
  const status = mapStatus(row.status)
  if (!status) return null
  return {
    id: String(row.id),
    isPublic: row.isPublic ?? false,
    status,
    title: text(row.title),
    authorName: text(row.authorName),
    recruitStart: text(row.recruitStart),
    recruitEnd: text(row.recruitEnd),
    publishedAt: text(row.publishedOn),
    createdAt: text(row.createdAt),
    viewCount: 0,
    version: row.version ?? 0,
    buttonLabel: link.buttonLabel,
    linkUrl: link.linkUrl,
  }
}

/** 목록 item — body·첨부 없음 */
export function mapCareerPostingAdminItem(row: CareerPostingAdminItem): RecruitPosting | null {
  const base = mapAdminFields(row)
  if (!base) return null
  return {
    ...base,
    contentMarkdown: '',
    attachments: [],
  }
}

/** 상세·create/update 응답 */
export function mapCareerPostingAdminDetail(row: CareerPostingAdminDetail): RecruitPosting | null {
  const base = mapAdminFields(row, readCareerPostingLinkFields(row))
  if (!base) return null
  return {
    ...base,
    contentMarkdown: text(row.body),
    attachments: mapAttachment(row.attachment),
  }
}

export function toCreateWireStatus(
  status: RecruitPostingFormStatus | 'closed',
): CareerPostingCreateRequestStatus {
  if (status === 'recruiting') return 'RECRUITING'
  // 등록 API는 CLOSED 거부 — closed가 오면 RESULT로 보내지 말고 호출 전에 막는다
  return 'RESULT'
}

export function toUpdateWireStatus(
  status: RecruitPostingFormStatus | RecruitPostingStatus,
): CareerPostingUpdateRequestStatus {
  if (status === 'recruiting') return 'RECRUITING'
  if (status === 'closed') return 'CLOSED'
  return 'RESULT'
}

export function toCareerPostingCreateRequest(
  input: RecruitPostingCreateInput,
  attachmentAssetId?: number,
): CareerPostingCreateRequest {
  const link = normalizeCareerPostingLinkFields({
    buttonLabel: input.buttonLabel,
    linkUrl: input.linkUrl,
  })
  const request: CareerPostingCreateRequest = {
    title: input.title.trim(),
    body: input.contentMarkdown,
    isPublic: input.isPublic,
    status: toCreateWireStatus(input.status),
    publishedOn: toYmd(input.publishedAt),
    recruitStart: toYmd(input.recruitStart),
    recruitEnd: toYmd(input.recruitEnd),
    authorName: input.authorName.trim(),
    buttonLabel: link.buttonLabel,
    linkUrl: link.linkUrl,
  }
  if (attachmentAssetId != null) {
    request.attachmentAssetId = attachmentAssetId
  }
  return request
}

export function toCareerPostingUpdateRequest(
  input: RecruitPostingUpdateInput,
  version: number,
  attachmentAssetId?: number,
): CareerPostingUpdateRequest {
  const link = normalizeCareerPostingLinkFields({
    buttonLabel: input.buttonLabel,
    linkUrl: input.linkUrl,
  })
  const request: CareerPostingUpdateRequest = {
    title: input.title.trim(),
    body: input.contentMarkdown,
    isPublic: input.isPublic,
    status: toUpdateWireStatus(input.status),
    publishedOn: toYmd(input.publishedAt),
    recruitStart: toYmd(input.recruitStart),
    recruitEnd: toYmd(input.recruitEnd),
    authorName: input.authorName.trim(),
    version,
    buttonLabel: link.buttonLabel,
    linkUrl: link.linkUrl,
  }
  if (attachmentAssetId != null) {
    request.attachmentAssetId = attachmentAssetId
  }
  return request
}

export function toNumericId(id: string): number {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('채용공고 id가 올바르지 않습니다.')
  }
  return numericId
}
