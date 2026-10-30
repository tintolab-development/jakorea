/**
 * 테이블 엑셀 다운로드 공통 훅 — loading·빈 데이터·에러 alert 처리
 *
 * alert는 `cmsAlertModal`(imperative)을 쓴다.
 * `FilterTableLayout`이 excelExport 없이도 이 훅을 항상 호출하므로,
 * `useCmsAlert` 컨텍스트 의존으로 레이아웃 전체를 깨지 않는다.
 *
 * `selectedRowKeys`를 넘기면(빈 배열 포함) 선택 필수:
 * 미선택·필터 교집합 없음 → 다운로드하지 않고 항목 선택 안내.
 */

import { useCallback, useState, type Key } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { guardAdminDownload } from '@/shared/lib/session-admin-role'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { exportTableToExcel } from '@/shared/utils/table-export'

export type TableExcelExporter<T extends object> = (
  columns: ColumnsType<T>,
  data: T[],
  filename: string
) => Promise<void>

export const TABLE_EXCEL_NO_SELECTION_ALERT = {
  title: '항목 선택 안내',
  content: '선택된 항목이 없습니다.\n항목 선택 후 다시 시도해 주세요.',
} as const

export function defaultTableExcelRowKey<T extends object>(row: T): string {
  const record = row as Record<string, unknown>
  if (record.id != null && record.id !== '') return String(record.id)
  if (record.key != null && record.key !== '') return String(record.key)
  return ''
}

export type UseTableExcelExportOptions<T extends object> = {
  columns: ColumnsType<T>
  data: T[]
  /** 현재 화면에 로드된 data 대신 다운로드 시점의 전체 데이터를 resolve한다. */
  resolveData?: () => T[] | Promise<T[]>
  /**
   * 전달되면(빈 배열 포함) 선택 필수.
   * 현재 `data`(또는 resolveData)와 교집합인 행만 내보낸다.
   */
  selectedRowKeys?: Key[]
  getRowKey?: (row: T) => string
  filename: string
  /** 기본: exportTableToExcel */
  exporter?: TableExcelExporter<T>
  /** 빈 데이터 시 alert — 기본 true (선택 필수 미선택은 항상 안내) */
  alertOnEmpty?: boolean
  emptyAlertTitle?: string
  emptyAlertContent?: string
  errorAlertTitle?: string
  errorAlertContent?: string | ((error: unknown) => string)
}

const DEFAULT_EMPTY_TITLE = '다운로드 안내'
const DEFAULT_EMPTY_CONTENT = '다운로드할 데이터가 없습니다.'
const DEFAULT_ERROR_TITLE = '다운로드 실패'
const DEFAULT_ERROR_CONTENT = '엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'

export function useTableExcelExport<T extends object>({
  columns,
  data,
  resolveData,
  selectedRowKeys,
  getRowKey = defaultTableExcelRowKey,
  filename,
  exporter = exportTableToExcel,
  alertOnEmpty = true,
  emptyAlertTitle = DEFAULT_EMPTY_TITLE,
  emptyAlertContent = DEFAULT_EMPTY_CONTENT,
  errorAlertTitle = DEFAULT_ERROR_TITLE,
  errorAlertContent = DEFAULT_ERROR_CONTENT,
}: UseTableExcelExportOptions<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = useCallback(async () => {
    if (isExporting) return
    if (!guardAdminDownload()) return
    const requireSelection = selectedRowKeys !== undefined
    if (requireSelection && selectedRowKeys.length === 0) {
      cmsAlertModal.show({
        title: TABLE_EXCEL_NO_SELECTION_ALERT.title,
        content: TABLE_EXCEL_NO_SELECTION_ALERT.content,
      })
      return
    }
    setIsExporting(true)
    try {
      const resolved = resolveData ? await resolveData() : data
      const exportData = requireSelection
        ? filterRowsBySelectedKeys(resolved, selectedRowKeys, getRowKey)
        : resolved
      if (exportData.length === 0) {
        if (requireSelection) {
          cmsAlertModal.show({
            title: TABLE_EXCEL_NO_SELECTION_ALERT.title,
            content: TABLE_EXCEL_NO_SELECTION_ALERT.content,
          })
          return
        }
        if (alertOnEmpty) {
          cmsAlertModal.show({ title: emptyAlertTitle, content: emptyAlertContent })
        }
        return
      }
      await exporter(columns, exportData, filename)
    } catch (error) {
      console.error('[useTableExcelExport] excel export failed', error)
      const content =
        typeof errorAlertContent === 'function' ? errorAlertContent(error) : errorAlertContent
      cmsAlertModal.show({ title: errorAlertTitle, content })
    } finally {
      setIsExporting(false)
    }
  }, [
    alertOnEmpty,
    columns,
    data,
    emptyAlertContent,
    emptyAlertTitle,
    errorAlertContent,
    errorAlertTitle,
    exporter,
    filename,
    getRowKey,
    isExporting,
    resolveData,
    selectedRowKeys,
  ])

  return { exportExcel, isExporting }
}

function filterRowsBySelectedKeys<T extends object>(
  rows: T[],
  selectedRowKeys: Key[],
  getRowKey: (row: T) => string
): T[] {
  const keySet = new Set(selectedRowKeys.map(key => String(key)))
  return rows.filter(row => keySet.has(getRowKey(row)))
}
