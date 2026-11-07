import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cmsAlertModal } from './cms-alert-modal-api'
import {
  NOTIFICATION_RESEND_REQUEST_COMPLETED_MESSAGE,
  NOTIFICATION_RESEND_REQUEST_COMPLETED_TITLE,
  showNotificationResendRequestCompletedAlert,
} from './show-notification-resend-request-completed-alert'

describe('showNotificationResendRequestCompletedAlert', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('재발송 요청 완료 안내를 공통 Alert로 띄운다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)

    showNotificationResendRequestCompletedAlert()

    expect(show).toHaveBeenCalledTimes(1)
    expect(show).toHaveBeenCalledWith({
      title: NOTIFICATION_RESEND_REQUEST_COMPLETED_TITLE,
      content: NOTIFICATION_RESEND_REQUEST_COMPLETED_MESSAGE,
      confirmLabel: '확인',
      onConfirm: undefined,
    })
  })
})
