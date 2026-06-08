/**
 * 테이블 엑셀 다운로드 공통 훅 — loading·빈 데이터·에러 alert 처리
 */

import { useCallback, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { exportTableToExcel } from '@/shared/utils/table-export'

export type TableExcelExporter<T extends object> = (
  columns: ColumnsType<T>,
  data: T[],
  filename: string
) => Promise<void>

export type UseTableExcelExportOptions<T extends object> = {
  columns: ColumnsType<T>
  data: T[]
  filename: string
  /** 기본: exportTableToExcel */
  exporter?: TableExcelExporter<T>
  /** 빈 데이터 시 alert — 기본 true */
  alertOnEmpty?: boolean
  emptyAlertTitle?: string
  emptyAlertContent?: string
  errorAlertTitle?: string
  errorAlertContent?: string
}

const DEFAULT_EMPTY_TITLE = '다운로드 안내'
const DEFAULT_EMPTY_CONTENT = '다운로드할 데이터가 없습니다.'
const DEFAULT_ERROR_TITLE = '다운로드 실패'
const DEFAULT_ERROR_CONTENT = '엑셀 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'

export function useTableExcelExport<T extends object>({
  columns,
  data,
  filename,
  exporter = exportTableToExcel,
  alertOnEmpty = true,
  emptyAlertTitle = DEFAULT_EMPTY_TITLE,
  emptyAlertContent = DEFAULT_EMPTY_CONTENT,
  errorAlertTitle = DEFAULT_ERROR_TITLE,
  errorAlertContent = DEFAULT_ERROR_CONTENT,
}: UseTableExcelExportOptions<T>) {
  const { showAlert } = useCmsAlert()
  const [isExporting, setIsExporting] = useState(false)

  const exportExcel = useCallback(async () => {
    if (isExporting) return
    if (data.length === 0) {
      if (alertOnEmpty) {
        showAlert({ title: emptyAlertTitle, content: emptyAlertContent })
      }
      return
    }
    setIsExporting(true)
    try {
      await exporter(columns, data, filename)
    } catch (error) {
      console.error('[useTableExcelExport] excel export failed', error)
      showAlert({ title: errorAlertTitle, content: errorAlertContent })
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
    isExporting,
    showAlert,
  ])

  return { exportExcel, isExporting }
}
