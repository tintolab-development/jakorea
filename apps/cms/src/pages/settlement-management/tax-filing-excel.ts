/**
 * 세금신고 양식 local fallback XLSX.
 * remote에서는 이 모듈을 사용하지 않고 SERVER_FILE을 그대로 다운로드한다.
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel } from '@/shared/utils/file-download'
import { buildSettlementFormExcelFilename } from '@/features/settlement-management/api/account-payments/settlement-form-download'
import {
  TAX_REPORT_PREVIEW_COLUMNS,
  type TaxReportPreviewCell,
  type TaxReportPreviewWorkbook,
} from '@/features/settlement-management/api/account-payments/tax-report-preview'

const HEADER_FILL = 'FF01A1AF'
const SUBTOTAL_FILL = 'FFE8F5F6'
const BORDER_LIGHT = 'FFD0D0D0'

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_LIGHT } },
      bottom: { style: 'thin', color: { argb: BORDER_LIGHT } },
      left: { style: 'thin', color: { argb: BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: BORDER_LIGHT } },
    }
  })
}
function applyDataRowStyle(row: ExcelJS.Row, options?: { subtotal?: boolean }) {
  const subtotal = options?.subtotal ?? false
  row.eachCell((cell, column) => {
    cell.font = {
      size: 11,
      ...(subtotal && column === 1 ? { bold: true, color: { argb: 'FF3D3D3D' } } : {}),
    }
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_LIGHT } },
      bottom: { style: 'thin', color: { argb: BORDER_LIGHT } },
      left: { style: 'thin', color: { argb: BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: BORDER_LIGHT } },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: subtotal && column === 1 ? 'left' : 'center',
      wrapText: true,
    }
    if (subtotal) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SUBTOTAL_FILL },
      }
    }
  })
}
function excelValue(value: TaxReportPreviewCell, column: number): string | number {
  if (value == null) return column === 1 ? '' : '-'
  return value
}
function applyNumberFormat(row: ExcelJS.Row) {
  for (const column of [3, 4, 5, 6] as const) {
    const cell = row.getCell(column)
    if (typeof cell.value === 'number') cell.numFmt = '#,##0'
  }
}
export async function exportTaxFilingExcel(
  previewWorkbook: TaxReportPreviewWorkbook,
  options: { password?: string } = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(previewWorkbook.sheetName)
  sheet.properties.defaultRowHeight = previewWorkbook.defaultRowHeight
  sheet.views = [{ state: 'frozen', ySplit: previewWorkbook.freezeRows }]
  sheet.autoFilter = previewWorkbook.autoFilter

  const headerRow = sheet.addRow([...TAX_REPORT_PREVIEW_COLUMNS])
  applyHeaderStyle(headerRow)

  for (const previewRow of previewWorkbook.rows) {
    const values = TAX_REPORT_PREVIEW_COLUMNS.map((column, index) =>
      excelValue(previewRow[column], index + 1)
    )
    const row = sheet.addRow(values)
    const subtotal = previewRow['소득구분'] === '소계' || previewRow['소득구분'] === '합계'
    applyDataRowStyle(row, { subtotal })
    applyNumberFormat(row)
  }

  for (const merge of previewWorkbook.merges) sheet.mergeCells(merge)

  sheet.columns = previewWorkbook.columnWidths.map(width => ({ width }))

  const buffer = await workbook.xlsx.writeBuffer(
    options.password ? { password: options.password } : undefined
  )
  await downloadExcel(buffer, buildSettlementFormExcelFilename('tax-report'))
}
