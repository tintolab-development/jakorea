import { useCmsAlert } from '@/shared/ui'

export function useFormTemplateSaveFeedback() {
  const { showAlert } = useCmsAlert()

  const showSaveSuccess = (onConfirm?: () => void) => {
    showAlert({
      title: '저장',
      content: '양식이 저장되었습니다.',
      onConfirm,
    })
  }

  const showSaveFailure = () => {
    showAlert({
      title: '저장 실패',
      content: '양식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
    })
  }

  return { showSaveSuccess, showSaveFailure }
}
