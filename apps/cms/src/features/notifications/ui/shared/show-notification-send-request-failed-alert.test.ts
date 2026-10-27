/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { showNotificationSendErrorAlert } from './show-notification-send-request-failed-alert'
import { CMS_ALERT_MODAL_CLOSED_EVENT } from '@/shared/ui/cms-alert-modal-api'
import {
  NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
  NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
  NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
} from '@/features/notifications/model/shared/send-request-completed-copy'

function apiError(status: number, code: string, message?: string) {
  return {
    response: {
      status,
      data: { success: false, data: null, error: { code, message: message ?? code } },
    },
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

  it('알림톡 변수 스코프 차단 400은 일반 네트워크 안내가 아니라 템플릿 재확인 안내와 포커스를 쓴다', () => {
    vi.useFakeTimers()
    const trigger = document.createElement('span')
    trigger.className = 'send-template-select-field__trigger'
    trigger.tabIndex = 0
    document.body.appendChild(trigger)
    const showAlert = vi.fn()

    showNotificationSendErrorAlert(
      showAlert,
      apiError(
        400,
        'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED',
        'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:참여자 모집 문의처명'
      )
    )

    expect(showAlert).toHaveBeenCalledWith({
      title: '안내',
      content:
        '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.\n사용할 수 없는 변수: 참여자 모집 문의처명',
    })
    window.dispatchEvent(new Event(CMS_ALERT_MODAL_CLOSED_EVENT))
    vi.runAllTimers()
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
    vi.useRealTimers()
  })

  it('미등록 발송 오류 코드는 공통 처리 실패 안내를 유지한다', () => {
    const showAlert = vi.fn()
    showNotificationSendErrorAlert(showAlert, apiError(503, 'PROVIDER_UNAVAILABLE'))
    expect(showAlert).toHaveBeenCalledWith({
      title: NOTIFICATION_SEND_REQUEST_FAILED_TITLE,
      content: NOTIFICATION_SEND_REQUEST_FAILED_MESSAGE,
      confirmLabel: NOTIFICATION_SEND_REQUEST_FAILED_CONFIRM_LABEL,
    })
  })
})
