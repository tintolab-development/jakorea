import type {
  AwardCreateInput,
  AwardItem,
  AwardListFilter,
  CertCreateInput,
  CertItem,
  CertListFilter,
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
} from '@/entities/history-awards-certs/model/types'
import type { AwardCreateRequest } from '@/shared/api/generated/ja-korea/schemas/awardCreateRequest'
import type { AwardResponse } from '@/shared/api/generated/ja-korea/schemas/awardResponse'
import type { AwardUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/awardUpdateRequest'
import type { AwardsParams } from '@/shared/api/generated/ja-korea/schemas/awardsParams'
import type { BulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/bulkDeleteRequest'
import type { CertificationCreateRequest } from '@/shared/api/generated/ja-korea/schemas/certificationCreateRequest'
import type { CertificationResponse } from '@/shared/api/generated/ja-korea/schemas/certificationResponse'
import type { CertificationUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/certificationUpdateRequest'
import type { CertificationsParams } from '@/shared/api/generated/ja-korea/schemas/certificationsParams'
import type { HistoryCreateRequest } from '@/shared/api/generated/ja-korea/schemas/historyCreateRequest'
import type { HistoryParams } from '@/shared/api/generated/ja-korea/schemas/historyParams'
import type { HistoryResponse } from '@/shared/api/generated/ja-korea/schemas/historyResponse'
import type { HistoryUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/historyUpdateRequest'
import type { PublishedToggleRequest } from '@/shared/api/generated/ja-korea/schemas/publishedToggleRequest'
import type { ToggleRequest } from '@/shared/api/generated/ja-korea/schemas/toggleRequest'

const LIST_PAGE_SIZE = 20

export function mapHistoryResponseToDomain(row: HistoryResponse): HistoryItem {
  return {
    id: row.id != null ? String(row.id) : '',
    isPublic: Boolean(row.published),
    year: row.year ?? 0,
    month: row.month ?? 0,
    content: row.content ?? '',
    createdAt: row.createdAt ?? '',
    version: row.version ?? 0,
  }
}

export function mapAwardResponseToDomain(row: AwardResponse): AwardItem {
  return {
    id: row.id != null ? String(row.id) : '',
    isPublic: Boolean(row.published),
    title: row.awardName ?? '',
    organization: row.awardingInstitution ?? '',
    awardedOn: row.awardedDate ?? '',
    createdAt: row.createdAt ?? '',
    version: row.version ?? 0,
  }
}

export function mapCertResponseToDomain(row: CertificationResponse): CertItem {
  return {
    id: row.id != null ? String(row.id) : '',
    isPublic: Boolean(row.published),
    content: row.content ?? '',
    organization: row.certificationInstitution ?? '',
    certifiedOn: row.certifiedDate ?? '',
    createdAt: row.createdAt ?? '',
    version: row.version ?? 0,
  }
}

export function toHistoryListParams(filter?: HistoryListFilter): HistoryParams {
  const params: HistoryParams = { page: 0, size: LIST_PAGE_SIZE }
  if (!filter) return params
  if (filter.isPublic === true || filter.isPublic === false) params.published = filter.isPublic
  if (filter.year != null) params.year = filter.year
  if (filter.month != null) params.month = filter.month
  if (filter.content?.trim()) params.keyword = filter.content.trim()
  if (filter.createdFrom) params.createdFrom = filter.createdFrom
  if (filter.createdTo) params.createdTo = filter.createdTo
  if (filter.sort === 'created') params.sort = 'CREATED_AT'
  else if (filter.sort === 'event') params.sort = 'DATE'
  return params
}

export function toAwardListParams(filter?: AwardListFilter): AwardsParams {
  const params: AwardsParams = { page: 0, size: LIST_PAGE_SIZE }
  if (!filter) return params
  if (filter.isPublic === true || filter.isPublic === false) params.published = filter.isPublic
  if (filter.title?.trim()) params.awardName = filter.title.trim()
  if (filter.organization?.trim()) params.institution = filter.organization.trim()
  if (filter.awardedFrom) params.awardedFrom = filter.awardedFrom
  if (filter.awardedTo) params.awardedTo = filter.awardedTo
  if (filter.createdFrom) params.createdFrom = filter.createdFrom
  if (filter.createdTo) params.createdTo = filter.createdTo
  if (filter.sort === 'created') params.sort = 'CREATED_AT'
  else if (filter.sort === 'date') params.sort = 'DATE'
  return params
}

export function toCertListParams(filter?: CertListFilter): CertificationsParams {
  const params: CertificationsParams = { page: 0, size: LIST_PAGE_SIZE }
  if (!filter) return params
  if (filter.isPublic === true || filter.isPublic === false) params.published = filter.isPublic
  if (filter.content?.trim()) params.content = filter.content.trim()
  if (filter.organization?.trim()) params.institution = filter.organization.trim()
  if (filter.certifiedFrom) params.certifiedFrom = filter.certifiedFrom
  if (filter.certifiedTo) params.certifiedTo = filter.certifiedTo
  if (filter.createdFrom) params.createdFrom = filter.createdFrom
  if (filter.createdTo) params.createdTo = filter.createdTo
  if (filter.sort === 'created') params.sort = 'CREATED_AT'
  else if (filter.sort === 'date') params.sort = 'DATE'
  return params
}

export function toHistoryCreateRequest(input: HistoryCreateInput): HistoryCreateRequest {
  return {
    year: input.year,
    month: input.month,
    content: input.content.trim(),
  }
}

export function toHistoryUpdateRequest(
  input: HistoryCreateInput,
  version: number,
): HistoryUpdateRequest {
  return {
    year: input.year,
    month: input.month,
    content: input.content.trim(),
    version,
  }
}

export function toAwardCreateRequest(input: AwardCreateInput): AwardCreateRequest {
  return {
    awardedDate: input.awardedOn,
    awardName: input.title.trim(),
    awardingInstitution: input.organization.trim(),
  }
}

export function toAwardUpdateRequest(
  input: AwardCreateInput,
  version: number,
): AwardUpdateRequest {
  return {
    awardedDate: input.awardedOn,
    awardName: input.title.trim(),
    awardingInstitution: input.organization.trim(),
    version,
  }
}

export function toCertCreateRequest(input: CertCreateInput): CertificationCreateRequest {
  return {
    certifiedDate: input.certifiedOn,
    content: input.content.trim(),
    certificationInstitution: input.organization.trim(),
  }
}

export function toCertUpdateRequest(
  input: CertCreateInput,
  version: number,
): CertificationUpdateRequest {
  return {
    certifiedDate: input.certifiedOn,
    content: input.content.trim(),
    certificationInstitution: input.organization.trim(),
    version,
  }
}

/**
 * BE JaKoreaDtos.ToggleRequest는 `published` 필드.
 * Orval ToggleRequest는 `enabled`로 생성되어 있어 PublishedToggleRequest로 전송한다.
 */
export function toPublishedToggleRequest(
  published: boolean,
  version: number,
): ToggleRequest {
  const body: PublishedToggleRequest = { published, version }
  return body as unknown as ToggleRequest
}

export function toBulkDeleteRequest(
  rows: Array<{ id: string; version: number }>,
): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}
