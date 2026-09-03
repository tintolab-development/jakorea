/**
 * 임시 교육 일정표 미리보기 — CrossTable과 동일 구조의 xlsx
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import type { ScheduleSheetPreviewColumn, ScheduleSheetPreviewRegion } from './build-schedule-sheet-preview'

const CORNER_LABEL = '배정 기관 / 날짜'
const ROW_LABELS = ['기관명', '배정 학급', '총 학급 수'] as const

const THIN_BORDER = {
  top: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
  right: { style: 'thin' as const },
}

const HEADER_FILL = 'FFF5F6F7'

const HEADER_STYLE = {
  font: { bold: true, size: 11 },
  fill: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: HEADER_FILL },
  },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  border: THIN_BORDER,
}

const ROW_HEADER_STYLE = {
  font: { bold: true, size: 11 },
  fill: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: HEADER_FILL },
  },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  border: THIN_BORDER,
}

const CELL_STYLE = {
  border: THIN_BORDER,
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
}

function sanitizeSheetName(label: string): string {
  const sanitized = label.replace(/[[\]\\/*?:]/g, '_').trim()
  return (sanitized || 'Sheet').slice(0, 31)
}

function formatGradeClassCell(column: ScheduleSheetPreviewColumn): string {
  if (column.gradeClassLines.length === 0) {
    return '-'
  }
  return column.gradeClassLines.join('\n')
}

function formatTotalCell(column: ScheduleSheetPreviewColumn): string | number {
  if (column.totalClassCount > 0) {
    return column.totalClassCount
  }
  return '-'
}

function applyRowHeaderStyle(cell: ExcelJS.Cell): void {
  cell.style = ROW_HEADER_STYLE
}

function applyDataCellStyle(cell: ExcelJS.Cell, options?: { wrapText?: boolean }): void {
  cell.style = {
    ...CELL_STYLE,
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: options?.wrapText ?? false,
    },
  }
}

function addRegionWorksheet(workbook: ExcelJS.Workbook, region: ScheduleSheetPreviewRegion): void {
  const sheet = workbook.addWorksheet(sanitizeSheetName(region.regionLabel))
  const { columns } = region

  const dateHeaderRow = sheet.addRow([CORNER_LABEL, ...columns.map(column => column.dateTitle)])
  dateHeaderRow.eachCell(cell => {
    cell.style = HEADER_STYLE
  })

  const institutionRow = sheet.addRow([ROW_LABELS[0], ...columns.map(column => column.institutionName)])
  applyRowHeaderStyle(institutionRow.getCell(1))
  institutionRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) applyDataCellStyle(cell)
  })

  const gradesRow = sheet.addRow([ROW_LABELS[1], ...columns.map(formatGradeClassCell)])
  applyRowHeaderStyle(gradesRow.getCell(1))
  gradesRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) applyDataCellStyle(cell, { wrapText: true })
  })

  const totalRow = sheet.addRow([ROW_LABELS[2], ...columns.map(formatTotalCell)])
  applyRowHeaderStyle(totalRow.getCell(1))
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber > 1) applyDataCellStyle(cell)
  })

  sheet.getColumn(1).width = 18
  columns.forEach((column, index) => {
    const col = sheet.getColumn(index + 2)
    const headerLen = column.dateTitle.length
    const institutionLen = column.institutionName.length
    const gradeLen = Math.max(...column.gradeClassLines.map(line => line.length), 1)
    col.width = Math.min(Math.max(headerLen, institutionLen, gradeLen) + 4, 40)
  })

  sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }]
}

export async function exportScheduleSheetExcel(
  regions: readonly ScheduleSheetPreviewRegion[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook()

  for (const region of regions) {
    addRegionWorksheet(workbook, region)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(buffer, generateFilename('임시교육일정표', 'xlsx'))
}
