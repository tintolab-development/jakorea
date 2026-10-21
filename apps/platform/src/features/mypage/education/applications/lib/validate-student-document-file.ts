import { validateStudentRosterUploadFile } from './student-roster-upload-policy'
import { PORTRAIT_CONSENT_UPLOAD_EXTENSION } from './student-documents-template-download'

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
  const extension = file.name.trim().toLowerCase().split('.').pop() ?? ''
  if (extension !== PORTRAIT_CONSENT_UPLOAD_EXTENSION) {
    return '초상권 동의서는 다운로드한 ZIP 양식에서 작성한 DOCX 파일만 업로드할 수 있습니다.'
  }
  return null
}
