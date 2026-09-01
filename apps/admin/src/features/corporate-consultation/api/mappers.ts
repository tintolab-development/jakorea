/**
 * 기업 후원 상담 — OpenAPI ↔ 도메인 매핑
 */

import type {
  ConsultationStatus,
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import type { BulkRequest } from '@/shared/api/generated/sponsorship/schemas/bulkRequest'
import type { ConsultationDetailResponse } from '@/shared/api/generated/sponsorship/schemas/consultationDetailResponse'
import type { ConsultationListItem } from '@/shared/api/generated/sponsorship/schemas/consultationListItem'
import type { List12Params } from '@/shared/api/generated/sponsorship/schemas/list12Params'
import type { StatusUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/statusUpdateRequest'
import { StatusUpdateRequestStatus } from '@/shared/api/generated/sponsorship/schemas/statusUpdateRequestStatus'

export const LIST_PAGE_SIZE = 20

function toDomainStatus(status: string | undefined): ConsultationStatus {
  return status === 'CONFIRMED' ? 'confirmed' : 'pending'
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
    attachmentFileName: row.attachmentOriginalName?.trim()
      ? row.attachmentOriginalName.trim()
      : null,
    attachmentUrl: null,
    appliedAt: row.createdAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    confirmedByName: row.confirmedByName?.trim() ? row.confirmedByName.trim() : null,
    version: row.version ?? 0,
  }
}

export function toConsultationListParams(
  filter: CorporateConsultationListFilter = {},
): List12Params {
  const params: List12Params = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }

  if (filter.status === 'pending') params.status = 'PENDING'
  if (filter.status === 'confirmed') params.status = 'CONFIRMED'

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
