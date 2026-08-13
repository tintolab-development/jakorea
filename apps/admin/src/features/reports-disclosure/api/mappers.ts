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
import type { ReportsParams } from '@/shared/api/generated/ja-korea/schemas/reportsParams'

export function toApiReportType(kind: ReportKind): 'ANNUAL' | 'AUDIT' {
  return kind === 'annual' ? 'ANNUAL' : 'AUDIT'
}

export function toFeReportKind(type: string | undefined): ReportKind {
  return type === 'AUDIT' ? 'audit' : 'annual'
}

export function mapReportResponseToDomain(row: ReportResponse): TransparencyReport {
  const kind = toFeReportKind(row.reportType)
  return {
    id: row.id != null ? String(row.id) : '',
    kind,
    title: row.title ?? '',
    thumbnailUrl: row.thumbnail?.publicUrl ?? '',
    thumbnailFileName: row.thumbnail?.originalName ?? '',
    attachmentFileName: row.attachmentFileName ?? row.attachment?.originalName ?? '',
    attachmentUrl: row.attachment?.publicUrl ?? '',
    thumbnailAssetId: row.thumbnail?.assetId,
    attachmentAssetId: row.attachment?.assetId,
    version: row.version ?? 0,
    downloadCount: row.downloadCount ?? 0,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

export function toReportsListParams(filter: ReportListFilter): ReportsParams {
  return {
    title: filter.title?.trim() || undefined,
    attachmentFileName: filter.attachmentName?.trim() || undefined,
    createdFrom: filter.createdFrom || undefined,
    createdTo: filter.createdTo || undefined,
    page: 0,
    size: 100,
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
