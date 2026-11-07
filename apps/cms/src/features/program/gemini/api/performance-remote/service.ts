import { mapUploadToDisplayRow } from '@/features/program/gemini/lib/performance/map-upload-to-display-row'
import { parseUploadExcel } from '@/features/program/gemini/lib/performance/parse-upload-excel'
import { findWithinFileDuplicateKeys } from '@/features/program/gemini/model/performance/performance-store'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import type { GeminiTrainingReportItem } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItem'
import { fetchGeminiRecruitmentsRemotePage } from '@/features/program/gemini/api/visiting-training/client'
import {
  formatGeminiImportPaymentExclusionNotes,
  formatGeminiImportPreviewFailures,
} from '@/features/program/gemini/lib/performance/import-preview-failure'
import { findGeminiDuplicateRowIndexes } from '@/features/program/gemini/lib/performance/import-result-duplicates'
import {
  isGeminiPerformanceAccountPaid,
  isGeminiPerformancePaidRegisterBlocked,
} from '@/features/program/gemini/lib/performance/import-paid-duplicate'
import { GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE } from '@/features/program/gemini/lib/performance/import-popup-copy'
import { pickGeminiImportProgramId } from '@/features/program/gemini/lib/performance/pick-import-program-id'
import { buildGeminiPerformanceServerMatchKey } from '@/features/program/gemini/lib/performance/server-match-key'
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
    rows: page.items.map((item, index) =>
      mapGeminiTrainingReportItemToRow(item, baseNo + index)
    ),
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    hasMore: page.hasMore,
  }
}

const RELOAD_LIST_MAX_PAGES = 50

/** import·삭제 후 활성 목록 캐시를 서버 기준으로 다시 채운다(전체 페이지). */
export async function reloadGeminiPerformanceListCache(
  filters: GeminiPerformanceListFilters = {}
): Promise<GeminiPerformanceRemoteListPage[]> {
  assertRemoteReady()
  const pages: GeminiPerformanceRemoteListPage[] = []
  for (let pageParam = 0; pageParam < RELOAD_LIST_MAX_PAGES; pageParam += 1) {
    const page = await listGeminiPerformanceRowsPage(pageParam, filters)
    pages.push(page)
    if (!page.hasMore) break
  }
  return pages
}

async function fetchAllGeminiTrainingReportItems(): Promise<GeminiTrainingReportItem[]> {
  const items: GeminiTrainingReportItem[] = []
  for (let pageParam = 0; pageParam < RELOAD_LIST_MAX_PAGES; pageParam += 1) {
    const page = await fetchGeminiTrainingReportsRemotePage({
      page: pageParam,
      size: Math.max(GEMINI_PERFORMANCE_LIST_PAGE_SIZE, 100),
    })
    items.push(...page.items)
    if (!page.hasMore) break
  }
  return items
}

/**
 * BE preview.duplicate SSOT를 우선하고, 목록 대조는 방어적 보조.
 * 키: programId + instructorIdentity + trainingDate + trainingStartTime + location
 */
export function matchUploadRowsAgainstExistingReports(
  uploadRows: GeminiPerformanceUploadRow[],
  displayRows: GeminiPerformanceRow[],
  existing: GeminiTrainingReportItem[],
  programId?: number
): { unpaidDuplicateKeys: string[]; paidDuplicate: boolean } {
  const serverByKey = new Map<string, GeminiTrainingReportItem>()
  for (const item of existing) {
    const key = buildGeminiPerformanceServerMatchKey({
      programId: item.programId ?? programId,
      trainingDate: item.trainingDate,
      trainingLocation: item.trainingLocation,
      schoolOrOrganizationName: item.schoolOrOrganizationName,
      trainingStartTime: item.trainingStartTime,
      instructorMemberId: item.instructorMemberId,
      instructorName: item.instructorName,
      instructorPhone: null,
    })
    const parts = key.split('|')
    // programId|identity|date|start|location — date/start/location 없으면 스킵
    if (!parts[2] || !parts[3] || !parts[4]) continue
    const prev = serverByKey.get(key)
    if (!prev || isGeminiPerformanceAccountPaid(item.accountPaymentId)) {
      serverByKey.set(key, item)
    }
  }

  const unpaidDuplicateKeys: string[] = []
  let paidDuplicate = false
  uploadRows.forEach((upload, index) => {
    const display = displayRows[index]
    const key = buildGeminiPerformanceServerMatchKey({
      programId,
      trainingDate: display?.trainingDate || upload.trainingDate,
      trainingLocation: upload.trainingLocation,
      schoolOrOrganizationName: upload.school,
      trainingStartTime: upload.trainingStartTime,
      instructorMemberId: null,
      instructorName: upload.instructorName,
      instructorPhone: upload.contact,
    })
    const hit = serverByKey.get(key)
    if (!hit) return
    if (isGeminiPerformanceAccountPaid(hit.accountPaymentId)) {
      paidDuplicate = true
      return
    }
    if (display?.duplicateKey) unpaidDuplicateKeys.push(display.duplicateKey)
  })
  return { unpaidDuplicateKeys, paidDuplicate }
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
  // 지급완료 중복(BE preview 또는 목록 대조) — 덮어쓰기/데이터 추가 다이얼로그·import 금지
  if (isGeminiPerformancePaidRegisterBlocked(preview.results)) {
    throw new Error(GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE)
  }
  const previewFailure = formatGeminiImportPreviewFailures(preview.results)
  if (previewFailure) {
    throw new Error(previewFailure)
  }

  // 정상적인 preview 응답은 모든 업로드 행의 결과를 반환하므로 duplicate가 SSOT다.
  // 결과 배열이 누락·축약된 응답에서만 기존 목록 대조를 보조로 사용한다.
  const previewResults = preview.results ?? []
  const serverMatch =
    previewResults.length === remoteImportRows.length
      ? { unpaidDuplicateKeys: [], paidDuplicate: false }
      : matchUploadRowsAgainstExistingReports(
          uploadRows,
          importedRows,
          await fetchAllGeminiTrainingReportItems(),
          programId
        )
  if (serverMatch.paidDuplicate) {
    throw new Error(GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE)
  }

  const remoteDuplicateIndexes = new Set(
    findGeminiDuplicateRowIndexes(previewResults, importedRows.length)
  )
  const fromPreview = importedRows
    .filter((_, index) => remoteDuplicateIndexes.has(index))
    .map(row => row.duplicateKey)
  const fromWithinFile = findWithinFileDuplicateKeys(importedRows)
  const duplicateKeys = [
    ...new Set([...fromPreview, ...serverMatch.unpaidDuplicateKeys, ...fromWithinFile]),
  ]

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
  // append|overwrite 무관 — BE가 지급완료 중복을 FAILED·미커밋해도 FE는 성공 처리하지 않음
  if (isGeminiPerformancePaidRegisterBlocked(response.results)) {
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
  return {
    paymentExclusionNotes: formatGeminiImportPaymentExclusionNotes(response.results),
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
