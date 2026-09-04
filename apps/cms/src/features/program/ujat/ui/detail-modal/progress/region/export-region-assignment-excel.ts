import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import { getRegionAssignmentInstitutionHeaderLabel } from './mock'
import type {
  RegionAssignmentCell,
  RegionAssignmentColumn,
  RegionAssignmentTableData,
} from './types'

const THIN_BORDER = {
  top: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
  right: { style: 'thin' as const },
}

const HEADER_FILL = 'FFF5F6F7'
const WITHDRAWN_FILL = 'FFFFF0F0'
const BLOCKED_FILL = 'FFFFF2F2'
const RED_TEXT = 'FFFF4D4F'
const MINT_TEXT = 'FF01A1AF'

function sanitizeSheetName(label: string): string {
  const sanitized = label.replace(/[[\]\\/*?:]/g, '_').trim()
  return (sanitized || '배정표').slice(0, 31)
}

function applyHeaderStyle(cell: ExcelJS.Cell): void {
  cell.style = {
    font: { bold: true, size: 11 },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: THIN_BORDER,
  }
}

function applyBodyStyle(
  cell: ExcelJS.Cell,
  options?: {
    fill?: string
    bold?: boolean
    fontColor?: string
  }
): void {
  cell.style = {
    font: {
      bold: options?.bold ?? false,
      color: options?.fontColor ? { argb: options.fontColor } : undefined,
    },
    fill: options?.fill
      ? {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: options.fill },
        }
      : undefined,
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: THIN_BORDER,
  }
}

function formatAssignmentCell(cell: RegionAssignmentCell | undefined): string {
  if (!cell || cell.kind === 'empty') return '-'
  return cell.isAttendanceManager ? `출결 / ${cell.classLabel}` : cell.classLabel
}

function selectedAssignedCount(cells: Array<RegionAssignmentCell | undefined>): number {
  return cells.filter(cell => cell?.kind === 'assigned').length
}

function selectedColumnsWithIndexes(
  data: RegionAssignmentTableData,
  selectedColumnIds: readonly string[]
): Array<{ column: RegionAssignmentColumn; index: number }> {
  const selectedSet = new Set(selectedColumnIds)
  return data.columns
    .map((column, index) => ({ column, index }))
    .filter(item => selectedSet.has(item.column.id))
}

export async function exportRegionAssignmentExcel(
  data: RegionAssignmentTableData,
  selectedColumnIds: readonly string[]
): Promise<void> {
  const selectedColumns = selectedColumnsWithIndexes(data, selectedColumnIds)
  if (selectedColumns.length === 0) return

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sanitizeSheetName(`${data.regionLabel} 배정표`))
  const maxColumnNumber = selectedColumns.length + 2

  const dateHeaderRow = sheet.addRow([
    '총 교육일',
    '교육 진행일',
    ...selectedColumns.map(({ column }) => column.dateLabel),
  ])
  const institutionHeaderRow = sheet.addRow([
    '',
    '기관명 및 소재지',
    ...selectedColumns.map(({ column }) =>
      getRegionAssignmentInstitutionHeaderLabel(column, data.regionKey)
    ),
  ])

  sheet.mergeCells(1, 1, 2, 1)
  for (let rowNumber = 1; rowNumber <= 2; rowNumber += 1) {
    for (let colNumber = 1; colNumber <= maxColumnNumber; colNumber += 1) {
      applyHeaderStyle(sheet.getRow(rowNumber).getCell(colNumber))
    }
  }
  dateHeaderRow.height = 28
  institutionHeaderRow.height = 36

  data.rows.forEach(row => {
    const selectedCells = selectedColumns.map(({ index }) => row.cells[index])
    const bodyRow = sheet.addRow([
      `${selectedAssignedCount(selectedCells)}일`,
      row.name,
      ...selectedCells.map(formatAssignmentCell),
    ])

    for (let colNumber = 1; colNumber <= maxColumnNumber; colNumber += 1) {
      const excelCell = bodyRow.getCell(colNumber)
      const assignmentCell = selectedCells[colNumber - 3]
      const isBlockedEmpty =
        assignmentCell?.kind === 'empty' &&
        (assignmentCell.blockedEmpty || selectedColumns[colNumber - 3]?.column.isBlockedDate)

      applyBodyStyle(excelCell, {
        fill: row.isWithdrawnVolunteer ? WITHDRAWN_FILL : isBlockedEmpty ? BLOCKED_FILL : undefined,
        bold:
          colNumber <= 2 ||
          (assignmentCell?.kind === 'assigned' &&
            (assignmentCell.isSolo || assignmentCell.isInvalidAssignment)),
        fontColor:
          colNumber === 2 && row.isWithdrawnVolunteer
            ? RED_TEXT
            : assignmentCell?.kind === 'assigned' && assignmentCell.isInvalidAssignment
              ? RED_TEXT
              : assignmentCell?.kind === 'assigned' && assignmentCell.isSolo
                ? MINT_TEXT
                : undefined,
      })
    }
    bodyRow.height = 30
  })

  sheet.getColumn(1).width = 12
  sheet.getColumn(2).width = 18
  selectedColumns.forEach(({ column }, index) => {
    const excelColumn = sheet.getColumn(index + 3)
    const headerLength = Math.max(
      column.dateLabel.length,
      getRegionAssignmentInstitutionHeaderLabel(column, data.regionKey).length,
      10
    )
    excelColumn.width = Math.min(Math.max(headerLength + 4, 16), 28)
  })

  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }]

  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(buffer, generateFilename(`배정표_${data.regionLabel}`, 'xlsx'))
}
