import type { OrganizationChartInfo } from '@/entities/organization-chart/model/types'
import type { OrgChartResponse } from '@/shared/api/generated/ja-korea/schemas/orgChartResponse'
import type { OrgChartUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/orgChartUpdateRequest'

export function mapOrgChartResponseToDomain(row: OrgChartResponse): OrganizationChartInfo {
  const image = row.organizationChartImage
  return {
    mainTitle: row.title ?? '',
    imageUrl: image?.publicUrl ?? '',
    imageFileName: image?.originalName,
    imageAssetId: image?.assetId,
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toOrgChartUpdateRequest(
  data: OrganizationChartInfo,
  organizationChartAssetId: number | undefined,
): OrgChartUpdateRequest {
  return {
    title: data.mainTitle.trim() || undefined,
    organizationChartAssetId,
    version: data.version,
  }
}
