/**
 * Gemini 실적관리 서비스 — mock/localStorage + remote(training-reports) 분기
 */

import { queryClient } from '@/shared/lib/query-client'
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
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import { shouldUseGeminiPerformanceRemoteApi } from './performance-remote/capabilities'
import { geminiPerformanceQueryKeys } from './performance-remote/query-keys'
import {
  applyGeminiPerformanceImportRemote,
  prepareGeminiPerformanceImportRemote,
} from './performance-remote/service'

export type GeminiPerformanceImportResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
  remoteImportRows?: GeminiTrainingReportImportRow[]
  uploadRows?: GeminiPerformanceUploadRow[]
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
    if (shouldUseGeminiPerformanceRemoteApi()) {
      return prepareGeminiPerformanceImportRemote(file)
    }
    const uploadRows = await parseUploadExcel(file)
    const importedRows = await Promise.all(uploadRows.map(row => mapUploadToDisplayRow(row)))
    const duplicateKeys = findDuplicateKeys(importedRows)
    return { importedRows, duplicateKeys, uploadRows }
  },

  async applyImport(
    importedRows: GeminiPerformanceRow[],
    strategy: GeminiPerformanceImportDuplicateStrategy,
    remoteImportRows?: GeminiTrainingReportImportRow[]
  ): Promise<void> {
    if (shouldUseGeminiPerformanceRemoteApi()) {
      const rows = remoteImportRows
      if (!rows || rows.length === 0) {
        throw new Error('원격 import 행이 없습니다. 파일을 다시 업로드해 주세요.')
      }
      await applyGeminiPerformanceImportRemote(rows, strategy)
      await queryClient.invalidateQueries({ queryKey: geminiPerformanceQueryKeys.list() })
      return
    }
    importGeminiPerformanceRows(importedRows, strategy)
  },

  delete(ids: string[]): void {
    if (shouldUseGeminiPerformanceRemoteApi()) {
      throw new Error(
        '실적 삭제 API가 아직 연동되지 않았습니다. OpenAPI DELETE 추가 후 사용할 수 있습니다.'
      )
    }
    deleteGeminiPerformanceRows(ids)
  },
}

export { GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE }
