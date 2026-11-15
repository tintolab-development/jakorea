import { validateStudentRosterUploadFile } from './student-roster-upload-policy'
import { PORTRAIT_CONSENT_UPLOAD_EXTENSIONS } from './student-documents-template-download'
import { FILE_UPLOAD_MAX_BYTES } from '@/shared/lib/file-upload-policy'

function isWithinSize(file: File): boolean {
  return file.size > 0 && file.size <= FILE_UPLOAD_MAX_BYTES
}

export function validateStudentRosterImportFile(file: File): string | null {
  return validateStudentRosterUploadFile(file)
}

/** 「파일 형식이 맞지 않는 경우」 팝업 설명에 넣는 초상권 동의서 허용 형식 */
export const PORTRAIT_CONSENT_FILE_FORMATS_LABEL = 'PDF, JPG, PNG'

/** 초상권 동의서 허용 형식인지 — 아니면 시안 「파일 형식이 맞지 않는 경우」 팝업 */
export function isPortraitConsentUploadFileTypeAllowed(file: File): boolean {
  const extension = file.name.trim().toLowerCase().split('.').pop() ?? ''
  return (PORTRAIT_CONSENT_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)
}

/** 형식 외 검사(용량). 형식은 `isPortraitConsentUploadFileTypeAllowed`로 먼저 본다. */
export function validatePortraitConsentUploadFile(file: File): string | null {
  if (!isWithinSize(file)) {
    return '초상권 동의서 파일은 20MB 이하만 업로드할 수 있습니다.'
  }
  return null
}
