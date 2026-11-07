import ExcelJS from '@zurmokeeper/exceljs'
import {
  GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS,
  normalizeUploadHeader,
} from './upload-column-spec'
import { sanitizeXlsxBufferForExcelJs } from './sanitize-xlsx-for-exceljs'
import type { GeminiPerformanceUploadRow } from '../../model/performance/types'
import { GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE } from './import-popup-copy'
import { formatExcelDateValue, toJavaLocalTime } from './import-wire-values'

export {
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE,
  GEMINI_PERFORMANCE_INVALID_TEMPLATE_TITLE,
  GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_MESSAGE,
  GEMINI_PERFORMANCE_INSTRUCTOR_MISMATCH_TITLE,
} from './import-popup-copy'

type HeaderMap = Partial<Record<keyof typeof GEMINI_PERFORMANCE_UPLOAD_COLUMNS, number>>

function buildHeaderMap(headerRow: ExcelJS.Row): HeaderMap {
  const map: HeaderMap = {}
  const normalizedEntries = Object.entries(GEMINI_PERFORMANCE_UPLOAD_COLUMNS) as Array<
    [keyof typeof GEMINI_PERFORMANCE_UPLOAD_COLUMNS, string]
  >

  headerRow.eachCell((cell, colNumber) => {
    const headerText = normalizeUploadHeader(cell.text ?? '')
    if (!headerText) return

    for (const [key, label] of normalizedEntries) {
      if (normalizeUploadHeader(label) === headerText) {
        map[key] = colNumber
      }
    }
  })

  return map
}

function validateRequiredHeaders(headerMap: HeaderMap): void {
  const missing = GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS.filter(label => {
    const normalizedLabel = normalizeUploadHeader(label)
    const key = (
      Object.keys(GEMINI_PERFORMANCE_UPLOAD_COLUMNS) as Array<
        keyof typeof GEMINI_PERFORMANCE_UPLOAD_COLUMNS
      >
    ).find(k => normalizeUploadHeader(GEMINI_PERFORMANCE_UPLOAD_COLUMNS[k]) === normalizedLabel)
    return key ? headerMap[key] == null : true
  })

  if (missing.length > 0) {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }
}

function unwrapExcelValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return null
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map(part => part.text).join('')
  }
  if (typeof value === 'object' && 'result' in value) {
    return unwrapExcelValue(value.result as ExcelJS.CellValue)
  }
  if (typeof value === 'object' && 'text' in value && 'hyperlink' in value) {
    return value.text
  }
  return value
}

function getCellText(row: ExcelJS.Row, colNumber: number | undefined): string {
  if (colNumber == null) return ''
  const cell = row.getCell(colNumber)
  const value = unwrapExcelValue(cell.value)
  if (value instanceof Date) {
    return formatExcelDateValue(value) ?? ''
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const asDate = formatExcelDateValue(value)
    if (asDate) return asDate
    return String(value)
  }
  if (typeof value === 'string') return value.trim()
  return cell.text?.trim() ?? ''
}

/** 서버 강사 판정에 사용하는 엑셀 원문. 표시용 텍스트처럼 trim/정규화하지 않는다. */
function getCellRawText(row: ExcelJS.Row, colNumber: number | undefined): string {
  if (colNumber == null) return ''
  const cell = row.getCell(colNumber)
  const value = unwrapExcelValue(cell.value)
  if (value instanceof Date) {
    return formatExcelDateValue(value) ?? ''
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return cell.text ?? String(value)
  }
  if (typeof value === 'string') return value
  return cell.text ?? ''
}

function getDateCellText(row: ExcelJS.Row, colNumber: number | undefined): string {
  if (colNumber == null) return ''
  const cell = row.getCell(colNumber)
  return formatExcelDateValue(unwrapExcelValue(cell.value)) ?? getCellText(row, colNumber)
}

function getTimeCellText(row: ExcelJS.Row, colNumber: number | undefined): string {
  const raw = getCellText(row, colNumber)
  if (!raw) return ''
  return toJavaLocalTime(raw)?.slice(0, 5) ?? raw
}

function parseOptionalNumberCell(row: ExcelJS.Row, colNumber: number | undefined): number | null {
  const raw = getCellText(row, colNumber)
  if (!raw) return null
  const value = Number(raw.replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}

/** 강사 미기재 실적만 행도 살리므로, 교육 일정·장소 기준으로 빈 행을 판별한다. */
function isEmptyUploadRow(row: ExcelJS.Row, headerMap: HeaderMap): boolean {
  const contentKeys = [
    'trainingDate',
    'trainingLocation',
    'trainingStartTime',
    'trainingEndTime',
    'school',
  ] as const satisfies ReadonlyArray<keyof HeaderMap>

  return contentKeys.every(key => !getCellText(row, headerMap[key]))
}

export async function parseUploadExcel(file: File): Promise<GeminiPerformanceUploadRow[]> {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (extension !== '.xlsx' && extension !== '.xls') {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(await sanitizeXlsxBufferForExcelJs(buffer))
  } catch {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }

  const headerMap = buildHeaderMap(worksheet.getRow(1))
  validateRequiredHeaders(headerMap)

  const rows: GeminiPerformanceUploadRow[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    if (isEmptyUploadRow(row, headerMap)) return

    rows.push({
      timestamp: getCellText(row, headerMap.timestamp),
      instructorName: getCellRawText(row, headerMap.instructorName),
      assistantInstructorNames: getCellText(row, headerMap.assistantInstructorNames),
      trainingFormat: getCellText(row, headerMap.trainingFormat),
      contact: getCellRawText(row, headerMap.contact),
      email: getCellText(row, headerMap.email),
      school: getCellText(row, headerMap.school),
      paymentDestination: getCellRawText(row, headerMap.paymentDestination),
      trainingLocation: getCellText(row, headerMap.trainingLocation),
      trainingDate: getDateCellText(row, headerMap.trainingDate),
      trainingStartTime: getTimeCellText(row, headerMap.trainingStartTime),
      trainingEndTime: getTimeCellText(row, headerMap.trainingEndTime),
      classCount: parseOptionalNumberCell(row, headerMap.classCount),
      participantCount: parseOptionalNumberCell(row, headerMap.participantCount),
      trainingPhoto: getCellText(row, headerMap.trainingPhoto) || undefined,
      trainingMaterials: getCellText(row, headerMap.trainingMaterials) || undefined,
      lectureEvaluation: getCellText(row, headerMap.lectureEvaluation) || undefined,
      trainerSupportNote: getCellText(row, headerMap.trainerSupportNote) || undefined,
    })
  })

  if (rows.length === 0) {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }

  return rows
}
