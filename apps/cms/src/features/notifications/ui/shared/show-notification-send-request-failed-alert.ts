import {
  NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
  NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
  NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
} from '@/features/notifications/model/shared/send-request-completed-copy'
import type { CmsAlertModalShowOptions } from '@/shared/ui/cms-alert-modal-api'

type ShowAlert = (options: CmsAlertModalShowOptions) => void

/** 발송 배치 POST 실패 — 채널 공통 카피(상세 API 문구는 노출하지 않음) */
export function showNotificationSendRequestFailedAlert(showAlert: ShowAlert): void {
  showAlert({
    title: NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
    content: NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
    confirmLabel: NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
  })
}
