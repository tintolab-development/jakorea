import type { FileUploadResult } from '@/entities/application/api/file-upload-service'

/**
 * @deprecated 인증서 설정은 `persistWritingFormTemplateDraft` → version PUT `settingsJson`만 사용.
 * 이 스텁은 호출부가 남아 있지 않으며, 신규 코드에서 쓰지 않는다.
 */
export interface FormTemplateSavePayload {
  orgLogo?: FileUploadResult
  orgLogo02?: FileUploadResult
  certificateBackground?: FileUploadResult
  chairmanSeal?: FileUploadResult
}

/**
 * @deprecated No-op. Use certificate modal `persistWritingFormTemplateDraft` + remote PUT.
 */
export async function saveFormTemplateSettings(_payload: FormTemplateSavePayload): Promise<void> {
  if (import.meta.env.DEV) {
    console.warn(
      '[form-template] saveFormTemplateSettings is deprecated; settingsJson is saved via form-template version API'
    )
  }
}
