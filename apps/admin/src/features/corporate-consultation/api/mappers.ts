/**
 * 기업 후원 상담 — OpenAPI ↔ 도메인 매핑
 */

import type {
  ConsultationStatus,
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import type { BulkRequest } from '@/shared/api/generated/sponsorship/schemas/bulkRequest'
import type { ApplicationAttachmentItem } from '@/shared/api/generated/sponsorship/schemas/applicationAttachmentItem'
import type { ConsultationDetailResponse } from '@/shared/api/generated/sponsorship/schemas/consultationDetailResponse'
import type { ConsultationListItem } from '@/shared/api/generated/sponsorship/schemas/consultationListItem'
import type { List14Params } from '@/shared/api/generated/sponsorship/schemas/list14Params'
import type { StatusUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/statusUpdateRequest'
import { StatusUpdateRequestStatus } from '@/shared/api/generated/sponsorship/schemas/statusUpdateRequestStatus'
import { List14Status } from '@/shared/api/generated/sponsorship/schemas/list14Status'

import { ADMIN_LIST_PAGE_SIZE } from '@/shared/lib/admin-infinite-list'

export const LIST_PAGE_SIZE = ADMIN_LIST_PAGE_SIZE

function toDomainStatus(status: string | undefined): ConsultationStatus {
  return status === 'CONFIRMED' ? 'confirmed' : 'pending'
}

function firstApplicationAttachment(
  attachments: ApplicationAttachmentItem[] | undefined,
  originalName?: string | null,
): { fileName: string | null; assetId?: number } {
  const first = attachments?.find(
    item => item.assetId != null || Boolean(item.originalName?.trim()),
  )
  const fileName = originalName?.trim() || first?.originalName?.trim() || null
  return {
    fileName,
    ...(first?.assetId != null ? { assetId: first.assetId } : {}),
  }
}

function toApiStatus(status: ConsultationStatus): StatusUpdateRequestStatus {
  return status === 'confirmed'
    ? StatusUpdateRequestStatus.CONFIRMED
    : StatusUpdateRequestStatus.PENDING
}

export function mapConsultationListItemToDomain(row: ConsultationListItem): CorporateConsultation {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    status: toDomainStatus(row.status),
    companyName: row.companyName ?? '',
    contactName: row.contactName ?? '',
    departmentTitle: row.departmentTitle ?? '',
    phone: row.maskedContactPhone ?? '',
    privacyConsent: true,
    content: '',
    linkUrl: null,
    attachmentFileName: null,
    attachmentUrl: null,
    appliedAt: row.createdAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    confirmedByName: null,
    version: row.version ?? 0,
  }
}

export function mapConsultationDetailToDomain(
  row: ConsultationDetailResponse,
): CorporateConsultation {
  const id = row.id != null ? String(row.id) : ''
  const attachment = firstApplicationAttachment(row.attachments, row.attachmentOriginalName)
  return {
    id,
    status: toDomainStatus(row.status),
    companyName: row.companyName ?? '',
    contactName: row.contactName ?? '',
    departmentTitle: row.departmentTitle ?? '',
    phone: row.contactPhone ?? '',
    privacyConsent: true,
    content: row.consultationContent ?? '',
    linkUrl: row.linkUrl?.trim() ? row.linkUrl.trim() : null,
    attachmentFileName: attachment.fileName,
    attachmentAssetId: attachment.assetId,
    attachmentUrl: null,
    appliedAt: row.createdAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    confirmedByName: row.confirmedByName?.trim() ? row.confirmedByName.trim() : null,
    version: row.version ?? 0,
  }
}

export function toConsultationListParams(
  filter: CorporateConsultationListFilter = {},
  page = 0,
  size = LIST_PAGE_SIZE,
): List14Params {
  const params: List14Params = {
    page,
    size,
  }

  if (filter.status === 'pending') params.status = List14Status.PENDING
  if (filter.status === 'confirmed') params.status = List14Status.CONFIRMED

  const companyName = filter.companyName?.trim()
  if (companyName) params.companyName = companyName

  const contactName = filter.contactName?.trim()
  if (contactName) params.contactName = contactName

  const departmentTitle = filter.departmentTitle?.trim()
  if (departmentTitle) params.departmentTitle = departmentTitle

  if (filter.appliedFrom) params.createdFrom = filter.appliedFrom
  if (filter.appliedTo) params.createdTo = filter.appliedTo
  if (filter.confirmedFrom) params.confirmedFrom = filter.confirmedFrom
  if (filter.confirmedTo) params.confirmedTo = filter.confirmedTo

  return params
}

/** 엑셀 export — 목록과 같은 필터, page/size 없음 (BE `/export` 가 전체를 내려준다). */
export function toConsultationExportParams(
  filter: CorporateConsultationListFilter = {},
): Omit<List14Params, 'page' | 'size'> {
  const params: Partial<List14Params> = { ...toConsultationListParams(filter) }
  delete params.page
  delete params.size
  return params
}

export function toBulkRequest(rows: CorporateConsultation[]): BulkRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}

export function toStatusUpdateRequest(
  row: CorporateConsultation,
  status: ConsultationStatus,
): StatusUpdateRequest {
  return {
    status: toApiStatus(status),
    version: row.version,
  }
}
