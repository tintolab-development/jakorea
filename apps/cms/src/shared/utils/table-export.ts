/**
 * 테이블 데이터 엑셀 다운로드 유틸리티
 */

import { isValidElement, type ReactNode } from 'react'
import ExcelJS from '@zurmokeeper/exceljs'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import { downloadExcel, generateFilename } from './file-download'

export type ExportTableToExcelOptions = {
  /** true면 `filename`을 그대로 사용(확장자 없으면 `.xlsx`). 기본은 `_YYYYMMDD` 접미사 */
  exactFilename?: boolean
}

function resolveExcelDownloadFilename(filename: string, exactFilename?: boolean): string {
  if (!exactFilename) return generateFilename(filename, 'xlsx')
  return filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`
}

function isExportableColumn<T>(col: ColumnsType<T>[number]): col is ColumnType<T> {
  if ('children' in col && col.children) return false
  return col.key !== 'action' && !col.hidden
}

function resolveDataIndexValue<T extends Record<string, any>>(
  rowData: T,
  dataIndex: ColumnType<T>['dataIndex']
): unknown {
  if (dataIndex == null) return undefined
  if (Array.isArray(dataIndex)) {
    let value: unknown = rowData
    for (const key of dataIndex) {
      value = (value as Record<string, unknown> | undefined)?.[String(key)]
    }
    return value
  }
  if (typeof dataIndex === 'string' || typeof dataIndex === 'number') {
    return rowData[dataIndex]
  }
  return undefined
}

const EXPORT_TEXT_MAX_DEPTH = 8

function extractExportCellText(node: unknown, depth = 0): string {
  if (depth > EXPORT_TEXT_MAX_DEPTH) return ''
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    return node
      .map(child => extractExportCellText(child, depth + 1))
      .filter(Boolean)
      .join(' ')
  }
  if (!isValidElement(node)) return ''

  const props = node.props as Record<string, unknown>

  if (typeof props.label === 'string' || typeof props.label === 'number') {
    return String(props.label)
  }

  // StatusDropdownCell: 배지는 children이 아니라 renderBadge(status)
  if (typeof props.renderBadge === 'function' && props.status != null) {
    const badge = (props.renderBadge as (status: unknown) => unknown)(props.status)
    const fromBadge = extractExportCellText(badge, depth + 1)
    if (fromBadge) return fromBadge
  }

  const fromChildren = extractExportCellText(props.children as ReactNode, depth + 1)
  if (fromChildren) return fromChildren

  // <SponsorSponsorshipStatusBadge status="active" /> → EditableStatusBadge label
  // 훅을 쓰는 컴포넌트는 호출 시 throw → 빈 문자열
  if (typeof node.type === 'function') {
    try {
      const rendered = (node.type as (nextProps: unknown) => unknown)(props)
      return extractExportCellText(rendered, depth + 1)
    } catch {
      return ''
    }
  }

  return ''
}

function resolveExportCellValue<T extends Record<string, any>>(
  col: ColumnType<T>,
  rowData: T,
  rowIndex: number
): string {
  const rawValue = resolveDataIndexValue(rowData, col.dataIndex)

  if (typeof col.render === 'function') {
    try {
      const rendered = col.render(rawValue as never, rowData, rowIndex)
      const fromRender = extractExportCellText(rendered)
      if (fromRender) return fromRender
    } catch {
      // React 노드 등 — 원본 값으로 폴백
    }
  }

  return formatCellValue(rawValue, col)
}

/** 헤더와 데이터 행에 동일한 컬럼 집합을 쓴다. `No.`처럼 dataIndex 없는 열도 포함. */
export function buildTableExportMatrix<T extends Record<string, any>>(
  columns: ColumnsType<T>,
  dataSource: T[]
): { headers: string[]; rows: string[][] } {
  const exportableColumns = columns.filter(isExportableColumn)
  return {
    headers: exportableColumns.map(col => col.title as string),
    rows: dataSource.map((rowData, rowIndex) =>
      exportableColumns.map(col => resolveExportCellValue(col, rowData, rowIndex))
    ),
  }
}

/**
 * 테이블 데이터를 엑셀로 내보내기
 * @param columns - Ant Design Table의 columns 정의
 * @param dataSource - 테이블 데이터 배열
 * @param filename - 파일명 (확장자 제외). `exactFilename`이면 최종 파일명
 */
export async function exportTableToExcel<T extends Record<string, any>>(
  columns: ColumnsType<T>,
  dataSource: T[],
  filename: string,
  options?: ExportTableToExcelOptions
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  // 헤더 스타일
  const headerStyle = {
    font: { bold: true, size: 11 },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE0E0E0' },
    },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  }

  // 데이터 스타일
  const cellStyle = {
    border: {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
    alignment: { vertical: 'middle' as const } as const,
  }

  const { headers, rows } = buildTableExportMatrix(columns, dataSource)

  const headerRow = worksheet.addRow(headers)
  headerRow.eachCell((cell: any) => {
    cell.style = headerStyle
  })

  rows.forEach(rowValues => {
    const row = worksheet.addRow(rowValues)
    row.eachCell((cell: any) => {
      cell.style = cellStyle
    })
  })

  worksheet.columns.forEach((column: any, index: number) => {
    if (!column) return
    const headerLength = String(headers[index] ?? '').length
    const maxDataLength = Math.max(0, ...rows.map(row => String(row[index] ?? '').length))
    column.width = Math.min(Math.max(headerLength, maxDataLength) + 2, 50)
  })

  // 엑셀 파일 생성 및 다운로드
  const buffer = await workbook.xlsx.writeBuffer()
  downloadExcel(buffer, resolveExcelDownloadFilename(filename, options?.exactFilename))
}

/**
 * 셀 값 포맷팅
 */
function formatCellValue(value: any, column: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  // render 함수가 있는 경우는 원본 데이터를 반환 (태그 등 제거)
  if (column.render) {
    // render 함수가 있으면 원본 값을 반환
    return String(value)
  }

  // 날짜 형식 처리
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  // 숫자 형식 처리
  if (typeof value === 'number') {
    return String(value)
  }

  // 객체나 배열인 경우 JSON 문자열로 변환
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
