import { mapUploadToDisplayRow } from '@/features/program/gemini/lib/performance/map-upload-to-display-row'
import { parseUploadExcel } from '@/features/program/gemini/lib/performance/parse-upload-excel'
import {
  findDuplicateKeys,
  getGeminiPerformanceRowsSnapshot,
} from '@/features/program/gemini/model/performance/performance-store'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import {
  mapGeminiTrainingReportItemToRow,
  mapUploadAndDisplayToImportRow,
} from './adapters'
import { shouldUseGeminiPerformanceRemoteApi } from './capabilities'
import {
  fetchGeminiTrainingReportsRemote,
  importGeminiTrainingReportsRemote,
  previewGeminiTrainingReportImportRemote,
} from './client'

function assertRemoteReady(): void {
  if (shouldUseGeminiPerformanceRemoteApi()) return
  throw new Error(
    'Gemini 실적 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 geminiPerformance를 추가해 주세요.'
  )
}

export type GeminiPerformanceRemoteImportPrepareResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
  remoteImportRows: GeminiTrainingReportImportRow[]
  uploadRows: GeminiPerformanceUploadRow[]
}

export async function listGeminiPerformanceRows(): Promise<GeminiPerformanceRow[]> {
  if (!shouldUseGeminiPerformanceRemoteApi()) {
    return getGeminiPerformanceRowsSnapshot()
  }
  assertRemoteReady()
  const items = await fetchGeminiTrainingReportsRemote({ page: 0, size: 500 })
  return items.map((item, index) => mapGeminiTrainingReportItemToRow(item, index))
}

export async function prepareGeminiPerformanceImportRemote(
  file: File
): Promise<GeminiPerformanceRemoteImportPrepareResult> {
  assertRemoteReady()
  const uploadRows = await parseUploadExcel(file)
  const importedRows = await Promise.all(uploadRows.map(row => mapUploadToDisplayRow(row)))
  const remoteImportRows = uploadRows.map((upload, index) =>
    mapUploadAndDisplayToImportRow(upload, importedRows[index]!)
  )

  const preview = await previewGeminiTrainingReportImportRemote({
    rows: remoteImportRows,
  })
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

  return { importedRows, duplicateKeys, remoteImportRows, uploadRows }
}

export async function applyGeminiPerformanceImportRemote(
  remoteImportRows: GeminiTrainingReportImportRow[],
  strategy: GeminiPerformanceImportDuplicateStrategy
): Promise<void> {
  assertRemoteReady()
  await importGeminiTrainingReportsRemote({
    rows: remoteImportRows,
    duplicateStrategy: strategy,
  })
}
