import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { createReportNoThumbnailFile } from '@/shared/lib/no-thumbnail-placeholder'
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

/**
 * 썸네일은 선택 항목 — 새 파일은 업로드, 기존 자산은 그대로.
 * 썸네일이 없으면 서버가 아직 필수라 「썸네일 없음」 표식을 대신 보낸다
 * (같은 보고서가 쓰던 표식이 있으면 재사용 — 보고서끼리는 썸네일 자산을 공유할 수 없다).
 */
async function resolveThumbnailAssetId(
  input: ReportCreateInput,
  placeholderAssetId?: number,
): Promise<number> {
  if (input.thumbnailFile) {
    return uploadReportThumbnailAsset(input.thumbnailFile)
  }
  if (input.thumbnailAssetId != null) {
    return input.thumbnailAssetId
  }
  if (placeholderAssetId != null) {
    return placeholderAssetId
  }
  return uploadReportThumbnailAsset(createReportNoThumbnailFile())
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
  // 수정 화면에서 썸네일을 지우면 `null`이 넘어온다 — 기존 썸네일로 되돌리지 않는다
  const thumbnailAssetId = await resolveThumbnailAssetId(
    {
      ...input,
      thumbnailAssetId:
        input.thumbnailAssetId === null ? null : (input.thumbnailAssetId ?? current.thumbnailAssetId),
    },
    current.placeholderThumbnailAssetId,
  )
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
