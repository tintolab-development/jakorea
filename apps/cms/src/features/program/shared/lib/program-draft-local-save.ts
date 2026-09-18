/**
 * 프로그램 등록·모집 등 **프로그램 상세 임시저장** 전용 localStorage API.
 *
 * 양식 관리(`/templates/form-management`) draft는 remote forms-surveys SSOT —
 * `persistWritingFormTemplateDraft` / `loadWritingFormTemplateDraft` 를 `localOnly` 없이 사용한다.
 *
 * 이 모듈은 `localOnly: true` 경로의 진입점이다.
 */
export {
  isLocalStorageQuotaExceededError,
  loadWritingFormTemplateDraft,
  loadWritingFormTemplateSave,
  persistWritingFormTemplateDraft,
  persistWritingFormTemplateSave,
  removeWritingFormTemplateSave,
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
