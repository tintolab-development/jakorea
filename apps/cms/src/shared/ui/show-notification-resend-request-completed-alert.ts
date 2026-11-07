/**
 * 「알림 재발송 안내」에서 재발송 요청 API 성공 후 공통 안내.
 * 최초 발송(승인·반려·수동 발송)과 문구·CTA를 분리한다.
 */

import { cmsAlertModal } from './cms-alert-modal-api'

export const NOTIFICATION_RESEND_REQUEST_COMPLETED_TITLE = '재발송 요청 완료'

export const NOTIFICATION_RESEND_REQUEST_COMPLETED_MESSAGE =
  '재발송 요청이 정상적으로 접수되었습니다.\n실제 발송 결과(성공/실패)는 발송 이력에서 확인해 주세요.'

export function showNotificationResendRequestCompletedAlert(options?: {
  onConfirm?: () => void
}): void {
  cmsAlertModal.show({
    title: NOTIFICATION_RESEND_REQUEST_COMPLETED_TITLE,
    content: NOTIFICATION_RESEND_REQUEST_COMPLETED_MESSAGE,
    confirmLabel: '확인',
    onConfirm: options?.onConfirm,
  })
}
