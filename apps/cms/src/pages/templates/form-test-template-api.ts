import type { FileUploadResult } from '@/entities/application/api/file-upload-service'

/** 양식 테스트 모달 — 저장 페이로드(로고 업로드 URL 등). 실제 연동 시 API 스키마에 맞게 조정 */
export interface FormTestTemplateSavePayload {
  orgLogo?: FileUploadResult
  orgLogo02?: FileUploadResult
}

/**
 * 양식 테스트 설정 저장 (모의)
 * 실제 환경에서는 템플릿/양식 PATCH 등으로 교체
 */
export async function saveFormTestTemplateSettings(payload: FormTestTemplateSavePayload): Promise<void> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, 350)
  })
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[form-test-template] save', payload)
  }
}
