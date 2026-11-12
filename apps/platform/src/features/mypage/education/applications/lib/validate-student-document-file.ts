import { validateStudentRosterUploadFile } from './student-roster-upload-policy'
import { PORTRAIT_CONSENT_UPLOAD_EXTENSIONS } from './student-documents-template-download'
import { FILE_UPLOAD_MAX_BYTES } from '@/shared/lib/file-upload-policy'

function isWithinSize(file: File): boolean {
  return file.size > 0 && file.size <= FILE_UPLOAD_MAX_BYTES
}

export function validateStudentRosterImportFile(file: File): string | null {
  return validateStudentRosterUploadFile(file)
}

export function validatePortraitConsentUploadFile(file: File): string | null {
  if (!isWithinSize(file)) {
    return '초상권 동의서 파일은 20MB 이하만 업로드할 수 있습니다.'
  }
  const extension = file.name.trim().toLowerCase().split('.').pop() ?? ''
  if (!(PORTRAIT_CONSENT_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
    return '초상권 동의서는 PDF, JPG, PNG 파일만 업로드할 수 있습니다.'
  }
  return null
}
