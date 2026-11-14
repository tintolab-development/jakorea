import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MESSAGES } from '@/shared/constants/messages'
import { cmsAlertModal } from './cms-alert-modal-api'
import {
  ISSUE_COMPLETED_ALERT_TITLE,
  showIssueCompletedAlert,
} from './show-issue-completed-alert'

describe('showIssueCompletedAlert', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('발급 완료 안내를 공통 Alert로 띄운다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)

    showIssueCompletedAlert()

    expect(show).toHaveBeenCalledTimes(1)
    expect(show).toHaveBeenCalledWith({
      title: ISSUE_COMPLETED_ALERT_TITLE,
      content: '발급되었습니다.',
      confirmLabel: '확인',
      onConfirm: undefined,
    })
    expect(MESSAGES.success.issued).toBe('발급되었습니다.')
  })
  it('확인·닫기 콜백을 그대로 넘긴다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
    const onConfirm = vi.fn()
    const onDismiss = vi.fn()

    showIssueCompletedAlert({ onConfirm, onDismiss })

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ onConfirm, onDismiss }))
  })
})
