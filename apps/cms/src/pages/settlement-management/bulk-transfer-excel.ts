/**
 * 대량이체 양식 xlsx (미리보기와 동일 데이터)
 */

import ExcelJS from '@zurmokeeper/exceljs'
import dayjs from 'dayjs'
import { downloadExcel } from '@/shared/utils/file-download'
import {
  BULK_TRANSFER_HEADER_LABELS,
  buildBulkTransferSheetRows,
} from '@/pages/settlement-management/bulk-transfer-fortune-data'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'

/** 기획 파일명: `[JA Korea] CMS 어드민_대량이체 양식_YYMMDD` */
export const BULK_TRANSFER_EXCEL_PREFIX = '[JA Korea] CMS 어드민_대량이체 양식'

export function buildBulkTransferExcelFilename(now: dayjs.Dayjs | Date = dayjs()): string {
  return `${BULK_TRANSFER_EXCEL_PREFIX}_${dayjs(now).format('YYMMDD')}.xlsx`
}

const HEADER_FILL = 'FF01A1AF'

export async function exportBulkTransferExcel(rows: AccountPaymentRow[]): Promise<void> {
  const lines = buildBulkTransferSheetRows(rows)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')

  const headerRow = sheet.addRow([...BULK_TRANSFER_HEADER_LABELS])
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  for (const line of lines) {
    const row = sheet.addRow([
      line.depositBank,
      line.depositAccount,
      line.depositAmount,
      line.expectedDepositor,
      line.depositStatement,
      line.withdrawalStatement,
      line.memo,
      line.cmsCode,
      line.mobile,
    ])
    row.eachCell((cell, col) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell.alignment = { vertical: 'middle' }
      if (col === 3) {
        cell.numFmt = '#,##0'
      }
    })
  }

  sheet.columns = [
    { width: 18 },
    { width: 22 },
    { width: 15 },
    { width: 15 },
    { width: 19 },
    { width: 19 },
    { width: 12 },
    { width: 14 },
    { width: 17 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(buffer, buildBulkTransferExcelFilename())
}
