import {
  NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
  NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
  NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
} from '@/features/notifications/model/shared/send-request-completed-copy'
import {
  resolveNotificationSendFieldError,
  type NotificationSendErrorField,
} from '@/features/notifications/api/get-notifications-api-error'
import {
  CMS_ALERT_MODAL_CLOSED_EVENT,
  type CmsAlertModalShowOptions,
} from '@/shared/ui/cms-alert-modal-api'

type ShowAlert = (options: CmsAlertModalShowOptions) => void

/** 발송 배치 POST 실패 — 채널 공통 카피(상세 API 문구는 노출하지 않음) */
export function showNotificationSendRequestFailedAlert(showAlert: ShowAlert): void {
  showAlert({
    title: NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
    content: NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
    confirmLabel: NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
  })
}

/** Alert 닫힘(모달 포커스 복구) 이후 대상 입력으로 포커스 */
function focusAfterAlertClosed(selector: string): void {
  const onClosed = () => {
    window.removeEventListener(CMS_ALERT_MODAL_CLOSED_EVENT, onClosed)
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(selector)?.focus()
    }, 300)
  }
  window.addEventListener(CMS_ALERT_MODAL_CLOSED_EVENT, onClosed)
}

/**
 * 발송 배치 POST 실패 처리.
 * - BE 검증 오류(error.code로 분기)는 BE 문구를 그대로 보여 주고 해당 필드로 포커스
 * - 그 외는 채널 공통 실패 안내
 */
export function showNotificationSendErrorAlert(
  showAlert: ShowAlert,
  error: unknown,
  focusSelectors: Partial<Record<Exclude<NotificationSendErrorField, null>, string>> = {}
): void {
  const fieldError = resolveNotificationSendFieldError(error)
  if (!fieldError) {
    showNotificationSendRequestFailedAlert(showAlert)
    return
  }
  const selector = fieldError.field ? focusSelectors[fieldError.field] : undefined
  if (selector) focusAfterAlertClosed(selector)
  showAlert({ title: '안내', content: fieldError.message })
}
