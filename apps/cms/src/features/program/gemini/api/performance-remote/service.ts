import { mapUploadToDisplayRow } from '@/features/program/gemini/lib/performance/map-upload-to-display-row'
import { parseUploadExcel } from '@/features/program/gemini/lib/performance/parse-upload-excel'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import { fetchGeminiRecruitmentsRemotePage } from '@/features/program/gemini/api/visiting-training/client'
import {
  formatGeminiImportPaymentExclusionNotes,
  createGeminiImportPreviewFailureError,
} from '@/features/program/gemini/lib/performance/import-preview-failure'
import { findGeminiDuplicateRowIndexes } from '@/features/program/gemini/lib/performance/import-result-duplicates'
import { getGeminiPerformancePaidBlockedResultMessage } from '@/features/program/gemini/lib/performance/import-paid-duplicate'
import { pickGeminiImportProgramId } from '@/features/program/gemini/lib/performance/pick-import-program-id'
import { mapGeminiTrainingReportItemToRow, mapUploadAndDisplayToImportRow } from './adapters'
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
  /** SUCCESS + paymentExclusionReason 안내 (실패가 아님) */
  paymentExclusionNotes?: string
}

export type GeminiPerformanceListFilters = {
  instructorName?: string
  trainingLocation?: string
}

export async function listGeminiPerformanceRowsPage(
  pageParam = 0,
  filters: GeminiPerformanceListFilters = {}
): Promise<GeminiPerformanceRemoteListPage> {
  assertRemoteReady()
  const page: GeminiTrainingReportsRemotePage = await fetchGeminiTrainingReportsRemotePage({
    page: pageParam,
    size: GEMINI_PERFORMANCE_LIST_PAGE_SIZE,
    instructorName: filters.instructorName,
    trainingLocation: filters.trainingLocation,
  })
  const baseNo = pageParam * page.size
  return {
    rows: page.items.map((item, index) => mapGeminiTrainingReportItemToRow(item, baseNo + index)),
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
  // 지급조서 확인/계좌 지급 보호 중복은 BE 결과 코드만 SSOT로 사용한다.
  const paidBlockedMessage = getGeminiPerformancePaidBlockedResultMessage(preview.results)
  if (paidBlockedMessage) {
    throw new Error(paidBlockedMessage)
  }
  const previewFailure = createGeminiImportPreviewFailureError(preview.results)
  if (previewFailure) throw previewFailure

  const previewResults = preview.results ?? []

  const remoteDuplicateIndexes = new Set(
    findGeminiDuplicateRowIndexes(previewResults, importedRows.length)
  )
  const fromPreview = importedRows
    .filter((_, index) => remoteDuplicateIndexes.has(index))
    .map(row => row.duplicateKey)
  const duplicateKeys = [...new Set(fromPreview)]

  return {
    importedRows,
    duplicateKeys,
    remoteImportRows,
    uploadRows,
    paidDuplicate: false,
    paymentExclusionNotes: formatGeminiImportPaymentExclusionNotes(preview.results),
  }
}

export async function applyGeminiPerformanceImportRemote(
  remoteImportRows: GeminiTrainingReportImportRow[],
  strategy: GeminiPerformanceImportDuplicateStrategy
): Promise<{ paymentExclusionNotes?: string }> {
  assertRemoteReady()
  const response = await importGeminiTrainingReportsRemote({
    rows: remoteImportRows,
    duplicateStrategy: strategy,
  })
  // append|overwrite 무관 — BE가 보호 중복을 FAILED·미커밋하면 성공 처리하지 않음
  const paidBlockedMessage = getGeminiPerformancePaidBlockedResultMessage(response.results)
  if (paidBlockedMessage) {
    throw new Error(paidBlockedMessage)
  }
  const previewFailure = createGeminiImportPreviewFailureError(response.results)
  if (previewFailure) throw previewFailure
  if ((response.failedRows ?? 0) > 0) {
    throw new Error('연수 보고서를 등록하지 못했습니다.\n잠시 후 다시 시도해 주세요.')
  }
  return {
    paymentExclusionNotes: formatGeminiImportPaymentExclusionNotes(response.results),
  }
}

export async function deleteGeminiPerformanceRowsRemote(ids: string[]): Promise<void> {
  assertRemoteReady()
  const numericIds = ids.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
  if (numericIds.length === 0) {
    throw new Error('삭제할 실적이 없습니다.')
  }
  if (numericIds.length === 1) {
    await deleteGeminiTrainingReportRemote(numericIds[0]!)
    return
  }
  await bulkDeleteGeminiTrainingReportsRemote(numericIds)
}
