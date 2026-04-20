/**
 * 세금신고 양식 xlsx (미리보기와 동일 데이터)
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import {
  buildTaxFilingSheetLines,
  TAX_FILING_HEADER_LABELS,
  TAX_FILING_INCOME_GROUPS,
  type TaxFilingDetailLine,
  type TaxFilingSubtotalLine,
} from '@/pages/settlement-management/tax-filing-fortune-data'

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
  const sub = options?.subtotal ?? false
  row.eachCell((cell, col) => {
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_LIGHT } },
      bottom: { style: 'thin', color: { argb: BORDER_LIGHT } },
      left: { style: 'thin', color: { argb: BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: BORDER_LIGHT } },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: col === 1 && sub ? 'left' : 'center',
      wrapText: true,
    }
    if (sub) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SUBTOTAL_FILL },
      }
    }
  })
}

function detailToExcelValues(line: TaxFilingDetailLine): (string | number)[] {
  const dash = (n: number | null) => (n == null ? '-' : n)
  return [
    '',
    line.paymentDate,
    line.paymentAmount == null ? '-' : line.paymentAmount,
    dash(line.incomeTax),
    dash(line.residenceTax),
    dash(line.afterDeduction),
    line.name,
    line.residentId,
    line.project,
  ]
}

function subtotalToExcelValues(line: TaxFilingSubtotalLine): (string | number)[] {
  const { sums } = line
  return [
    '소계',
    '-',
    sums.paymentAmount,
    sums.incomeTax,
    sums.residenceTax,
    sums.afterDeduction,
    '-',
    '-',
    '-',
  ]
}

export async function exportTaxFilingExcel(rows: AccountPaymentRow[]): Promise<void> {
  const lines = buildTaxFilingSheetLines(rows)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')

  const headerRow = sheet.addRow([...TAX_FILING_HEADER_LABELS])
  applyHeaderStyle(headerRow)

  let lineIdx = 0
  let excelRow = 2

  for (const g of TAX_FILING_INCOME_GROUPS) {
    const mergeTop = excelRow
    for (let i = 0; i < g.detailRows; i += 1) {
      const line = lines[lineIdx]!
      lineIdx += 1
      if (line.kind !== 'detail') throw new Error('tax-filing excel: expected detail')
      const values = detailToExcelValues(line)
      const row = sheet.addRow(values)
      applyDataRowStyle(row)
      if (i === 0) {
        row.getCell(1).value = g.label
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      } else {
        row.getCell(1).value = ''
      }
      for (const col of [3, 4, 5, 6] as const) {
        const c = row.getCell(col)
        if (typeof c.value === 'number') {
          c.numFmt = '#,##0'
        }
      }
      excelRow += 1
    }

    sheet.mergeCells(`A${mergeTop}:A${excelRow - 1}`)

    const subLine = lines[lineIdx]!
    lineIdx += 1
    if (subLine.kind !== 'subtotal') throw new Error('tax-filing excel: expected subtotal')
    const subValues = subtotalToExcelValues(subLine)
    const subRow = sheet.addRow(subValues)
    applyDataRowStyle(subRow, { subtotal: true })
    for (const col of [3, 4, 5, 6] as const) {
      const c = subRow.getCell(col)
      if (typeof c.value === 'number') {
        c.numFmt = '#,##0'
      }
    }
    excelRow += 1
  }

  if (lineIdx !== lines.length) {
    throw new Error('tax-filing excel: line count mismatch')
  }

  sheet.columns = [
    { width: 36 },
    { width: 22 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 26 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()
  downloadExcel(buffer, generateFilename('세금신고', 'xlsx'))
}
