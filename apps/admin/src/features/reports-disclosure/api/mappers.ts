import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import type { BulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/bulkDeleteRequest'
import type { DisclosureResponse } from '@/shared/api/generated/ja-korea/schemas/disclosureResponse'
import type { DisclosureUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/disclosureUpdateRequest'
import type { ReportCreateRequest } from '@/shared/api/generated/ja-korea/schemas/reportCreateRequest'
import type { ReportResponse } from '@/shared/api/generated/ja-korea/schemas/reportResponse'
import type { ReportUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/reportUpdateRequest'
import { isNoThumbnailPlaceholder } from '@/shared/lib/no-thumbnail-placeholder'
import type { ReportsParams } from '@/shared/api/generated/ja-korea/schemas/reportsParams'

export function toApiReportType(kind: ReportKind): 'ANNUAL' | 'AUDIT' {
  return kind === 'annual' ? 'ANNUAL' : 'AUDIT'
}

export function toFeReportKind(type: string | undefined): ReportKind {
  return type === 'AUDIT' ? 'audit' : 'annual'
}

export function mapReportResponseToDomain(row: ReportResponse): TransparencyReport {
  const kind = toFeReportKind(row.reportType)
  // 서버 필수 우회로 올린 「썸네일 없음」 표식은 화면에서 썸네일 없음으로 보인다
  const placeholderThumb = isNoThumbnailPlaceholder(row.thumbnail?.originalName)
  return {
    id: row.id != null ? String(row.id) : '',
    kind,
    title: row.title ?? '',
    thumbnailUrl: placeholderThumb ? '' : (row.thumbnail?.publicUrl ?? ''),
    thumbnailFileName: placeholderThumb ? '' : (row.thumbnail?.originalName ?? ''),
    attachmentFileName: row.attachmentFileName ?? row.attachment?.originalName ?? '',
    attachmentUrl: row.attachment?.publicUrl ?? '',
    thumbnailAssetId: placeholderThumb ? undefined : row.thumbnail?.assetId,
    placeholderThumbnailAssetId: placeholderThumb ? row.thumbnail?.assetId : undefined,
    attachmentAssetId: row.attachment?.assetId,
    version: row.version ?? 0,
    downloadCount: row.downloadCount ?? 0,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

export function toReportsListParams(
  filter: ReportListFilter,
  page = 0,
  size = 20
): ReportsParams {
  return {
    title: filter.title?.trim() || undefined,
    attachmentFileName: filter.attachmentName?.trim() || undefined,
    createdFrom: filter.createdFrom || undefined,
    createdTo: filter.createdTo || undefined,
    page,
    size,
  }
}

export function toReportCreateRequest(
  input: ReportCreateInput,
  thumbnailAssetId: number,
  attachmentAssetId: number,
): ReportCreateRequest {
  return {
    title: input.title.trim(),
    thumbnailAssetId,
    attachmentAssetId,
  }
}

export function toReportUpdateRequest(
  input: ReportUpdateInput,
  current: TransparencyReport,
  thumbnailAssetId: number,
  attachmentAssetId: number,
): ReportUpdateRequest {
  return {
    title: input.title.trim(),
    thumbnailAssetId,
    attachmentAssetId,
    version: current.version,
  }
}

export function toReportBulkDeleteRequest(rows: TransparencyReport[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}

export function mapDisclosureResponseToDomain(row: DisclosureResponse): NtsDisclosure {
  return {
    linkUrl: row.disclosureUrl ?? '',
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toDisclosureUpdateRequest(
  linkUrl: string,
  version: number,
): DisclosureUpdateRequest {
  const trimmed = linkUrl.trim()
  return {
    disclosureUrl: trimmed.length > 0 ? trimmed : undefined,
    version,
  }
}
