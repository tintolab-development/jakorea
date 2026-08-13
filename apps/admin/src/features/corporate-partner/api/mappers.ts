/**
 * 후원사 — OpenAPI ↔ 도메인 매핑
 */

import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import type { BulkDeleteRequest } from '@/shared/api/generated/sponsorship/schemas/bulkDeleteRequest'
import type { List2Params } from '@/shared/api/generated/sponsorship/schemas/list2Params'
import type { PublishedToggleRequest } from '@/shared/api/generated/sponsorship/schemas/publishedToggleRequest'
import type { SponsorCreateRequest } from '@/shared/api/generated/sponsorship/schemas/sponsorCreateRequest'
import type { SponsorListItem } from '@/shared/api/generated/sponsorship/schemas/sponsorListItem'
import type { SponsorResponse } from '@/shared/api/generated/sponsorship/schemas/sponsorResponse'
import type { SponsorUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/sponsorUpdateRequest'

export const LIST_PAGE_SIZE = 20

export function mapSponsorListItemToDomain(row: SponsorListItem): CorporatePartner {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isPublic: Boolean(row.published),
    logoUrl: row.logoUrl ?? '',
    name: row.companyName ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.createdAt ?? '',
    version: row.version ?? 0,
  }
}

export function mapSponsorResponseToDomain(row: SponsorResponse): CorporatePartner {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isPublic: Boolean(row.published),
    logoUrl: row.logo?.publicUrl ?? '',
    logoFileName: row.logo?.originalName,
    logoAssetId: row.logo?.assetId,
    name: row.companyName ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? row.createdAt ?? '',
    version: row.version ?? 0,
  }
}

/**
 * FE filter → OpenAPI `list2` query
 * - isPublic → published
 * - name → companyName
 * - registeredFrom/To → createdFrom/To (YYYY-MM-DD)
 */
export function toSponsorListParams(filter?: CorporatePartnerListFilter): List2Params {
  const params: List2Params = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  if (!filter) return params

  if (filter.isPublic === true || filter.isPublic === false) {
    params.published = filter.isPublic
  }

  const companyName = filter.name?.trim()
  if (companyName) params.companyName = companyName

  const createdFrom = filter.registeredFrom?.trim()
  if (createdFrom) params.createdFrom = createdFrom

  const createdTo = filter.registeredTo?.trim()
  if (createdTo) params.createdTo = createdTo

  return params
}

export function toSponsorCreateRequest(
  input: CorporatePartnerCreateInput,
  logoAssetId: number,
): SponsorCreateRequest {
  return {
    published: input.isPublic,
    logoAssetId,
    companyName: input.name.trim(),
    displayOrder: input.sortOrder,
  }
}

export function toSponsorUpdateRequest(
  current: CorporatePartner,
  patch: CorporatePartnerUpdateInput,
  logoAssetId: number,
): SponsorUpdateRequest {
  const next = {
    isPublic: patch.isPublic ?? current.isPublic,
    name: patch.name !== undefined ? patch.name.trim() : current.name,
    sortOrder: patch.sortOrder ?? current.sortOrder,
  }
  return {
    published: next.isPublic,
    logoAssetId,
    companyName: next.name,
    displayOrder: next.sortOrder,
    version: current.version,
  }
}

export function toPublishedToggleRequest(
  row: CorporatePartner,
  published: boolean,
): PublishedToggleRequest {
  return { published, version: row.version }
}

export function toBulkDeleteRequest(rows: CorporatePartner[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}
