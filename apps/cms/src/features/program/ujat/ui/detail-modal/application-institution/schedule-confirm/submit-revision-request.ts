import {
  isApiWorkflowConflictError,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'

export const UJAT_REVISION_REQUEST_FAIL_ALERT_TITLE = '수정 요청 실패'
export const UJAT_REVISION_REQUEST_FAIL_ALERT_FALLBACK =
  '수정 요청 전송에 실패했습니다. 다시 시도해 주세요.'

export type SubmitUjatScheduleConfirmRevisionRequestResult = 'success' | 'conflict' | 'retryable'

export async function submitUjatScheduleConfirmRevisionRequest(input: {
  request: () => Promise<unknown>
  invalidate: () => void | Promise<unknown>
  onStatusUpdated: () => void
  closeModal: () => void
  showAlert: (alert: { title: string; content: string }) => void
  institutionName: string
}): Promise<SubmitUjatScheduleConfirmRevisionRequestResult> {
  try {
    await input.request()
  } catch (error) {
    await input.invalidate()
    const conflict = isApiWorkflowConflictError(error)
    if (conflict) {
      input.closeModal()
    }
    input.showAlert({
      title: UJAT_REVISION_REQUEST_FAIL_ALERT_TITLE,
      content: readApiErrorAlertMessage(error, UJAT_REVISION_REQUEST_FAIL_ALERT_FALLBACK),
    })
    return conflict ? 'conflict' : 'retryable'
  }

  void input.invalidate()
  input.onStatusUpdated()
  input.closeModal()
  input.showAlert({
    title: '수정 요청',
    content: `[${input.institutionName}] 담당교사님에게 수정 요청이 전달되었습니다.`,
  })
  return 'success'
}
