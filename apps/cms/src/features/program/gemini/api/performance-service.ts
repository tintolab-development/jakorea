/**
 * Gemini 실적관리 서비스 — mock/localStorage 구현
 * TODO(api): GeminiTrainingReportImportRequest.duplicateStrategy 기반 백엔드 연동 시 교체
 */

import { mapUploadToDisplayRow } from '../lib/performance/map-upload-to-display-row'
import {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  parseUploadExcel,
} from '../lib/performance/parse-upload-excel'
import {
  deleteGeminiPerformanceRows,
  findDuplicateKeys,
  getGeminiPerformanceRowsSnapshot,
  importGeminiPerformanceRows,
  subscribeGeminiPerformanceRows,
} from '../model/performance/performance-store'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '../model/performance/types'

export type GeminiPerformanceImportResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
}

export const geminiPerformanceService = {
  subscribe: subscribeGeminiPerformanceRows,
  getSnapshot: getGeminiPerformanceRowsSnapshot,

  async parseExcelFile(file: File): Promise<GeminiPerformanceUploadRow[]> {
    return parseUploadExcel(file)
  },

  async mapUploadRows(uploadRows: GeminiPerformanceUploadRow[]): Promise<GeminiPerformanceRow[]> {
    return Promise.all(uploadRows.map(row => mapUploadToDisplayRow(row)))
  },

  async prepareImport(file: File): Promise<GeminiPerformanceImportResult> {
    const uploadRows = await parseUploadExcel(file)
    const importedRows = await Promise.all(uploadRows.map(row => mapUploadToDisplayRow(row)))
    const duplicateKeys = findDuplicateKeys(importedRows)
    return { importedRows, duplicateKeys }
  },

  applyImport(
    importedRows: GeminiPerformanceRow[],
    strategy: GeminiPerformanceImportDuplicateStrategy
  ): void {
    importGeminiPerformanceRows(importedRows, strategy)
  },

  delete(ids: string[]): void {
    deleteGeminiPerformanceRows(ids)
  },
}

export { GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE }
