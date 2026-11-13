import { useCmsAlert } from '@/shared/ui'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import {
  PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE,
  PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED,
} from '@/shared/lib/program-edit-window-error-message'
import { isFormTemplatePublishAfterSaveError } from '@/features/template/api/form-template-publish-after-save-error'

const APPLICATION_FORM_WRITE_CONFLICT_CODES = new Set([
  PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_INSTRUCTOR_RECRUITMENT_EDIT_PERIOD_ENDED,
  PROGRAM_VOLUNTEER_RECRUITMENT_EDIT_PERIOD_ENDED,
])

function resolveSaveFailureMessage(error?: unknown): string {
  if (isFormTemplatePublishAfterSaveError(error)) {
    return error.message
  }
  const code = getApiErrorCode(error)
  if (
    getApiErrorHttpStatus(error) === 409 &&
    code != null &&
    APPLICATION_FORM_WRITE_CONFLICT_CODES.has(code)
  ) {
    return readApiErrorAlertMessage(error, PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE)
  }
  if (code === 'FORM_SCHEMA_IMMUTABLE') {
    return (
      extractApiErrorMessage(error) ||
      '신청 양식의 시스템 항목 구조는 변경할 수 없습니다. 안내 문구 수정·신규 단락 추가만 가능합니다. 공용 카탈로그가 아닌 프로그램 전용 양식 버전에 저장되는지 확인해 주세요.'
    )
  }
  if (code === 'OPERATION_NOT_ALLOWED') {
    return (
      extractApiErrorMessage(error) ||
      '이 프로그램의 양식 바인딩은 수정할 수 없습니다. 프로그램 등록 시 반영된 전용 양식이 없으면 관리자에게 문의해 주세요.'
    )
  }
  const message = extractApiErrorMessage(error)
  if (error instanceof Error && error.message.trim() !== '') {
    // Preflight guards are local Error instances carrying the same policy
    // message as the backend. Do not replace that message with the generic
    // extractor fallback before showing the save failure.
    if (message === '요청 처리에 실패했습니다.') return error.message
  }
  if (message.trim() !== '') return message
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }
  return '양식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.'
}

/** 양식 저장 완료 안내 — 기본 */
export const FORM_TEMPLATE_SAVE_SUCCESS_COPY = {
  title: '저장',
  content: '양식이 저장되었습니다.',
} as const

/** 동의 양식 편집기 저장 완료 안내 (QA 261113 #36) */
export const AGREEMENT_TEMPLATE_SAVE_SUCCESS_COPY = {
  title: '저장 완료',
  content: '저장되었습니다.',
} as const

export function useFormTemplateSaveFeedback() {
  const { showAlert } = useCmsAlert()

  const showSaveSuccess = (
    onConfirm?: () => void,
    copy: { title: string; content: string } = FORM_TEMPLATE_SAVE_SUCCESS_COPY
  ) => {
    showAlert({
      title: copy.title,
      content: copy.content,
      onConfirm,
    })
  }

  const showSaveFailure = (error?: unknown) => {
    showAlert({
      title: '저장 실패',
      content: resolveSaveFailureMessage(error),
    })
  }

  return { showSaveSuccess, showSaveFailure }
}
