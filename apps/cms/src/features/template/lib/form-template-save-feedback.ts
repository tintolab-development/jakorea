import { useCmsAlert } from '@/shared/ui'
import {
  extractApiErrorMessage,
  getApiErrorCode,
} from '@/shared/lib/extract-api-error-message'

function resolveSaveFailureMessage(error?: unknown): string {
  const code = getApiErrorCode(error)
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
  if (message.trim() !== '') return message
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }
  return '양식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.'
}

export function useFormTemplateSaveFeedback() {
  const { showAlert } = useCmsAlert()

  const showSaveSuccess = (onConfirm?: () => void) => {
    showAlert({
      title: '저장',
      content: '양식이 저장되었습니다.',
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
