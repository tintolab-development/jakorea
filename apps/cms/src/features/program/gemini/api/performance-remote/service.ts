import { mapUploadToDisplayRow } from '@/features/program/gemini/lib/performance/map-upload-to-display-row'
import { parseUploadExcel } from '@/features/program/gemini/lib/performance/parse-upload-excel'
import {
  findDuplicateKeys,
} from '@/features/program/gemini/model/performance/performance-store'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import { fetchGeminiRecruitmentsRemotePage } from '@/features/program/gemini/api/visiting-training/client'
import { formatGeminiImportPreviewFailures } from '@/features/program/gemini/lib/performance/import-preview-failure'
import {
  hasPaidBlockedImportFailures,
  hasPaidDuplicateImportResults,
} from '@/features/program/gemini/lib/performance/import-paid-duplicate'
import { GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE } from '@/features/program/gemini/lib/performance/import-popup-copy'
import { pickGeminiImportProgramId } from '@/features/program/gemini/lib/performance/pick-import-program-id'
import {
  mapGeminiTrainingReportItemToRow,
  mapUploadAndDisplayToImportRow,
} from './adapters'
import { shouldUseGeminiPerformanceRemoteApi } from './capabilities'
import {
  bulkDeleteGeminiTrainingReportsRemote,
  deleteGeminiTrainingReportRemote,
  fetchGeminiTrainingReportsRemotePage,
  GEMINI_PERFORMANCE_LIST_PAGE_SIZE,
  importGeminiTrainingReportsRemote,
  previewGeminiTrainingReportImportRemote,
  type GeminiTrainingReportsRemotePage,
} from './client'

function assertRemoteReady(): void {
  if (shouldUseGeminiPerformanceRemoteApi()) return
  throw new Error(
    'Gemini 실적 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export type GeminiPerformanceRemoteListPage = {
  rows: GeminiPerformanceRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export type GeminiPerformanceRemoteImportPrepareResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
  remoteImportRows: GeminiTrainingReportImportRow[]
  uploadRows: GeminiPerformanceUploadRow[]
  paidDuplicate?: boolean
}

export async function listGeminiPerformanceRowsPage(
  pageParam = 0
): Promise<GeminiPerformanceRemoteListPage> {
  assertRemoteReady()
  const page: GeminiTrainingReportsRemotePage = await fetchGeminiTrainingReportsRemotePage({
    page: pageParam,
    size: GEMINI_PERFORMANCE_LIST_PAGE_SIZE,
  })
  const baseNo = pageParam * page.size
  return {
    rows: page.items.map((item, index) =>
      mapGeminiTrainingReportItemToRow(item, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

/** @deprecated 무한 스크롤은 `listGeminiPerformanceRowsPage` 사용 */
export async function listGeminiPerformanceRows(): Promise<GeminiPerformanceRow[]> {
  const page = await listGeminiPerformanceRowsPage(0)
  return page.rows
}

export async function prepareGeminiPerformanceImportRemote(
  file: File
): Promise<GeminiPerformanceRemoteImportPrepareResult> {
  assertRemoteReady()
  const uploadRows = await parseUploadExcel(file)
  const importedRows = await Promise.all(uploadRows.map(row => mapUploadToDisplayRow(row)))
  const recruitments = await fetchGeminiRecruitmentsRemotePage({}, 0, 100)
  const programId = pickGeminiImportProgramId(recruitments.items)
  const remoteImportRows = uploadRows.map((upload, index) => ({
    ...mapUploadAndDisplayToImportRow(upload, importedRows[index]!),
    ...(programId != null ? { programId } : {}),
  }))

  const preview = await previewGeminiTrainingReportImportRemote({
    rows: remoteImportRows,
  })
  const paidDuplicate = hasPaidDuplicateImportResults(preview.results)
  const paidFailed = hasPaidBlockedImportFailures(preview.results)
  const previewFailure = formatGeminiImportPreviewFailures(preview.results)
  if (paidFailed && !paidDuplicate) {
    throw new Error(GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE)
  }
  if (previewFailure && !paidDuplicate) {
    throw new Error(previewFailure)
  }
  const remoteDuplicateIndexes = new Set(
    (preview.results ?? [])
      .filter(result => result.duplicate === true)
      .map(result => (result.rowNumber != null ? result.rowNumber - 1 : -1))
      .filter(index => index >= 0)
  )

  const duplicateKeys =
    remoteDuplicateIndexes.size > 0
      ? importedRows
          .filter((_, index) => remoteDuplicateIndexes.has(index))
          .map(row => row.duplicateKey)
      : findDuplicateKeys(importedRows)

  return { importedRows, duplicateKeys, remoteImportRows, uploadRows, paidDuplicate }
}

export async function applyGeminiPerformanceImportRemote(
  remoteImportRows: GeminiTrainingReportImportRow[],
  strategy: GeminiPerformanceImportDuplicateStrategy
): Promise<void> {
  assertRemoteReady()
  const response = await importGeminiTrainingReportsRemote({
    rows: remoteImportRows,
    duplicateStrategy: strategy,
  })
  if (hasPaidBlockedImportFailures(response.results)) {
    throw new Error(GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE)
  }
  const previewFailure = formatGeminiImportPreviewFailures(response.results)
  if (previewFailure) {
    throw new Error(previewFailure)
  }
  if ((response.failedRows ?? 0) > 0) {
    throw new Error(
      '연수 보고서를 등록하지 못했습니다.\n잠시 후 다시 시도해 주세요.'
    )
  }
}

export async function deleteGeminiPerformanceRowsRemote(ids: string[]): Promise<void> {
  assertRemoteReady()
  const numericIds = ids
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0)
  if (numericIds.length === 0) {
    throw new Error('삭제할 실적이 없습니다.')
  }
  if (numericIds.length === 1) {
    await deleteGeminiTrainingReportRemote(numericIds[0]!)
    return
  }
  await bulkDeleteGeminiTrainingReportsRemote(numericIds)
}
