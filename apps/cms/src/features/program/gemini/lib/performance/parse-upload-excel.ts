import ExcelJS from '@zurmokeeper/exceljs'
import {
  GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS,
  normalizeUploadHeader,
} from './upload-column-spec'
import type { GeminiPerformanceUploadRow } from '../../model/performance/types'

export const GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE = '업로드 된 양식이 잘못되었습니다.'

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
    const key = (Object.keys(GEMINI_PERFORMANCE_UPLOAD_COLUMNS) as Array<
      keyof typeof GEMINI_PERFORMANCE_UPLOAD_COLUMNS
    >).find(k => normalizeUploadHeader(GEMINI_PERFORMANCE_UPLOAD_COLUMNS[k]) === normalizedLabel)
    return key ? headerMap[key] == null : true
  })

  if (missing.length > 0) {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }
}

function getCellText(row: ExcelJS.Row, colNumber: number | undefined): string {
  if (colNumber == null) return ''
  return row.getCell(colNumber).text?.trim() ?? ''
}

function parseOptionalNumberCell(row: ExcelJS.Row, colNumber: number | undefined): number | null {
  const raw = getCellText(row, colNumber)
  if (!raw) return null
  const value = Number(raw.replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}

function isEmptyUploadRow(row: ExcelJS.Row, headerMap: HeaderMap): boolean {
  const requiredKeys = [
    'instructorName',
    'contact',
    'trainingDate',
    'trainingLocation',
  ] as const satisfies ReadonlyArray<keyof HeaderMap>

  return requiredKeys.every(key => !getCellText(row, headerMap[key]))
}

export async function parseUploadExcel(file: File): Promise<GeminiPerformanceUploadRow[]> {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (extension !== '.xlsx' && extension !== '.xls') {
    throw new Error(GEMINI_PERFORMANCE_INVALID_TEMPLATE_MESSAGE)
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

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
      instructorName: getCellText(row, headerMap.instructorName),
      assistantInstructorNames: getCellText(row, headerMap.assistantInstructorNames),
      trainingFormat: getCellText(row, headerMap.trainingFormat),
      contact: getCellText(row, headerMap.contact),
      email: getCellText(row, headerMap.email),
      school: getCellText(row, headerMap.school),
      paymentDestination: getCellText(row, headerMap.paymentDestination),
      trainingLocation: getCellText(row, headerMap.trainingLocation),
      trainingDate: getCellText(row, headerMap.trainingDate),
      trainingStartTime: getCellText(row, headerMap.trainingStartTime),
      trainingEndTime: getCellText(row, headerMap.trainingEndTime),
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
