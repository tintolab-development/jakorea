/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { showNotificationSendErrorAlert } from './show-notification-send-request-failed-alert'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from '@/shared/ui/cms-alert-modal-api'

function apiError(status: number, code: string) {
  return {
    response: { status, data: { success: false, data: null, error: { code, message: code } } },
  }
}

describe('showNotificationSendErrorAlert', () => {
  it('프로그램 필요 변수 400은 성공 처리 없이 키 안내 후 프로그램 필드로 포커스한다', () => {
    vi.useFakeTimers()
    const trigger = document.createElement('span')
    trigger.className = 'mail-send-program-select-field__trigger'
    trigger.tabIndex = 0
    document.body.appendChild(trigger)
    const showAlert = vi.fn()

    showNotificationSendErrorAlert(
      showAlert,
      apiError(400, 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:프로그램명')
    )

    expect(showAlert).toHaveBeenCalledWith({
      title: '안내',
      content: '프로그램 필수 변수가 있어 프로그램을 선택하세요: 프로그램명',
    })
    window.dispatchEvent(new Event(CMS_ALERT_MODAL_CLOSED_EVENT))
    vi.runAllTimers()
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
    vi.useRealTimers()
  })
})
