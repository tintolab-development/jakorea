import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import {
  mapDisclosureResponseToDomain,
  mapReportResponseToDomain,
  toApiReportType,
  toDisclosureUpdateRequest,
  toReportBulkDeleteRequest,
  toReportCreateRequest,
  toReportsListParams,
  toReportUpdateRequest,
} from './mappers'
import {
  fetchAllAdminListPages,
  toAdminListPage,
  type AdminListPage,
} from '@/shared/lib/admin-infinite-list'
import { uploadReportPdfAsset, uploadReportThumbnailAsset } from './upload-report-assets'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function listRemoteReportsPage(
  kind: ReportKind,
  filter: ReportListFilter,
  page: number,
): Promise<AdminListPage<TransparencyReport>> {
  const response = await jaKoreaApi().reports(
    toApiReportType(kind),
    toReportsListParams(filter, page),
  )
  return toAdminListPage(
    (response.items ?? []).map(mapReportResponseToDomain),
    page,
    response,
  )
}

async function resolveThumbnailAssetId(input: ReportCreateInput): Promise<number> {
  if (input.thumbnailFile) {
    return uploadReportThumbnailAsset(input.thumbnailFile)
  }
  if (input.thumbnailAssetId != null) {
    return input.thumbnailAssetId
  }
  throw new Error('썸네일 이미지를 등록해 주세요.')
}

async function resolveAttachmentAssetId(input: ReportCreateInput): Promise<number> {
  if (input.attachmentFile) {
    return uploadReportPdfAsset(input.attachmentFile)
  }
  if (input.attachmentAssetId != null) {
    return input.attachmentAssetId
  }
  throw new Error('첨부파일을 등록해 주세요.')
}

export async function listReportsPageService(
  kind: ReportKind,
  filter: ReportListFilter,
  page: number,
): Promise<AdminListPage<TransparencyReport>> {
  return listRemoteReportsPage(kind, filter, page)
}

export async function createReportService(
  kind: ReportKind,
  input: ReportCreateInput,
): Promise<TransparencyReport> {
  const thumbnailAssetId = await resolveThumbnailAssetId(input)
  const attachmentAssetId = await resolveAttachmentAssetId(input)
  const created = await jaKoreaApi().createReport(
    toApiReportType(kind),
    toReportCreateRequest(input, thumbnailAssetId, attachmentAssetId),
  )
  return mapReportResponseToDomain(created)
}

export async function updateReportService(
  kind: ReportKind,
  input: ReportUpdateInput,
  cachedRows?: TransparencyReport[],
): Promise<TransparencyReport> {
  const current =
    cachedRows?.find(row => row.id === input.id) ??
    (
      await fetchAllAdminListPages(page => listRemoteReportsPage(kind, {}, page))
    ).find(row => row.id === input.id)
  if (!current) {
    throw new Error(`Report not found: ${input.id}`)
  }
  const thumbnailAssetId = await resolveThumbnailAssetId({
    ...input,
    thumbnailAssetId: input.thumbnailAssetId ?? current.thumbnailAssetId,
  })
  const attachmentAssetId = await resolveAttachmentAssetId({
    ...input,
    attachmentAssetId: input.attachmentAssetId ?? current.attachmentAssetId,
  })
  const updated = await jaKoreaApi().updateReport(
    toApiReportType(kind),
    Number(input.id),
    toReportUpdateRequest(input, current, thumbnailAssetId, attachmentAssetId),
  )
  return mapReportResponseToDomain(updated)
}

export async function removeReportsService(
  kind: ReportKind,
  ids: string[],
  cachedRows?: TransparencyReport[],
): Promise<void> {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  let targets = (cachedRows ?? []).filter(row => idSet.has(row.id))
  if (targets.length === 0) {
    const rows = await fetchAllAdminListPages(page => listRemoteReportsPage(kind, {}, page))
    targets = rows.filter(row => idSet.has(row.id))
  }
  if (targets.length === 0) return
  await jaKoreaApi().deleteReports(toApiReportType(kind), toReportBulkDeleteRequest(targets))
}

export async function getNtsDisclosureService(): Promise<NtsDisclosure> {
  const response = await jaKoreaApi().disclosure()
  return mapDisclosureResponseToDomain(response)
}

export async function saveNtsDisclosureService(
  linkUrl: string,
  cached?: NtsDisclosure,
): Promise<NtsDisclosure> {
  const current = cached ?? (await getNtsDisclosureService())
  const updated = await jaKoreaApi().updateDisclosure(
    toDisclosureUpdateRequest(linkUrl, current.version),
  )
  return mapDisclosureResponseToDomain(updated)
}
