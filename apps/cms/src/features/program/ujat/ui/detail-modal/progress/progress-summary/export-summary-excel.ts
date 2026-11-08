import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel } from '@/shared/utils/file-download'
import { regionValuesInOrder } from './summary-display'
import {
  UJAT_EDU_PROGRESS_SCHOOL_METRIC_LABEL,
  UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER,
  type UjatEducationProgressColumnRegion,
  type UjatEducationProgressSchoolSummary,
  type UjatEducationProgressSummaryTone,
  type UjatEducationProgressVolunteerSummary,
} from './types'

const THIN_BORDER = {
  top: { style: 'thin' as const, color: { argb: 'FFE0E0E0' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFE0E0E0' } },
  left: { style: 'thin' as const, color: { argb: 'FFE0E0E0' } },
  right: { style: 'thin' as const, color: { argb: 'FFE0E0E0' } },
}

const FILL_HEADER = 'FFF5F6F7'
const FILL_H1 = 'FFE6F4F7'
const FILL_H2 = 'FFE6F1E8'
const FILL_GRAND = 'FFF9E8EB'
const FILL_WHITE = 'FFFFFFFF'
const TEXT = 'FF3D3D3D'
const TEXT_MINT = 'FF01A1AF'

const KST_YMD_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const TONE_FILL: Record<UjatEducationProgressSummaryTone, string> = {
  h1: FILL_H1,
  h2: FILL_H2,
  grand: FILL_GRAND,
}

export function buildEducationProgressSummaryExcelFilename(now: Date = new Date()): string {
  const ymd = KST_YMD_FORMATTER.format(now).replace(/-/g, '')
  return `교육진행요약_${ymd}.xlsx`
}

function excelJsBufferToArrayBuffer(buffer: ExcelJS.Buffer): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) return buffer
  if (ArrayBuffer.isView(buffer)) {
    const view = buffer as ArrayBufferView
    const copy = new Uint8Array(view.byteLength)
    copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
    return copy.buffer
  }
  return Uint8Array.from(buffer as ArrayLike<number>).buffer
}

function cellFill(argb: string): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

function applyCell(
  cell: ExcelJS.Cell,
  options: {
    value?: ExcelJS.CellValue
    bold?: boolean
    fill?: string
    fontColor?: string
    numFmt?: string
  } = {}
): void {
  if (options.value !== undefined) cell.value = options.value
  cell.font = {
    bold: options.bold ?? false,
    size: 11,
    name: 'Pretendard',
    color: { argb: options.fontColor ?? TEXT },
  }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = THIN_BORDER
  if (options.fill) cell.fill = cellFill(options.fill)
  if (options.numFmt) cell.numFmt = options.numFmt
}

function summaryExcelValue(value: number | null): string | number {
  if (value == null) return '-'
  return value
}

function paintRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  style: { bold?: boolean; fill?: string; fontColor?: string }
): void {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      applyCell(sheet.getRow(row).getCell(col), style)
    }
  }
}

function writeRegionDataCells(
  excelRow: ExcelJS.Row,
  startCol: number,
  values: Array<number | null>,
  total: number | null,
  options?: { fill?: string; totalMint?: boolean }
): void {
  values.forEach((value, index) => {
    const numeric = typeof value === 'number'
    applyCell(excelRow.getCell(startCol + index), {
      value: summaryExcelValue(value),
      bold: true,
      fill: options?.fill ?? FILL_WHITE,
      numFmt: numeric ? '#,##0' : undefined,
    })
  })
  const totalNumeric = typeof total === 'number'
  applyCell(excelRow.getCell(startCol + values.length), {
    value: summaryExcelValue(total),
    bold: true,
    fill: options?.fill ?? FILL_WHITE,
    fontColor: options?.totalMint === false ? TEXT : TEXT_MINT,
    numFmt: totalNumeric ? '#,##0' : undefined,
  })
}

export function buildUjatEducationProgressSummaryWorkbook(input: {
  regions: readonly UjatEducationProgressColumnRegion[]
  schoolSummary: UjatEducationProgressSchoolSummary
  volunteerSummary: UjatEducationProgressVolunteerSummary
}): ExcelJS.Workbook {
  const regions = input.regions.filter(region => region.key.trim())
  const regionKeys = regions.map(region => region.key)
  const lastCol = 2 + regions.length + 1
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('교육 진행 요약', {
    views: [{ showGridLines: false }],
  })

  sheet.getColumn(1).width = 18
  sheet.getColumn(2).width = 20
  for (let col = 3; col <= lastCol; col += 1) {
    sheet.getColumn(col).width = 14
  }

  let rowNumber = 1
  applyCell(sheet.getRow(rowNumber).getCell(1), {
    value: '학교 교육 진행 요약',
    bold: true,
  })
  sheet.getRow(rowNumber).getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }
  sheet.getRow(rowNumber).font = { bold: true, size: 14, color: { argb: TEXT } }
  rowNumber += 1

  const schoolHeaderRow = sheet.getRow(rowNumber)
  applyCell(schoolHeaderRow.getCell(1), { value: '구분', bold: true, fill: FILL_HEADER })
  applyCell(schoolHeaderRow.getCell(2), { fill: FILL_HEADER, bold: true })
  regions.forEach((region, index) => {
    applyCell(schoolHeaderRow.getCell(3 + index), {
      value: region.label,
      bold: true,
      fill: FILL_HEADER,
    })
  })
  applyCell(schoolHeaderRow.getCell(lastCol), { value: '합계', bold: true, fill: FILL_HEADER })
  sheet.mergeCells(rowNumber, 1, rowNumber, 2)
  const schoolHeaderRowNumber = rowNumber
  rowNumber += 1

  const appliedRow = sheet.getRow(rowNumber)
  applyCell(appliedRow.getCell(1), { value: '신청 학교', fill: FILL_WHITE })
  applyCell(appliedRow.getCell(2), { fill: FILL_WHITE })
  writeRegionDataCells(
    appliedRow,
    3,
    regionValuesInOrder(input.schoolSummary.appliedSchools, regionKeys),
    input.schoolSummary.appliedSchools.total
  )
  sheet.mergeCells(rowNumber, 1, rowNumber, 2)
  rowNumber += 1

  for (const semester of input.schoolSummary.semesters) {
    const groupStart = rowNumber
    const fill = TONE_FILL[semester.tone]
    UJAT_EDU_PROGRESS_SCHOOL_METRIC_ORDER.forEach((metricKey, metricIndex) => {
      const excelRow = sheet.getRow(rowNumber)
      applyCell(excelRow.getCell(1), {
        value: metricIndex === 0 ? semester.label : '',
        fill,
      })
      applyCell(excelRow.getCell(2), {
        value: UJAT_EDU_PROGRESS_SCHOOL_METRIC_LABEL[metricKey],
        fill,
      })
      const metricRow = semester.metrics[metricKey]
      writeRegionDataCells(
        excelRow,
        3,
        regionValuesInOrder(metricRow, regionKeys),
        metricRow.total
      )
      rowNumber += 1
    })
    const groupEnd = rowNumber - 1
    if (groupEnd > groupStart) sheet.mergeCells(groupStart, 1, groupEnd, 1)
    paintRange(sheet, groupStart, 1, groupEnd, 2, { fill })
    sheet.getRow(groupStart).getCell(1).value = semester.label
  }

  rowNumber += 1
  applyCell(sheet.getRow(rowNumber).getCell(1), {
    value: '봉사단 교육 진행 요약',
    bold: true,
  })
  sheet.getRow(rowNumber).getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }
  sheet.getRow(rowNumber).font = { bold: true, size: 14, color: { argb: TEXT } }
  rowNumber += 1

  const volunteerHeaderRow = sheet.getRow(rowNumber)
  applyCell(volunteerHeaderRow.getCell(1), { value: '구분', bold: true, fill: FILL_HEADER })
  applyCell(volunteerHeaderRow.getCell(2), { fill: FILL_HEADER, bold: true })
  regions.forEach((region, index) => {
    applyCell(volunteerHeaderRow.getCell(3 + index), {
      value: region.label,
      bold: true,
      fill: FILL_HEADER,
    })
  })
  applyCell(volunteerHeaderRow.getCell(lastCol), {
    value: '합계',
    bold: true,
    fill: FILL_HEADER,
  })
  sheet.mergeCells(rowNumber, 1, rowNumber, 2)
  rowNumber += 1

  for (const volunteerRow of input.volunteerSummary.rows) {
    const excelRow = sheet.getRow(rowNumber)
    const fill = volunteerRow.tone ? TONE_FILL[volunteerRow.tone] : FILL_WHITE
    applyCell(excelRow.getCell(1), { value: volunteerRow.label, fill })
    applyCell(excelRow.getCell(2), { fill })
    sheet.mergeCells(rowNumber, 1, rowNumber, 2)

    if (volunteerRow.mergedTotalOnly) {
      paintRange(sheet, rowNumber, 3, rowNumber, lastCol, { fill: FILL_WHITE, bold: true })
      sheet.mergeCells(rowNumber, 3, rowNumber, lastCol)
      const totalNumeric = typeof volunteerRow.row.total === 'number'
      applyCell(excelRow.getCell(3), {
        value: summaryExcelValue(volunteerRow.row.total),
        bold: true,
        fill: FILL_WHITE,
        fontColor: TEXT_MINT,
        numFmt: totalNumeric ? '#,##0' : undefined,
      })
    } else {
      writeRegionDataCells(
        excelRow,
        3,
        regionValuesInOrder(volunteerRow.row, regionKeys),
        volunteerRow.row.total,
        { fill: FILL_WHITE }
      )
    }
    rowNumber += 1
  }

  sheet.getRow(schoolHeaderRowNumber).height = 22
  return workbook
}

export async function downloadUjatEducationProgressSummaryExcel(input: {
  regions: readonly UjatEducationProgressColumnRegion[]
  schoolSummary: UjatEducationProgressSchoolSummary
  volunteerSummary: UjatEducationProgressVolunteerSummary
}): Promise<void> {
  const workbook = buildUjatEducationProgressSummaryWorkbook(input)
  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(
    excelJsBufferToArrayBuffer(buffer),
    buildEducationProgressSummaryExcelFilename(),
    { accessLog: { downloadKind: 'PROGRAM_PROGRESS_SUMMARY_EXPORT', containedPiiTypes: [] } }
  )
}
