/** BE `student-roster-import-contract`와 동일한 Portal 업로드 제한 */
import { FILE_UPLOAD_MAX_BYTES } from '../../../../../shared/lib/file-upload-policy.ts'

export const STUDENT_ROSTER_UPLOAD_MAX_BYTES = FILE_UPLOAD_MAX_BYTES
export const STUDENT_ROSTER_UPLOAD_MAX_ROWS = 500

export const STUDENT_ROSTER_FILE_ACCEPT =
  '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const STUDENT_ROSTER_ALLOWED_FILE_TYPES = [
  {
    extensions: ['xlsx'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  { extensions: ['csv'], contentType: 'text/csv' },
] as const

const ALLOWED_EXTENSIONS = new Set(['xlsx', 'csv'])

function fileExtension(fileName: string): string {
  const trimmed = fileName.trim()
  const dot = trimmed.lastIndexOf('.')
  if (dot < 0 || dot === trimmed.length - 1) return ''
  return trimmed.slice(dot + 1).toLowerCase()
}

/** 클라이언트에서 막을 수 있는 항목만 검사. 행 수·내용 검증은 import API. */
export function validateStudentRosterUploadFile(file: File): string | null {
  const ext = fileExtension(file.name)
  if (ext === 'xls') {
    return '구형 Excel(.xls)은 지원하지 않습니다. XLSX 또는 CSV 양식을 사용해 주세요.'
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return '학생 명단은 XLSX 또는 CSV 파일만 업로드할 수 있습니다.'
  }
  if (file.size > STUDENT_ROSTER_UPLOAD_MAX_BYTES) {
    return '학생 명단 파일은 20MB 이하만 업로드할 수 있습니다.'
  }
  if (file.size <= 0) {
    return '비어 있는 파일은 업로드할 수 없습니다.'
  }
  return null
}

export const STUDENT_ROSTER_UPLOAD_HINT =
  'XLSX·CSV, 최대 20MB, 학생 500명까지. 양식의 첫 번째 시트에 데이터를 작성해 주세요. (구형 .xls 미지원)'
