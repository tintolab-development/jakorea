/**
 * Gemini 실적관리 서비스 — remote(training-reports) only
 */

import { queryClient } from '@/shared/lib/query-client'
import { mapUploadToDisplayRow } from '../lib/performance/map-upload-to-display-row'
import {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  parseUploadExcel,
} from '../lib/performance/parse-upload-excel'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
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

const REMOTE_ONLY_MESSAGE =
  'Gemini 실적은 Admin API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export type GeminiPerformanceImportResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
  remoteImportRows?: GeminiTrainingReportImportRow[]
  uploadRows?: GeminiPerformanceUploadRow[]
}

export const geminiPerformanceService = {
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
    notifyProgramApiUnavailable('gemini-performance-import', 'Gemini 실적 가져오기')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  async applyImport(
    _importedRows: GeminiPerformanceRow[],
    strategy: GeminiPerformanceImportDuplicateStrategy,
    remoteImportRows?: GeminiTrainingReportImportRow[]
  ): Promise<void> {
    void _importedRows
    if (shouldUseGeminiPerformanceRemoteApi()) {
      const rows = remoteImportRows
      if (!rows || rows.length === 0) {
        throw new Error('원격 import 행이 없습니다. 파일을 다시 업로드해 주세요.')
      }
      await applyGeminiPerformanceImportRemote(rows, strategy)
      await queryClient.invalidateQueries({ queryKey: geminiPerformanceQueryKeys.list() })
      return
    }
    notifyProgramApiUnavailable('gemini-performance-import-apply', 'Gemini 실적 가져오기')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  delete(_ids: string[]): void {
    void _ids
    notifyProgramApiUnavailable('gemini-performance-delete', 'Gemini 실적 삭제')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },
}

export { GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE }
