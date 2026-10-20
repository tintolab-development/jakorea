import { validateStudentRosterUploadFile } from './student-roster-upload-policy'

const PORTRAIT_NAME_PATTERN = /\.(pdf|jpe?g|png|webp)$/i
const PORTRAIT_MIME_PATTERN = /^(application\/pdf|image\/jpeg|image\/png|image\/webp)$/i

const MAX_FILE_BYTES = 15 * 1024 * 1024

function isWithinSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_BYTES
}

export function validateStudentRosterImportFile(file: File): string | null {
  return validateStudentRosterUploadFile(file)
}

export function validatePortraitConsentUploadFile(file: File): string | null {
  if (!isWithinSize(file)) {
    return '초상권 동의서 파일은 15MB 이하만 업로드할 수 있습니다.'
  }
  const mime = file.type.trim().toLowerCase()
  if (!PORTRAIT_MIME_PATTERN.test(mime) && !PORTRAIT_NAME_PATTERN.test(file.name)) {
    return '초상권 동의서는 PDF, JPG, PNG, WEBP 파일만 업로드할 수 있습니다.'
  }
  return null
}
