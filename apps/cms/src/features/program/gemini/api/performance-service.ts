/**
 * Gemini 실적관리 서비스 — remote(training-reports) only
 */

import type { InfiniteData } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/query-client'
import { mapUploadToDisplayRow } from '../lib/performance/map-upload-to-display-row'
import {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE,
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
  deleteGeminiPerformanceRowsRemote,
  prepareGeminiPerformanceImportRemote,
  reloadGeminiPerformanceListCache,
  type GeminiPerformanceListFilters,
  type GeminiPerformanceRemoteListPage,
} from './performance-remote/service'

const REMOTE_ONLY_MESSAGE =
  'Gemini 실적은 Admin API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export type GeminiPerformanceImportResult = {
  importedRows: GeminiPerformanceRow[]
  duplicateKeys: string[]
  remoteImportRows?: GeminiTrainingReportImportRow[]
  uploadRows?: GeminiPerformanceUploadRow[]
  paidDuplicate?: boolean
  paymentExclusionNotes?: string
}

function parseListFiltersFromQueryKey(
  queryKey: readonly unknown[]
): GeminiPerformanceListFilters {
  const raw = queryKey[5]
  if (typeof raw !== 'string' || !raw) return {}
  try {
    const parsed = JSON.parse(raw) as GeminiPerformanceListFilters
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** 활성·캐시된 실적 목록 쿼리를 서버 전체 페이지로 다시 채운다. */
async function refreshGeminiPerformanceListCaches(): Promise<void> {
  const queries = queryClient.getQueryCache().findAll({
    queryKey: geminiPerformanceQueryKeys.all,
  })
  const listQueries = queries.filter(query => query.queryKey[4] === 'list')
  if (listQueries.length === 0) {
    const pages = await reloadGeminiPerformanceListCache({})
    queryClient.setQueryData<InfiniteData<GeminiPerformanceRemoteListPage>>(
      geminiPerformanceQueryKeys.list({}),
      { pages, pageParams: pages.map((_, index) => index) }
    )
    return
  }
  await Promise.all(
    listQueries.map(async query => {
      const filters = parseListFiltersFromQueryKey(query.queryKey)
      const pages = await reloadGeminiPerformanceListCache(filters)
      queryClient.setQueryData<InfiniteData<GeminiPerformanceRemoteListPage>>(
        query.queryKey,
        { pages, pageParams: pages.map((_, index) => index) }
      )
    })
  )
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
  ): Promise<{ paymentExclusionNotes?: string } | void> {
    void _importedRows
    if (shouldUseGeminiPerformanceRemoteApi()) {
      const rows = remoteImportRows
      if (!rows || rows.length === 0) {
        throw new Error('원격 import 행이 없습니다. 파일을 다시 업로드해 주세요.')
      }
      const result = await applyGeminiPerformanceImportRemote(rows, strategy)
      await refreshGeminiPerformanceListCaches()
      return result
    }
    notifyProgramApiUnavailable('gemini-performance-import-apply', 'Gemini 실적 가져오기')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  async delete(ids: string[]): Promise<void> {
    if (shouldUseGeminiPerformanceRemoteApi()) {
      await deleteGeminiPerformanceRowsRemote(ids)
      await refreshGeminiPerformanceListCaches()
      return
    }
    notifyProgramApiUnavailable('gemini-performance-delete', 'Gemini 실적 삭제')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },
}

export {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE,
}
