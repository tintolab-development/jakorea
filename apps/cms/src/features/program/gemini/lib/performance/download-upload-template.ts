import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel } from '@/shared/utils/file-download'
import {
  GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS,
} from './upload-column-spec'

export const GEMINI_PERFORMANCE_UPLOAD_TEMPLATE_FILE_NAME = 'Gemini_연수보고서_업로드_양식.xlsx'

export async function downloadGeminiPerformanceUploadTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('연수보고서')
  const headers = Object.values(GEMINI_PERFORMANCE_UPLOAD_COLUMNS)
  const required = new Set(GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS.map(label => label.trim()))
  sheet.addRow(headers.map(header => (required.has(header) ? `${header}*` : header)))
  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(
    buffer as unknown as ArrayBuffer,
    GEMINI_PERFORMANCE_UPLOAD_TEMPLATE_FILE_NAME,
  )
}
