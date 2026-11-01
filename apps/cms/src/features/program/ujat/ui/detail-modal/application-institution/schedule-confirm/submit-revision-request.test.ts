import { describe, expect, it, vi } from 'vitest'
import { UJAT_REVISION_REQUEST_DUPLICATE_MESSAGE } from '@/features/program/ujat/lib/ujat-institution-approval-workflow'
import {
  UJAT_REVISION_REQUEST_COMPLETE_ALERT_CONTENT,
  UJAT_REVISION_REQUEST_COMPLETE_ALERT_TITLE,
} from './revision-request-complete'
import {
  submitUjatScheduleConfirmRevisionRequest,
  UJAT_REVISION_REQUEST_FAIL_ALERT_TITLE,
} from './submit-revision-request'

function conflict409() {
  return {
    response: {
      status: 409,
      data: {
        success: false,
        error: { code: 'UJAT_WORKFLOW_STATE_CONFLICT', field: 'status' },
      },
    },
  }
}

describe('submitUjatScheduleConfirmRevisionRequest', () => {
  it('409 field=status면 모달을 닫고 invalidate 1회, 안내 문구를 유지한다', async () => {
    const invalidate = vi.fn().mockResolvedValue(undefined)
    const closeModal = vi.fn()
    const onStatusUpdated = vi.fn()
    const showAlert = vi.fn()

    const result = await submitUjatScheduleConfirmRevisionRequest({
      request: () => Promise.reject(conflict409()),
      invalidate,
      onStatusUpdated,
      closeModal,
      showAlert,
    })

    expect(result).toBe('conflict')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(onStatusUpdated).not.toHaveBeenCalled()
    expect(showAlert).toHaveBeenCalledWith({
      title: UJAT_REVISION_REQUEST_FAIL_ALERT_TITLE,
      content: UJAT_REVISION_REQUEST_DUPLICATE_MESSAGE,
    })
  })

  it('네트워크 오류면 모달을 유지한다', async () => {
    const invalidate = vi.fn().mockResolvedValue(undefined)
    const closeModal = vi.fn()
    const showAlert = vi.fn()

    const result = await submitUjatScheduleConfirmRevisionRequest({
      request: () => Promise.reject(new Error('Network Error')),
      invalidate,
      onStatusUpdated: vi.fn(),
      closeModal,
      showAlert,
    })

    expect(result).toBe('retryable')
    expect(closeModal).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: UJAT_REVISION_REQUEST_FAIL_ALERT_TITLE })
    )
  })

  it('성공하면 invalidate·상태 갱신·모달 닫기·완료 alert를 유지한다', async () => {
    const invalidate = vi.fn().mockResolvedValue(undefined)
    const closeModal = vi.fn()
    const onStatusUpdated = vi.fn()
    const showAlert = vi.fn()

    const result = await submitUjatScheduleConfirmRevisionRequest({
      request: () => Promise.resolve({ ok: true }),
      invalidate,
      onStatusUpdated,
      closeModal,
      showAlert,
    })

    expect(result).toBe('success')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(onStatusUpdated).toHaveBeenCalledTimes(1)
    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith({
      title: UJAT_REVISION_REQUEST_COMPLETE_ALERT_TITLE,
      content: UJAT_REVISION_REQUEST_COMPLETE_ALERT_CONTENT,
    })
  })
})
